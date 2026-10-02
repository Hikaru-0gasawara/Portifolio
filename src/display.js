/* Screen presentation only: no changes to canvas resolution, layout or game clocks. */
(function(g){
  // A first visit chooses its language first; then the opening TV turns on, explorable (tv3d.js), speaking that
  // language. Its first channel is the recruiter's glass: three knocks break it and open the recruiter view.
  // Its Enter button tunes the portfolio card, the camera goes into the glass, the gate fades onto the same card
  // and only then the boot starts. Turning the portfolio off runs that backwards: out of the glass, back to the set.
  const storageKey='okaru-display',zoomDuration=1400,revealDuration=320,reducedDuration=120,calmRevealDuration=160,enterTimeout=9000,exitTimeout=7000;
  const modes=[
    {id:'antique',label:'TV antiga',action:'Imagem: TV antiga · alternar',text:'TV antiga: granulação suave, linhas analógicas e cantos escurecidos. Aperte o botão para experimentar a tela de tubo.'},
    {id:'crt',label:'Tubo CRT',action:'Imagem: tubo CRT · alternar',text:'Tubo CRT: linhas finas e um leve brilho nas bordas, com menos granulação. O próximo toque deixa a imagem em alta definição.'},
    {id:'hd',label:'Alta definição',action:'Imagem: alta definição · alternar',text:'Alta definição: imagem limpa, sem granulação nem linhas de TV. A arte e a escala continuam iguais. O próximo toque volta para a TV antiga.'}
  ];
  const valid=id=>modes.some(mode=>mode.id===id);
  function savedMode(){try{const id=g.localStorage.getItem(storageKey);return valid(id)?id:'antique';}catch{return 'antique';}}
  function zoomTransform(screen,viewport){
    if(!screen||!viewport||![screen.left,screen.top,screen.width,screen.height,viewport.left,viewport.top,viewport.width,viewport.height].every(Number.isFinite)||Math.min(screen.width,screen.height,viewport.width,viewport.height)<=1)return null;
    const scale=Math.max(viewport.width/screen.width,viewport.height/screen.height)*1.04;
    return {scale,x:(viewport.width/2-(screen.left-viewport.left+screen.width/2))*scale,y:(viewport.height/2-(screen.top-viewport.top+screen.height/2))*scale};
  }
  // The picture inside the glass is the full-screen card scaled by the zoom factor, so the zoom ends on the same image.
  function pictureScale(screen,viewport){
    if(!(screen?.width>1&&screen?.height>1&&viewport?.width>1&&viewport?.height>1))return null;
    return 1/(Math.max(viewport.width/screen.width,viewport.height/screen.height)*1.04);
  }
  g.PortfolioDisplay={storageKey,zoomDuration,revealDuration,reducedDuration,calmRevealDuration,enterTimeout,exitTimeout,zoomTransform,pictureScale,modes,install(C){
    const p=C.prototype;
    // Capture each method independently so installing another wrapper cannot recurse.
    const wrap=(name,fn)=>{const prior=p[name];p[name]=function(...args){return fn.call(this,prior.bind(this),...args);};};
    p.displayMode=function(){return modes.find(mode=>mode.id===this.st().displayMode)||modes[0];};
    p.clearDisplayTimers=function(){
      for(const key of ['_displayWarmT','_displayZoomT','_displayOpenT','_displayExitT']){clearTimeout(this[key]);this[key]=null;}
    };
    p.tvHost=function(){
      return {ac:()=>this._ac,mix:()=>this._mix,soundOn:()=>this._sndPref!==false&&this._snd!==false,unlock:()=>{if(this._sndPref!==false&&this._snd!==false)this.audio();},
        initialVolume:this.st().displayVolume??4,broken:!!this.st().broke,touch:!!this.coarse?.(),exit:this._displayPhase==='exit',onExited:()=>this.displayExited(),
        onChange:tv=>this.setState({displayPower:tv.power,displayChannel:tv.channel,displayVolume:tv.volume}),
        onKnock:(result,x,y)=>this.displayKnocked(result,x,y),onEnterRequest:()=>this.enterDisplay(),onEntered:()=>this.displayEntered()};
    };
    // The third knock breaks the glass: the portfolio's shards fly out of it and the recruiter view opens over the
    // television. Closing it comes back to the same set; a broken glass then opens the view with one click.
    p.displayKnocked=function(result,x,y){
      if(!this._displayStarting||this._displayPhase!=='idle'||this._dead)return;
      if(result==='crack'){this.setState({displayKnocks:(this.st().displayKnocks||0)+1});return;}
      if(result==='open'){this.openRec();return;}
      if(result!=='break')return;
      const root=this._rootEl?.getBoundingClientRect?.(),inside=root&&Number.isFinite(x)&&Number.isFinite(y);
      this.setState({displayKnocks:0});
      this.breakGlass(inside?Math.round(x-root.left):Math.round((root?.width||1440)/2),inside?Math.round(y-root.top):Math.round((root?.height||900)*.42));
    };
    // Without a television object (tests, very old browsers) three presses still break the glass.
    p.displayKnock=function(){
      if(!this._displayStarting||this._displayPhase!=='idle'||this._dead)return;
      if(this._sndPref!==false&&this._snd!==false)this.audio();
      if(this._tv){this._tv.knock();return;}
      const s=this.st();if((s.displayChannel??0)!==0||s.displayPower==='off')return;
      if(s.broke){this.displayKnocked('open');return;}
      this.displayKnocked((s.displayKnocks||0)+1>=(g.PortfolioTV?.knocks||3)?'break':'crack');
    };
    // The CSS fallback television: a click on its glass knocks where it lands.
    p.displayScreenClick=function(e){
      if(!this._tv||this._tvGl)return this.displayKnock();
      const r=e?.currentTarget?.getBoundingClientRect?.();
      if(!r?.width||!r?.height)return this._tv.knock();
      this._tv.knock((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,e.clientX,e.clientY);
    };
    // A recruiter link leaves the television straight for its page: no entry animation and no boot behind it.
    p.leaveDisplay=function(){
      if(!this._displayStarting)return;
      this._displayStarting=false;this._displayAnimating=false;this._displayPhase='done';
      this.clearDisplayTimers();this._tv?.destroy();this._tv=null;
      this.setState({displayStarting:false,displayAnimating:false});
    };
    // The 3D stage mounts once per opening; without WebGL the CSS television stays as the fallback.
    p.displayStage=function(el){
      if(!el){return;}
      if(this._tv||!this._displayStarting||!g.PortfolioTV)return;
      this._tv=g.PortfolioTV.create(el,this.tvHost());this._tvGl=!!this._tv?.gl;
      if(this._tv&&!this._tvGl&&this._displayTvScreen&&!this._displayTvScreen.contains(this._tv.screen))this._displayTvScreen.appendChild(this._tv.screen);
      // Coming back out of the portfolio: WebGL pulls its own camera back; the CSS fallback zooms out of its glass,
      // measured once its television is shown (a previous WebGL set may still be hiding it on this first render).
      this.setState({displayGl:this._tvGl},()=>{if(this._displayPhase==='exit'&&this._tv&&!this._tvGl)this.displayFallbackExit(el);});
      if(this._displayPhase==='exit'&&!this._tv)this.displayExited();
    };
    // The reverse of the fallback's zoom: from the glass filling the viewport back to the whole set.
    p.displayFallbackExit=function(stage){
      const gate=stage?.parentElement,camera=gate?.querySelector?.('.tv-camera'),screen=gate?.querySelector?.('.vintage-screen');
      const zoom=zoomTransform(screen?.getBoundingClientRect?.(),this._rootEl?.getBoundingClientRect?.());
      if(!camera?.animate||!zoom)return;
      camera.animate([{transform:'translate('+zoom.x+'px,'+zoom.y+'px) scale('+zoom.scale+')'},{transform:'none'}],
        {duration:zoomDuration,delay:g.PortfolioTV?.durations?.EXIT_HOLD??300,easing:'cubic-bezier(.77,0,.175,1)',fill:'backwards'});
    };
    p.displayExited=function(){
      if(!this._displayStarting||this._displayPhase!=='exit'||this._dead)return;
      clearTimeout(this._displayExitT);this._displayExitT=null;
      this._displayPhase='idle';this._displayAnimating=false;
      this.setState({displayPhase:'idle',displayAnimating:false},()=>this.focusRoot());
    };
    p.displayAction=function(name){
      if(!this._displayStarting||this._displayPhase!=='idle'||this._dead)return;
      // The dock buttons are a gesture too: they unlock the set's sound and its theme.
      if(this._sndPref!==false&&this._snd!==false)this.audio();
      if(this._tv){this._tv.press(name);return;}
      // Without a television object (tests, very old browsers) the controls still keep their state.
      const s=this.st(),count=g.PortfolioTV?.channels?.length||6;
      if(name==='power')this.setState({displayPower:s.displayPower==='off'?'on':'off'});
      if(name.startsWith('channel'))this.setState({displayChannel:((s.displayChannel??0)+(name==='channel+'?1:count-1))%count});
      if(name.startsWith('volume'))this.setState({displayVolume:Math.max(0,Math.min(10,(s.displayVolume??4)+(name==='volume+'?1:-1)))});
    };
    p.enterDisplay=function(){
      if(!this._displayStarting||this._displayPhase!=='idle'||this._dead)return;
      if(this._sndPref!==false&&this._snd!==false)this.audio();
      this._displayPhase='entering';this._displayAnimating=true;this.setState({displayPhase:'entering',displayAnimating:true});
      this._displayWarmT=setTimeout(()=>this.displayEntered(),enterTimeout);
      if(!this._tv){this.displayEntered();return;}
      const screen=this._displayTvScreen,root=this._rootEl,k=pictureScale({width:screen?.offsetWidth,height:screen?.offsetHeight},{width:root?.offsetWidth,height:root?.offsetHeight});
      this._tv.enter({reduced:this._displayReduced,cardPx:this._tvGl?undefined:k&&screen?.offsetHeight?48*360*k/screen.offsetHeight:undefined});
    };
    // The television has the card on screen: WebGL already flew into the glass; the CSS fallback zooms now.
    p.displayEntered=function(){
      if(!this._displayStarting||this._displayPhase!=='entering'||this._dead)return;
      clearTimeout(this._displayWarmT);this._displayWarmT=null;
      if(this._tvGl)this.beginDisplayOpening();else this.prepareDisplayZoom();
    };
    p.prepareDisplayZoom=function(){
      if(!this._displayStarting||this._displayPhase!=='entering'||this._dead)return;
      const zoom=zoomTransform(this._displayTvScreen?.getBoundingClientRect?.(),this._rootEl?.getBoundingClientRect?.());
      this._displayCamera=zoom?'transform:translate('+zoom.x+'px,'+zoom.y+'px) scale('+zoom.scale+')':'transform:scale(8)';
      this._displayPhase='zoom';this.setState({displayPhase:'zoom'});
      this._displayZoomT=setTimeout(()=>this.beginDisplayOpening(),(this._displayReduced?reducedDuration:zoomDuration)+160);
    };
    p.beginDisplayOpening=function(){
      if(!this._displayStarting||!['zoom','entering'].includes(this._displayPhase)||this._dead)return;
      this.clearDisplayTimers();
      this._displayPhase='reveal';this.setState({displayPhase:'reveal'});
      this._displayOpenT=setTimeout(()=>this.finishDisplayOpening(),(this._displayReduced?calmRevealDuration:revealDuration)+200);
    };
    p.finishDisplayOpening=function(){
      if(!this._displayStarting||this._displayPhase!=='reveal'||this._dead)return;
      this._displayStarting=false;this._displayAnimating=false;this._displayPhase='done';
      this.clearDisplayTimers();this._tv?.destroy();this._tv=null;
      this.setState({displayStarting:false,displayAnimating:false},()=>this.focusRoot());
      // Do not consume a boot, persist its marker or run any log timers behind the opening.
      if(this._languageReady)this.bootLogStart();
    };
    // Holding the power button turns the portfolio off back to this television: the picture has just collapsed into
    // a dot, so the camera starts inside the glass and pulls back out of it, the reverse of the entry, while the set
    // warms up again. With Movimento reduzido the set simply fades in, already on. Enter boots it once more; the
    // language stays chosen, so the boot follows straight after the entry.
    p.reopenDisplay=function(){
      if(this._displayStarting||this._dead)return;
      this.clearDisplayTimers();this._tv?.destroy();this._tv=null;this.stopMusic();
      this._displayReduced=this.calm();
      const out=!this._displayReduced;
      this._displayStarting=true;this._displayAnimating=out;this._displayPhase=out?'exit':'idle';this._displayCamera='';this._displayReturned=!out;this._displayArrive=false;
      if(out)this._displayExitT=setTimeout(()=>this.displayExited(),exitTimeout);
      this.setState({displayStarting:true,displayAnimating:out,displayPhase:this._displayPhase,displayPower:'on',displayChannel:0},()=>this.focusRoot());
    };
    wrap('componentDidMount',function(fn){
      this._displayStarting=true;this._displayAnimating=false;this._displayPhase='idle';
      // Follows the portfolio Movimento setting, like the room and the desktop.
      this._displayReduced=this.calm();
      this.setState({displayStarting:true,displayMode:savedMode(),displayPower:'on',displayChannel:0,displayVolume:4});
      fn();
    });
    wrap('componentWillUnmount',function(fn){
      this._displayStarting=false;this._displayAnimating=false;
      this.clearDisplayTimers();this._tv?.destroy();this._tv=null;this._displayKnobDrag=null;this._displayTvScreen=null;return fn();
    });
    wrap('bootLogStart',function(fn){if(!this._displayStarting)return fn();});
    // The first language choice turns the television on (the gate waits for it); the boot still waits for Enter.
    wrap('chooseLanguage',function(fn,...args){
      const arriving=this._displayStarting&&!this._languageReady;
      const r=fn(...args);
      if(arriving&&this._languageReady){this._displayArrive=true;this.setState({displayArrive:true});}
      return r;
    });
    wrap('recGo',function(fn,...args){this.leaveDisplay();return fn(...args);});
    const keys={PageUp:'channel+',']':'channel+',PageDown:'channel-','[':'channel-','+':'volume+','=':'volume+','-':'volume-',p:'power',P:'power'};
    const orbit={ArrowLeft:[-.18,0],ArrowRight:[.18,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]};
    wrap('rootKey',function(fn,e){
      // The language screen before the television and the recruiter view over it keep their own keys.
      if(this._displayStarting&&(this.st().languageOpen||this.st().recOpen))return fn(e);
      if(this._displayStarting){
        if(this._displayPhase==='idle'){
          if(e.key==='Tab'||e.ctrlKey||e.metaKey||e.altKey)return;
          // Native buttons handle their own Enter/space; Enter anywhere else enters the portfolio.
          if(e.target?.closest?.('button'))return;
          if(e.key==='Enter'&&!e.repeat){e.preventDefault();this.enterDisplay();return;}
          if(keys[e.key]){e.preventDefault();this.audio?.();this.displayAction(keys[e.key]);return;}
          if(orbit[e.key]){e.preventDefault();this._tv?.orbit(...orbit[e.key]);}
        }else if(!e.ctrlKey&&!e.metaKey&&!e.altKey)e.preventDefault();
        return;
      }
      return fn(e);
    });
    // The CSS fallback keeps its physical dials: click turns, the volume dial also drags and takes arrow keys.
    p.turnDisplayKnob=function(kind){
      if(kind==='volume'&&this._displayKnobSkipClick){this._displayKnobSkipClick=false;return;}
      this._displayKnobSkipClick=false;
      if(kind==='channel')this.displayAction('channel+');
      if(kind==='volume')this.displayAction((this.st().displayVolume??4)>=10?'volume-':'volume+');
    };
    p.displayVolumeDown=function(e){
      if(this._displayPhase!=='idle'||(e.button!==undefined&&e.button!==0))return;
      this._displayKnobSkipClick=false;this._displayKnobDrag={id:e.pointerId,y:e.clientY,x:e.clientX,moved:false,steps:0};
      e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    p.displayVolumeMove=function(e){
      const drag=this._displayKnobDrag;if(!drag||drag.id!==e.pointerId||this._displayPhase!=='idle')return;
      const steps=Math.round((drag.y-e.clientY+(e.clientX-drag.x)*.5)/8);if(steps!==0)drag.moved=true;
      while(drag.steps<steps){drag.steps++;this.displayAction('volume+');}while(drag.steps>steps){drag.steps--;this.displayAction('volume-');}
    };
    p.displayVolumeUp=function(e){
      const drag=this._displayKnobDrag;if(!drag||drag.id!==e.pointerId)return;
      this._displayKnobSkipClick=drag.moved;this._displayKnobDrag=null;
      if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
    };
    p.displayVolumeKey=function(e){
      if(this._displayPhase!=='idle')return;
      const step={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1}[e.key];if(step===undefined)return;
      e.preventDefault();e.stopPropagation();this.displayAction(step>0?'volume+':'volume-');
    };
    wrap('data',function(fn){
      const d=fn();
      if(!d.displayEnhanced){
        d.displayEnhanced=true;
        const tv=d.room.find(o=>o.id==='tv');
        tv.text='Uma TV, três jeitos de ver o portfólio. O botão alterna entre TV antiga, tubo CRT e alta definição. A sua escolha fica guardada neste navegador.';
        tv.acts=[['Alternar estilo de tela','display:cycle']];
      }
      return d;
    });
    wrap('rmActs',function(fn){return fn().map(action=>action[1]==='display:cycle'?[this.displayMode().action,action[1]]:action);});
    wrap('roomAct',function(fn,code,...args){
      if(code!=='display:cycle')return fn(code,...args);
      const current=this.displayMode(),mode=modes[(modes.indexOf(current)+1)%modes.length];
      try{g.localStorage.setItem(storageKey,mode.id);}catch{/* Still usable for this visit. */}
      this.setState({displayMode:mode.id,rmDlg:true,rmIntro:false,rmSel:0,roomObj:this.data().room.findIndex(o=>o.id==='tv')});
      this.rmFxOn('tv');this.sfx('jTv');this.say(mode.text,'TV de tubo');
    });
    wrap('renderVals',function(fn){
      const r=fn(),starting=!!this._displayStarting,phase=this._displayPhase||'idle',animating=starting&&phase!=='idle',s=this.st(),I=g.PortfolioI18n,t=text=>I?.t?I.t(text):text;
      const power=s.displayPower||'on',on=power!=='off'&&power!=='cooling',channel=g.PortfolioTV?.channels?.[s.displayChannel??0];
      // The television waits for the first language choice; with a saved language it is the first screen.
      r.displayStarting=starting;r.displayStandby=starting&&!r.languageOpen;
      r.displayAnimating=animating;r.displayStatus=phase==='exit'?'Voltando à TV · Back to the TV · テレビに戻ります':'Entrando no portfólio · Entering the portfolio · ポートフォリオに入ります';r.displayPowerGate=starting&&!!this._languageReady;r.displayTvBusy=phase!=='idle';
      r.displayTvClass='tv-phase-'+phase+(s.displayGl?' has-gl':'')+(on?'':' is-tv-off')+(this._displayReturned&&phase==='idle'?' is-tv-return':'')+(this._displayArrive&&!this._displayReturned&&phase==='idle'?' is-tv-arrive':'');
      const touch=!!this.coarse?.(),broken=!!s.broke;r.displayRush=on&&(s.displayChannel??0)===0;
      r.displayHint=r.displayRush?(touch?'Toque na tela para '+(broken?'abrir o modo recrutador':'quebrar o vidro')+' · arraste para girar a TV':'Clique na tela para '+(broken?'abrir o modo recrutador':'quebrar o vidro')+' · arraste para girar a TV'):touch?'Arraste para girar a TV':'Arraste para girar a TV · role para aproximar';
      r.displayKnockLabel=broken?'Abrir modo recrutador':'Quebrar a tela';r.displayKnock=()=>this.displayKnock();r.displayScreenClick=e=>this.displayScreenClick(e);
      r.displayPowered=on;r.displayPowerLabel=on?'Desligar TV':'Ligar TV';r.displayEnterLabel='Entrar no portfólio';
      r.displayChannel='CH '+String((s.displayChannel??0)+1).padStart(2,'0');r.displayChannelName=channel?t(channel.name):'';
      r.displayVolume=s.displayVolume??4;r.displayVolumeText=t('VOLUME')+' '+r.displayVolume;
      r.displayPower=()=>this.displayAction('power');r.displayPowerOn=r.displayPower;r.displayEnter=()=>this.enterDisplay();
      r.displayChannelPrev=()=>this.displayAction('channel-');r.displayChannelNext=()=>this.displayAction('channel+');
      r.displayVolLower=()=>this.displayAction('volume-');r.displayVolRaise=()=>this.displayAction('volume+');
      r.displayCameraStyle=this._displayCamera||'';
      r.displayVolumeStyle='transform:rotate('+(-135+r.displayVolume*27)+'deg)';
      r.displayChannelStyle='transform:rotate('+((s.displayChannel??0)*360/(g.PortfolioTV?.channels?.length||6))+'deg)';
      r.displayVolumeClick=e=>this.turnDisplayKnob('volume',e);r.displayChannelClick=e=>this.turnDisplayKnob('channel',e);
      r.displayVolumeDown=e=>this.displayVolumeDown(e);r.displayVolumeMove=e=>this.displayVolumeMove(e);r.displayVolumeUp=e=>this.displayVolumeUp(e);r.displayVolumeKey=e=>this.displayVolumeKey(e);
      r.setDisplayTvScreen=this._displayScreenRef||(this._displayScreenRef=el=>{this._displayTvScreen=el;if(el&&this._tv&&!this._tvGl&&!el.contains(this._tv.screen))el.appendChild(this._tv.screen);});
      r.setDisplayStage=this._displayStageRef||(this._displayStageRef=el=>this.displayStage(el));
      r.rootCls+=' display-'+this.displayMode().id+(animating?' is-tv-starting':'')+(starting&&this._displayReduced?' is-tv-calm':'');
      // The gate fade ends the whole opening.
      r.displayOpeningEnd=e=>{if(e.target?.classList?.contains('tv-power-gate')&&e.animationName==='tv-gate-reveal')this.finishDisplayOpening();};
      r.displayCameraEnd=e=>{if(e.target?.classList?.contains('tv-camera')&&['transform','opacity'].includes(e.propertyName))this.beginDisplayOpening();};
      if(starting){r.isBoot=false;r.bootMenuOn=false;r.bootLogOn=false;r.notBoot=false;}
      return r;
    });
  }};
})(window);
