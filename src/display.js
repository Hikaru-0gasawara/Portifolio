/* Screen presentation only: no changes to canvas resolution, layout or game clocks. */
(function(g){
  const storageKey='okaru-display',openingDuration=4200,reducedDuration=120,approachDuration=600,zoomDuration=1400;
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
  g.PortfolioDisplay={storageKey,openingDuration,reducedDuration,approachDuration,zoomDuration,zoomTransform,modes,install(C){
    const p=C.prototype;
    // Capture each method independently so installing another wrapper cannot recurse.
    const wrap=(name,fn)=>{const prior=p[name];p[name]=function(...args){return fn.call(this,prior.bind(this),...args);};};
    p.displayMode=function(){return modes.find(mode=>mode.id===this.st().displayMode)||modes[0];};
    p.clearDisplayTimers=function(){
      for(const key of ['_displayApproachT','_displayZoomT','_displayOpenT']){clearTimeout(this[key]);this[key]=null;}
    };
    p.prepareDisplayZoom=function(){
      if(!this._displayStarting||this._displayPhase!=='approach'||this._dead)return;
      clearTimeout(this._displayApproachT);this._displayApproachT=null;
      const zoom=zoomTransform(this._displayTvScreen?.getBoundingClientRect?.(),this._rootEl?.getBoundingClientRect?.());
      this._displayCamera=zoom?'transform:translate('+zoom.x+'px,'+zoom.y+'px) scale('+zoom.scale+')':'transform:scale(8)';
      this._displayPhase='zoom';this.setState({displayPhase:'zoom'});
      this._displayZoomT=setTimeout(()=>this.beginDisplayOpening(this._displaySoundWanted),(this._displayReduced?reducedDuration:zoomDuration)+160);
    };
    p.beginDisplayOpening=function(sound){
      if(!this._displayStarting||this._displayPhase!=='zoom'||this._displayAnimating||this._dead)return;
      this.clearDisplayTimers();this._displayAnimating=true;this._displayPhase='warmup';
      // Never queue oscillators in a suspended context: they would play after the picture opens.
      if(sound&&this._sndPref!==false&&this._snd!==false)this.tvPowerSound();
      this.setState({displayAnimating:true,displayPhase:'warmup'});
      const duration=this._displayReduced?reducedDuration:openingDuration;
      this._displayOpenT=setTimeout(()=>this.finishDisplayOpening(),duration+200);
    };
    p.powerDisplayOn=function(){
      if(!this._displayStarting||this._displayPhase!=='off'||this._dead)return;
      this._displaySoundWanted=this._sndPref!==false&&this._snd!==false;
      // This is always called from the physical power button / Enter, so resume has a gesture.
      if(this._displaySoundWanted)this.audio();
      this._displayPhase='approach';this._displayKnobDrag=null;
      this.setState({displayPhase:'approach'});
      this._displayApproachT=setTimeout(()=>this.prepareDisplayZoom(),(this._displayReduced?reducedDuration:approachDuration)+160);
    };
    p.finishDisplayOpening=function(){
      if(!this._displayStarting||!this._displayAnimating||this._dead)return;
      this._displayStarting=false;this._displayAnimating=false;this._displayPhase='done';
      this.clearDisplayTimers();
      this.setState({displayStarting:false,displayAnimating:false},()=>{
        if(this.st().languageOpen)this._rootEl?.querySelector('.language-options button')?.focus();
        else this.focusRoot();
      });
      // Do not consume a boot, persist its marker or run any log timers behind the opening.
      if(this._languageReady)this.bootLogStart();
    };
    wrap('componentDidMount',function(fn){
      this._displayStarting=true;this._displayAnimating=false;this._displayPhase='off';
      this._displayReduced=!!this.st().motionReduced||!!g.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      this.setState({displayStarting:true,displayMode:savedMode()});
      fn();
    });
    wrap('componentWillUnmount',function(fn){
      this._displayStarting=false;this._displayAnimating=false;
      this.clearDisplayTimers();this._displayKnobDrag=null;this._displayTvScreen=null;return fn();
    });
    wrap('bootLogStart',function(fn){if(!this._displayStarting)return fn();});
    wrap('chooseLanguage',function(fn,...args){if(!this._displayStarting)return fn(...args);});
    wrap('rootKey',function(fn,e){
      if(this._displayStarting){
        if(this._displayPhase==='off'){
          if(e.key==='Tab')return;
          // Native buttons handle their own Enter/space; Enter anywhere else powers the TV.
          if(e.target?.closest?.('button'))return;
          if(e.key==='Enter'&&!e.repeat){e.preventDefault();this.powerDisplayOn();}
        }else if(!e.ctrlKey&&!e.metaKey&&!e.altKey)e.preventDefault();
        return;
      }
      return fn(e);
    });
    p.turnDisplayKnob=function(kind,event){
      if(!this._displayStarting||this._displayPhase!=='off')return;
      if(kind==='volume'&&event?.detail>0&&this._displayKnobSkipClick){this._displayKnobSkipClick=false;return;}
      this._displayKnobSkipClick=false;
      if(kind==='volume')this.setState({displayVolume:((this.st().displayVolume??5)+1)%11});
      if(kind==='channel')this.setState({displayChannel:((this.st().displayChannel??1)%12)+1});
    };
    p.displayVolumeDown=function(e){
      if(this._displayPhase!=='off'||(e.button!==undefined&&e.button!==0))return;
      this._displayKnobSkipClick=false;
      this._displayKnobDrag={id:e.pointerId,x:e.clientX,y:e.clientY,value:this.st().displayVolume??5,moved:false};
      e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    p.displayVolumeMove=function(e){
      const drag=this._displayKnobDrag;if(!drag||drag.id!==e.pointerId||this._displayPhase!=='off')return;
      const change=drag.y-e.clientY+(e.clientX-drag.x)*.5;
      if(Math.abs(change)>4)drag.moved=true;
      if(drag.moved)this.setState({displayVolume:Math.max(0,Math.min(10,drag.value+Math.round(change/8)))});
    };
    p.displayVolumeUp=function(e){
      const drag=this._displayKnobDrag;if(!drag||drag.id!==e.pointerId)return;
      this._displayKnobSkipClick=drag.moved;this._displayKnobDrag=null;
      if(e.currentTarget.hasPointerCapture?.(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
    };
    p.displayVolumeKey=function(e){
      if(this._displayPhase!=='off')return;
      const step={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1}[e.key];
      if(step===undefined&&!['Home','End'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();
      this.setState({displayVolume:e.key==='Home'?0:e.key==='End'?10:Math.max(0,Math.min(10,(this.st().displayVolume??5)+step))});
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
      const r=fn(),starting=!!this._displayStarting,animating=starting&&!!this._displayAnimating;
      r.displayStarting=starting;r.displayStandby=starting&&!r.languageOpen;
      r.displayAnimating=animating;r.displayPowerGate=starting&&!animating;
      r.displayPowerOn=()=>this.powerDisplayOn();r.displayTvBusy=this._displayPhase!=='off';
      r.displayPowerLabel=this._languageReady?'Ligar TV':'Ligar TV · Power on · 電源';
      r.displayTvClass='tv-phase-'+(this._displayPhase||'off');r.displayCameraStyle=this._displayCamera||'';
      r.displayVolume=this.st().displayVolume??5;r.displayChannel=String(this.st().displayChannel??1).padStart(2,'0');
      r.displayVolumeStyle='transform:rotate('+(-135+r.displayVolume*27)+'deg)';
      r.displayChannelStyle='transform:rotate('+((this.st().displayChannel??1)*30)+'deg)';
      r.displayVolumeClick=e=>this.turnDisplayKnob('volume',e);r.displayChannelClick=e=>this.turnDisplayKnob('channel',e);
      r.displayVolumeDown=e=>this.displayVolumeDown(e);r.displayVolumeMove=e=>this.displayVolumeMove(e);r.displayVolumeUp=e=>this.displayVolumeUp(e);r.displayVolumeKey=e=>this.displayVolumeKey(e);
      r.setDisplayTvScreen=el=>{this._displayTvScreen=el;};
      r.rootCls+=' display-'+this.displayMode().id+(animating?' is-tv-starting':'')+(starting&&this._displayReduced?' is-tv-calm':'');
      r.displayOpeningEnd=e=>{
        if(e.target?.classList?.contains('tv-power-on')&&['tv-power-sequence','tv-power-fade'].includes(e.animationName))this.finishDisplayOpening();
      };
      r.displayCameraEnd=e=>{
        if(e.target?.classList?.contains('tv-cabinet')&&e.propertyName==='transform')this.prepareDisplayZoom();
        if(e.target?.classList?.contains('tv-camera')&&['transform','opacity'].includes(e.propertyName))this.beginDisplayOpening(this._displaySoundWanted);
      };
      if(starting){r.isBoot=false;r.bootMenuOn=false;r.bootLogOn=false;r.notBoot=false;}
      if(r.displayPowerGate)r.languageOpen=false;
      return r;
    });
  }};
})(window);
