/* A game pad for touch screens: a stick and the A and B buttons drive Hikaru on the pages and in the bedroom,
   through the same keys the keyboard uses (W A S D, E and Esc), so every place that already listens to keys
   (walking, doors, portals, the bedroom and its dialogs) works the same. A uses what he stands on, B closes the
   bedroom's dialogs and otherwise runs while held. It can be tucked away; the choice stays in this browser. */
(function(g){
  const storageKey='okaru-pad',dead=.32,reach=.42;
  // The stick's eight directions as held keys (screen y grows downwards); inside the dead zone, none.
  const octants={0:['d'],1:['d','s'],2:['s'],3:['s','a'],4:['a'],'-4':['a'],'-3':['a','w'],'-2':['w'],'-1':['w','d']};
  function stickKeys(x,y){
    if(!(Math.hypot(x,y)>=dead))return [];
    return octants[Math.round(Math.atan2(y,x)/(Math.PI/4))].slice();
  }
  g.PortfolioGamepad={storageKey,stickKeys,install(C){
    const p=C.prototype;
    const wrap=(name,fn)=>{const prior=p[name];p[name]=function(...args){return fn.call(this,prior.bind(this),...args);};};
    // Only phones and tablets get it; the check stays live, so a device that changes its pointer follows.
    p.padTouch=function(){
      if(!this._padMq){try{this._padMq=g.matchMedia?.('(hover: none) and (pointer: coarse)')||null;}catch{this._padMq=null;}
        this._padMqOn=()=>this.setState({padTouch:!!this._padMq?.matches});this._padMq?.addEventListener?.('change',this._padMqOn);}
      return !!this._padMq?.matches;
    };
    p.padPref=function(){
      if(this._padPref===undefined){try{this._padPref=g.localStorage.getItem(storageKey)!=='off';}catch{this._padPref=true;}}
      return this._padPref;
    };
    p.padPlace=function(){return this.curPage()==='quarto'||!!this.worldOn?.();};
    p.padBlocked=function(){
      const s=this.st();
      return !!(this._displayStarting||s.languageOpen||s.bootLog||s.paused||s.palOpen||s.achOpen||s.troOpen||s.recOpen||s.credOpen||s.arcOpen||s.pcOpen||s.deOpen||s.tvGameOpen||s.dOpen||s.skOpen||s.shooterOpen||s.galleryLarge||s.powering||s.sleeping||s.panic);
    };
    p.padShown=function(){return this.padTouch()&&this.padPlace()&&!this.padBlocked();};
    p.padKey=function(type,key){
      const ev={key,repeat:false,target:this._rootEl||{},preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};
      return type==='down'?this.rootKey(ev):this.rootKeyUp(ev);
    };
    // Only the keys that changed are pressed or released, so the bedroom's dialogs move one step per push.
    p.padStick=function(x,y){
      const next=stickKeys(x,y),held=this._padHeld||[];
      for(const k of held)if(!next.includes(k))this.padKey('up',k);
      this._padHeld=next;
      for(const k of next)if(!held.includes(k))this.padKey('down',k);
    };
    p.padRelease=function(){
      for(const k of this._padHeld||[])this.padKey('up',k);
      this._padHeld=[];this._padRun=false;
      if(this._padA){this._padA=false;this.padKey('up','e');}
      this._padStickId=null;if(this._padKnob)this._padKnob.style.transform='';
    };
    const buzz=()=>{try{g.navigator?.vibrate?.(8);}catch{/* No vibration on this device. */}};
    p.padStickDown=function(e){
      const r=e.currentTarget?.getBoundingClientRect?.();if(!r?.width)return;
      e.preventDefault?.();
      try{e.currentTarget.setPointerCapture?.(e.pointerId);}catch{/* A pointer that cannot be captured still steers while it stays on the stick. */}
      this._padStickId=e.pointerId;this._padCenter=[r.left+r.width/2,r.top+r.height/2,r.width/2];this.padStickMove(e);
    };
    p.padStickMove=function(e){
      if(this._padStickId!==e.pointerId||!this._padCenter)return;
      const [cx,cy,radius]=this._padCenter,dx=(e.clientX-cx)/radius,dy=(e.clientY-cy)/radius,m=Math.max(1,Math.hypot(dx,dy)),x=dx/m,y=dy/m;
      if(this._padKnob)this._padKnob.style.transform='translate('+(x*radius*reach).toFixed(1)+'px,'+(y*radius*reach).toFixed(1)+'px)';
      this.padStick(x,y);
    };
    p.padStickUp=function(e){
      if(this._padStickId!==e.pointerId)return;
      this._padStickId=null;this.padStick(0,0);if(this._padKnob)this._padKnob.style.transform='';
    };
    p.padADown=function(e){e?.preventDefault?.();if(this._padA)return;this._padA=true;buzz();this.padKey('down','e');};
    p.padAUp=function(){if(!this._padA)return;this._padA=false;this.padKey('up','e');};
    // B is "back" where there is something to close (the bedroom's dialogs) and "run" everywhere else.
    p.padBDown=function(e){
      e?.preventDefault?.();buzz();
      if(this.st().rmDlg){this.padKey('down','Escape');return;}
      this._padRun=true;this.setState({padRun:true});
    };
    p.padBUp=function(){if(this._padRun){this._padRun=false;this.setState({padRun:false});}};
    p.padToggle=function(){
      this.padRelease();this._padPref=!this.padPref();
      try{g.localStorage.setItem(storageKey,this._padPref?'on':'off');}catch{/* Still applies to this visit. */}
      this.sfx('select');this.setState({padPref:this._padPref});
    };
    wrap('worldFloSpeed',function(fn,wk){return fn(wk)*(this._padRun?1.8:1);});
    wrap('rmUpdate',function(fn,rm,dt,busy){return fn(rm,this._padRun&&rm.moving&&!rm.enter&&!rm.exit?dt*1.75:dt,busy);});
    // A dialog or a page change takes the pad away: nothing stays pressed behind it.
    wrap('componentDidUpdate',function(fn,...args){const r=fn(...args);if(!this.padShown()&&(this._padHeld?.length||this._padA||this._padRun))this.padRelease();return r;});
    wrap('componentWillUnmount',function(fn){this.padRelease();this._padMq?.removeEventListener?.('change',this._padMqOn);return fn();});
    wrap('renderVals',function(fn){
      const r=fn(),s=this.st(),shown=this.padShown(),on=this.padPref();
      r.padOn=shown&&on;r.padMini=shown&&!on;
      r.padBLabel=s.rmDlg?'fechar':'correr';r.padBCls=this._padRun?'is-down':'';
      if(r.padOn){r.rootCls+=' has-pad';r.rmHelp='Joystick pra andar · A pra interagir · B pra correr · ou toque';}
      r.padStickDown=e=>this.padStickDown(e);r.padStickMove=e=>this.padStickMove(e);r.padStickUp=e=>this.padStickUp(e);
      r.padADown=e=>this.padADown(e);r.padAUp=()=>this.padAUp();r.padBDown=e=>this.padBDown(e);r.padBUp=()=>this.padBUp();
      r.padToggle=()=>this.padToggle();
      r.setPadKnob=this._padKnobRef||(this._padKnobRef=el=>{this._padKnob=el;});
      return r;
    });
  }};
})(window);
