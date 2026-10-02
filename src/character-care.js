/* Cosmetic dust and voluntary cleanup, shared by the room and the walking pages. */
(function(g){
  const kinds=['wipe','brush','shake'];
  function cleanPose(a){
    const k=Math.min(1,a.t/a.dur),wave=Math.sin(k*Math.PI),p={lift:0,rot:0,sx:1,sy:1,dir:'d'};
    if(a.calm)return p;
    if(a.kind==='shake'){p.rot=Math.sin(k*Math.PI*10)*.09*wave;p.sx=1+.04*wave;}
    else if(a.kind==='brush'){p.rot=-.06*wave;p.sy=1-.05*wave;}
    else p.rot=Math.sin(k*Math.PI*4)*.035*wave;
    return p;
  }
  function shakeInput(previous,key,now){
    if(!['a','d'].includes(key))return null;
    const keep=previous&&previous.key!==key&&now-previous.at<=800&&now-previous.started<=3200;
    return {key,at:now,started:keep?previous.started:now,count:keep?previous.count+1:1};
  }
  function draw(ctx,unit,dir,dirty,a){
    if(!dirty&&!a)return;
    const k=a?Math.min(1,a.t/a.dur):0;
    ctx.save();ctx.scale(unit,unit);
    ctx.globalAlpha=dirty?Math.max(0,1-k*1.5):0;
    ctx.fillStyle='#927651';
    if(dir!=='u'){const side=dir==='l'?-1:1;ctx.fillRect(side*3-1,-15,3,2);ctx.fillRect(side*2-1,-12,2,1);}
    ctx.fillStyle='#9d8760';ctx.fillRect(-3,-8,3,2);ctx.fillRect(2,-5,2,2);ctx.globalAlpha=1;
    if(a){
      const stroke=Math.sin(k*Math.PI*6),envelope=Math.sin(k*Math.PI);
      const handX=a.kind==='brush'?2+Math.round(stroke*2):Math.round(stroke*3);
      const handY=a.kind==='brush'?(k<.5?-14:-8):-14;
      ctx.fillStyle='#476443';ctx.fillRect(handX+2,handY+2,3,4);
      ctx.fillStyle='#ddb393';ctx.fillRect(handX,handY,3,3);
      if(a.kind==='wipe'){ctx.fillStyle='#d9d6b5';ctx.fillRect(handX-1,handY+1,2,3);}
      if(a.kind==='shake'){ctx.fillStyle='#ddb393';ctx.fillRect(-6,-10,2,3);ctx.fillRect(4,-10,2,3);}
      if(!a.calm&&k>.2&&k<.85){ctx.globalAlpha=envelope*.75;ctx.fillStyle='#ab966c';for(let i=0;i<5;i++){const sign=i%2?1:-1;ctx.fillRect(sign*(5+k*12+i%3*2),-14+i*3+k*5,1,1);}ctx.globalAlpha=1;}
      if(k>.78){ctx.fillStyle='#e9e6b8';ctx.fillRect(7,-25,1,5);ctx.fillRect(5,-23,5,1);}
    }
    ctx.restore();
  }
  g.PortfolioCharacterCare={kinds,cleanPose,shakeInput,draw,install(C){
    const p=C.prototype,base={};
    const wrap=(name,fn)=>{const original=p[name];base[name]=original;p[name]=function(...args){return fn.call(this,original.bind(this),...args);};};
    p.characterCareBlocked=function(){const s=this.st();return !!(document.hidden||s.paused||s.palOpen||s.achOpen||s.troOpen||s.recOpen||s.credOpen||s.languageOpen||s.galleryLarge||s.transitioning||s.powering||s.rmDlg||s.sleeping||s.arcOpen||s.pcOpen||s.deOpen||s.tvGameOpen||s.shooterOpen||s.dOpen||s.skOpen);};
    p.characterCareActor=function(){
      if(this.characterCareBlocked())return null;
      if(this.curPage()==='quarto'){
        const rm=this._rm;return rm&&!rm.fall&&!rm.enter&&!rm.exit&&!rm.sit&&!rm.pickup&&!rm.portalTravel&&!this._rmOut&&!this._deckGrab?{kind:'room',body:rm}:null;
      }
      const wk=this._wk;return this.worldOn()&&wk&&wk.page===this.curPage()&&!wk.hidden&&!wk.anim&&!wk.flo&&!wk.act&&!this._wTrip?{kind:'world',body:wk}:null;
    };
    p.characterGetDust=function(f){
      if(!f||f.dusted||f.t<f.dur*.58)return;
      f.dusted=true;this._characterDust=true;this._characterShake=null;this.setState({characterDirty:true});
    };
    p.characterClean=function(kind){
      const actor=this.characterCareActor();if(!this._characterDust||this._characterClean||!actor)return false;
      if(!kinds.includes(kind)){kind=['wipe','brush'][(this._characterCleanCount||0)%2];this._characterCleanCount=(this._characterCleanCount||0)+1;}
      const calm=this.calm(),body=actor.body;
      this._characterClean={kind,t:0,dur:calm?360:kind==='shake'?1000:1200,calm,page:this.curPage(),actor:actor.kind};this._characterShake=null;
      if(actor.kind==='world'){this.worldPokeCancel();body.auto=null;body.autoTarget=null;this._wKeys={};body.moving=false;}
      else{body.path=[];body.held=[];body.goal=-1;}
      this.sfx('grab');this.setState({characterCleaning:true});return true;
    };
    p.characterCareStep=function(dt){
      const a=this._characterClean;if(!a)return false;
      if(a.page!==this.curPage()){this._characterClean=null;this.setState({characterCleaning:false});return false;}
      if(this.characterCareBlocked())return true;
      a.t+=Math.min(64,Math.max(0,dt));
      if(a.t<a.dur)return true;
      this._characterClean=null;this._characterDust=false;this._characterShake=null;this.setState({characterDirty:false,characterCleaning:false});this.sfx('blip');return false;
    };
    p.characterCarePose=function(){const a=this._characterClean;return a&&a.page===this.curPage()?cleanPose(a):null;};
    p.drawCharacterCare=function(ctx,unit,dir){draw(ctx,unit,dir,this._characterDust,this._characterClean);};
    p.characterCareKey=function(e){
      if(e.repeat)return false;
      if(e.ctrlKey||e.altKey||e.metaKey||e.target?.isContentEditable||e.target?.closest?.('input,textarea,select,[contenteditable],.hitbox,.pad,.jpad,.n64,.mpad,.desktop-shell')){this._characterShake=null;return false;}
      if(!this._characterDust||this._characterClean||!this.characterCareActor()){this._characterShake=null;return false;}
      this._characterShake=shakeInput(this._characterShake,(e.key||'').toLowerCase(),Date.now());
      if(this._characterShake?.count>=6){e.preventDefault();return this.characterClean('shake');}
      return false;
    };
    wrap('rootKey',function(fn,e){if(this.characterCareKey(e))return;if(this._characterClean&&['a','d','w','s','arrowleft','arrowright','arrowup','arrowdown'].includes((e.key||'').toLowerCase())&&!this.characterCareBlocked()){e.preventDefault();return;}return fn(e);});
    wrap('worldFloStep',function(fn,wk,dt){
      if(this._characterClean?.actor==='world'){wk.moving=false;return this.characterCareStep(dt);}
      const f=wk.flo,result=fn(wk,dt);if(f?.kind==='trip')this.characterGetDust(f);return result;
    });
    wrap('worldPose',function(fn,wk){return this.characterCarePose()||fn(wk);});
    wrap('rmUpdate',function(fn,rm,dt,busy){
      if(this._characterClean?.actor==='room'){if(!busy)this.characterCareStep(dt);return;}
      const f=rm.fall,result=fn(rm,dt,busy);if(f)this.characterGetDust(f);return result;
    });
    wrap('rmPointer',function(fn,e){
      if(this._characterDust&&this.characterCareActor()?.kind==='room'){
        const rm=this._rm,pt=this.rmPxAt(e),x=(rm.moving?rm.from[0]+(rm.to[0]-rm.from[0])*rm.t:rm.x)*16+(rm.alignX||0),y=(rm.moving?rm.from[1]+(rm.to[1]-rm.from[1])*rm.t:rm.y)*16-8;
        if(pt&&pt[0]>=x-3&&pt[0]<=x+19&&pt[1]>=y-2&&pt[1]<=y+25){e.preventDefault();this.characterClean();return;}
      }
      return fn(e);
    });
    // Track the sprite every rendered frame without React updates on each footstep.
    wrap('worldDraw',function(fn,cv,geo,wk){
      fn(cv,geo,wk);const el=this._characterCleanTarget;if(!el)return;
      const visible=this._characterDust&&!this._characterClean&&this.characterCareActor()?.kind==='world'&&wk&&wk.y-geo.top>0&&wk.y-geo.top-24*geo.u<geo.H;
      el.hidden=!visible;
      if(visible){const u=geo.u;el.style.transform='translate('+(wk.x-11*u)+'px,'+(wk.y-geo.top-26*u)+'px)';el.style.width=22*u+'px';el.style.height=28*u+'px';}
    });
    wrap('go',function(fn,to,...args){if(to!==this.curPage()){this._characterClean=null;this._characterShake=null;this.setState({characterCleaning:false});}return fn(to,...args);});
    wrap('wipeProgress',function(fn,...args){this._characterDust=false;this._characterClean=null;this._characterShake=null;this.setState({characterDirty:false,characterCleaning:false});return fn(...args);});
    wrap('componentWillUnmount',function(fn){this._characterCleanTarget=null;this._characterClean=null;this._characterShake=null;return fn();});
    wrap('renderVals',function(fn){const r=fn(),visible=!!this._characterDust&&!this.characterCareBlocked()&&!!(this.characterCareActor()||this._characterClean);return {...r,characterCareVisible:visible,characterCleaning:!!this._characterClean,characterClean:()=>this.characterClean(),characterCleanFace:()=>this.characterClean('wipe'),characterCleanBrush:()=>this.characterClean('brush'),setCharacterCleanTarget:el=>{this._characterCleanTarget=el;if(el)el.hidden=true;}};});
  }};
})(window);
