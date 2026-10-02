/* Screen presentation only: no changes to canvas resolution, layout or game clocks. */
(function(g){
  // The opening TV is on and explorable (tv3d.js). Its Enter button tunes the portfolio card, the camera goes
  // into the glass, the gate fades onto the same card and only then the boot starts.
  const storageKey='okaru-display',zoomDuration=1400,revealDuration=320,reducedDuration=120,calmRevealDuration=160,enterTimeout=9000;
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
  g.PortfolioDisplay={storageKey,zoomDuration,revealDuration,reducedDuration,calmRevealDuration,enterTimeout,zoomTransform,pictureScale,modes,install(C){
    const p=C.prototype;
    // Capture each method independently so installing another wrapper cannot recurse.
    const wrap=(name,fn)=>{const prior=p[name];p[name]=function(...args){return fn.call(this,prior.bind(this),...args);};};
    p.displayMode=function(){return modes.find(mode=>mode.id===this.st().displayMode)||modes[0];};
    p.clearDisplayTimers=function(){
      for(const key of ['_displayWarmT','_displayZoomT','_displayOpenT']){clearTimeout(this[key]);this[key]=null;}
    };
    p.tvHost=function(){
      return {ac:()=>this._ac,mix:()=>this._mix,soundOn:()=>this._sndPref!==false&&this._snd!==false,unlock:()=>{if(this._sndPref!==false&&this._snd!==false)this.audio();},
        initialVolume:this.st().displayVolume??4,onChange:tv=>this.setState({displayPower:tv.power,displayChannel:tv.channel,displayVolume:tv.volume}),onEnterRequest:()=>this.enterDisplay(),onEntered:()=>this.displayEntered()};
    };
    // The 3D stage mounts once per opening; without WebGL the CSS television stays as the fallback.
    p.displayStage=function(el){
      if(!el){return;}
      if(this._tv||!this._displayStarting||!g.PortfolioTV)return;
      this._tv=g.PortfolioTV.create(el,this.tvHost());this._tvGl=!!this._tv?.gl;
      if(this._tv&&!this._tvGl&&this._displayTvScreen&&!this._displayTvScreen.contains(this._tv.screen))this._displayTvScreen.appendChild(this._tv.screen);
      this.setState({displayGl:this._tvGl});
    };
    p.displayAction=function(name){
      if(!this._displayStarting||this._displayPhase!=='idle'||this._dead)return;
      if(this._tv){this._tv.press(name);return;}
      // Without a television object (tests, very old browsers) the controls still keep their state.
      const s=this.st();
      if(name==='power')this.setState({displayPower:s.displayPower==='off'?'on':'off'});
      if(name.startsWith('channel'))this.setState({displayChannel:((s.displayChannel??0)+(name==='channel+'?1:4))%5});
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
      this.setState({displayStarting:false,displayAnimating:false},()=>{
        if(this.st().languageOpen)this._rootEl?.querySelector('.language-options button')?.focus();
        else this.focusRoot();
      });
      // Do not consume a boot, persist its marker or run any log timers behind the opening.
      if(this._languageReady)this.bootLogStart();
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
    wrap('chooseLanguage',function(fn,...args){if(!this._displayStarting)return fn(...args);});
    const keys={PageUp:'channel+',']':'channel+',PageDown:'channel-','[':'channel-','+':'volume+','=':'volume+','-':'volume-',p:'power',P:'power'};
    const orbit={ArrowLeft:[-.18,0],ArrowRight:[.18,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]};
    wrap('rootKey',function(fn,e){
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
      r.displayStarting=starting;r.displayStandby=starting&&!r.languageOpen;
      r.displayAnimating=animating;r.displayPowerGate=starting;r.displayTvBusy=phase!=='idle';
      r.displayTvClass='tv-phase-'+phase+(s.displayGl?' has-gl':'')+(on?'':' is-tv-off');
      r.displayHint=this.coarse?.()?'Arraste para girar a TV':'Arraste para girar a TV · role para aproximar';r.displayPowered=on;r.displayPowerLabel=on?'Desligar TV':'Ligar TV';r.displayEnterLabel='Entrar no portfólio';
      r.displayChannel='CH '+String((s.displayChannel??0)+1).padStart(2,'0');r.displayChannelName=channel?t(channel.name):'';
      r.displayVolume=s.displayVolume??4;r.displayVolumeText=t('VOLUME')+' '+r.displayVolume;
      r.displayPower=()=>this.displayAction('power');r.displayPowerOn=r.displayPower;r.displayEnter=()=>this.enterDisplay();
      r.displayChannelPrev=()=>this.displayAction('channel-');r.displayChannelNext=()=>this.displayAction('channel+');
      r.displayVolLower=()=>this.displayAction('volume-');r.displayVolRaise=()=>this.displayAction('volume+');
      r.displayCameraStyle=this._displayCamera||'';
      r.displayVolumeStyle='transform:rotate('+(-135+r.displayVolume*27)+'deg)';
      r.displayChannelStyle='transform:rotate('+((s.displayChannel??0)*72)+'deg)';
      r.displayVolumeClick=e=>this.turnDisplayKnob('volume',e);r.displayChannelClick=e=>this.turnDisplayKnob('channel',e);
      r.displayVolumeDown=e=>this.displayVolumeDown(e);r.displayVolumeMove=e=>this.displayVolumeMove(e);r.displayVolumeUp=e=>this.displayVolumeUp(e);r.displayVolumeKey=e=>this.displayVolumeKey(e);
      r.setDisplayTvScreen=this._displayScreenRef||(this._displayScreenRef=el=>{this._displayTvScreen=el;if(el&&this._tv&&!this._tvGl&&!el.contains(this._tv.screen))el.appendChild(this._tv.screen);});
      r.setDisplayStage=this._displayStageRef||(this._displayStageRef=el=>this.displayStage(el));
      r.rootCls+=' display-'+this.displayMode().id+(animating?' is-tv-starting':'')+(starting&&this._displayReduced?' is-tv-calm':'');
      // The gate fade ends the whole opening.
      r.displayOpeningEnd=e=>{if(e.target?.classList?.contains('tv-power-gate')&&e.animationName==='tv-gate-reveal')this.finishDisplayOpening();};
      r.displayCameraEnd=e=>{if(e.target?.classList?.contains('tv-camera')&&['transform','opacity'].includes(e.propertyName))this.beginDisplayOpening();};
      if(starting){r.isBoot=false;r.bootMenuOn=false;r.bootLogOn=false;r.notBoot=false;}
      // The language picker waits under the gate and shows through its final fade (its buttons stay disabled until the end).
      if(r.displayPowerGate&&phase!=='reveal')r.languageOpen=false;
      return r;
    });
  }};
})(window);
