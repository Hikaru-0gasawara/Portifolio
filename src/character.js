/* Five contextual falls. Timers count active walking, not time in a background tab. */
(function(g){
  const variants=['toe','double','slide','earth','heel'];
  function choice(r){return r<.60?'straight':r<.82?'wander':r<.94?'curve':r<.985?'trip':'roll';}
  function pose(f){
    const k=Math.min(1,f.t/f.dur),side=f.side||1;
    const warning=k<.18, wobble=k>=.18&&k<.42;
    const fall=Math.min(1,Math.max(0,(k-.42)/.16));
    const recovery=1-Math.min(1,Math.max(0,(k-.78)/.22));
    const tilt=fall*recovery;
    const type=f.variant||'toe';
    const p={lift:0,rot:0,sx:1,sy:1,dir:''};
    if(warning)p.sy=1+.06*Math.sin(k/.18*Math.PI);
    if(wobble)p.rot=Math.sin((k-.18)/.24*Math.PI*(type==='double'?6:4))*.28;
    p.rot+=side*({toe:1.35,double:1.15,slide:-1.45,earth:1.6,heel:-1.1}[type])*tilt;
    p.lift=type==='earth'?6*Math.sin(fall*Math.PI)*recovery:-3*tilt;
    p.sx=1+(type==='double'?.25:.13)*tilt;
    p.sy-=type==='heel'?.25*tilt:.08*tilt;
    return p;
  }
  function rock(ctx,x,y,u,type,clock=0){
    ctx.save();ctx.translate(x,y);ctx.scale(u,u);
    ctx.fillStyle='#111a14';ctx.fillRect(-8,0,16,2);
    ctx.fillStyle=type==='earth'?'#8a9970':'#708170';
    if(type==='double'){ctx.fillRect(-9,-3,6,3);ctx.fillRect(1,-5,8,5);}
    else if(type==='slide'){ctx.fillRect(-7,-2,13,2);ctx.fillRect(-3,-3,8,1);}
    else {ctx.fillRect(-5,-5,10,5);ctx.fillRect(-3,-7,6,2);}
    ctx.fillStyle='#adb497';ctx.fillRect(-3,-5,3,2);
    if(type==='earth'){ctx.strokeStyle='#b4c895';ctx.globalAlpha=.4;ctx.beginPath();ctx.ellipse(0,0,11+(clock%500)/100,3,0,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function alert(ctx,x,y,u,k){
    if(k>.44)return;
    ctx.save();ctx.fillStyle='#0b140d';ctx.fillRect(x-4*u,y-34*u,8*u,11*u);
    ctx.fillStyle='#f3d274';ctx.fillRect(x-u,y-32*u,2*u,5*u);ctx.fillRect(x-u,y-26*u,2*u,u);ctx.restore();
  }
  g.PortfolioCharacter={choice,pose,variants,install(Component){
    const p=Component.prototype,base={};
    const wrap=(name,fn)=>{base[name]=p[name];p[name]=function(...args){return fn.call(this,base[name].bind(this),...args);};};
    p.tripStart=function(wk){
      const variant=variants[this._fallCount?this._fallCount%5:0];
      this._fallCount=(this._fallCount||0)+1;this._tripSeen=true;this._lastFallWalk=this._walkTotal||0;
      wk.flo={kind:'trip',variant,t:0,dur:1650,side:wk.dir==='l'?-1:1,dir:wk.dir};
      this.sfx('bump');
      return wk.flo;
    };
    p.worldFlourish=function(wk,dt,auto){
      if(this.calm()||document.hidden||wk.flo||wk.anim||!wk.moving)return;
      this._walkTotal=(this._walkTotal||0)+dt;
      const geo=this.worldGeo();if(!geo)return;
      const stone=this._walkStone;
      if(stone&&stone.page!==this.curPage())this._walkStone=null;
      if(stone&&stone.page===this.curPage()&&!stone.used&&Math.hypot(wk.x-stone.x,wk.y-stone.y)<12*geo.u){
        stone.used=true;const f=this.tripStart(wk);f.variant=stone.variant;stone.fadeAt=this._walkTotal;return;
      }
      wk.floAt=(wk.floAt||0)+dt;
      const guarantee=!this._tripSeen&&this._walkTotal>=1800;
      if(!guarantee&&wk.floAt<3600)return;
      wk.floAt=0;
      let kind=guarantee?'trip':choice(Math.random());
      if(kind==='trip'&&(guarantee||this._walkTotal-(this._lastFallWalk||0)>45000)){
        if(this._walkStone&&!this._walkStone.used&&this._walkStone.page===this.curPage())return;
        const target=this._wPoke?.cur;
        let dx=target?.phase==='walk'?target.tx-wk.x:({l:-1,r:1}[wk.dir]||0);
        let dy=target?.phase==='walk'?target.ty-wk.y:({u:-1,d:1}[wk.dir]||0);
        const dist=Math.hypot(dx,dy);if(!dist)return;
        const ahead=target?Math.min(36*geo.u,dist*.5):30*geo.u;
        if(ahead<14*geo.u)return;
        const x=wk.x+dx/dist*ahead,y=wk.y+dy/dist*ahead;
        if(x<12*geo.u||x>geo.W-12*geo.u||y<24*geo.u||y>geo.CH-4*geo.u)return;
        this._walkStone={page:this.curPage(),x,y,variant:variants[(this._fallCount||0)%5],used:false};
        return;
      }
      if(kind==='trip'||kind==='straight'||(!auto&&(kind==='curve'||kind==='wander')))return;
      if(kind==='roll'){
        try{if(localStorage.getItem('okaru-first-roll'))return;}catch{}
        if(this._walkTotal<15000)return;
      }
      wk.flo={kind,t:0,dur:kind==='roll'?650:kind==='wander'?1150:900,dir:wk.dir,side:Math.random()<.5?-1:1};
    };
    p.worldCurve=function(wk,dt,u,dx,dy,dist){
      const f=wk.flo;if(!f||!['curve','wander'].includes(f.kind)||!dist)return;
      const shape=k=>f.kind==='wander'?Math.sin(Math.PI*k)*Math.sin(3*Math.PI*k):Math.sin(Math.PI*k);
      const shift=(shape(Math.min(1,f.t/f.dur))-shape(Math.max(0,(f.t-dt)/f.dur)))*(f.kind==='wander'?17:25)*u*f.side;
      const geo=this.worldGeo();
      wk.x=Math.max(10*u,Math.min(geo.W-10*u,wk.x-dy/dist*shift));
      wk.y=Math.max(24*u,Math.min(geo.CH-2*u,wk.y+dx/dist*shift));
    };
    wrap('worldFloStep',function(fn,wk,dt){
      const f=wk.flo;
      if(f?.kind==='roll'&&f.t+dt>=f.dur){try{localStorage.setItem('okaru-first-roll','1');}catch{}}
      return fn(wk,dt);
    });
    wrap('worldPose',function(fn,wk){return wk.flo?.kind==='trip'?pose(wk.flo):fn(wk);});
    wrap('worldDraw',function(fn,cv,geo,wk){
      fn(cv,geo,wk);
      const ctx=cv.getContext('2d'),dpr=Math.min(2,g.devicePixelRatio||1),s=this._walkStone;
      if(s?.page===this.curPage()&&(!s.used||(this._walkTotal||0)-s.fadeAt<1800))rock(ctx,s.x*dpr,(s.y-geo.top)*dpr,geo.u*dpr,s.variant,this._wClock);
      if(wk?.flo?.kind==='trip')alert(ctx,wk.x*dpr,(wk.y-geo.top)*dpr,geo.u*dpr,wk.flo.t/wk.flo.dur);
    });
    wrap('worldOn',function(fn){return (this.curPage()==='projetos'&&this.st().openProj>=0)||fn();});
    // Keep the project drawer in the same coordinate space as its visible character layer.
    wrap('loopWorld',function(fn,dt){if(this.st().galleryLarge||this.st().languageOpen||document.hidden)return;return fn(dt);});
    wrap('padSelect',function(fn){if(this._pad?.length&&!this.st().lcdMenu){this.padReset();this.sfx('select');return;}return fn();});
    wrap('rmUpdate',function(fn,rm,dt,busy){
      if(busy||this.calm())return fn(rm,dt,busy);
      if(rm.fall){rm.fall.t+=dt;if(rm.fall.t>=rm.fall.dur)rm.fall=null;return;}
      if(rm.moving){
        this._walkTotal=(this._walkTotal||0)+dt;
        const eligible=!this._tripSeen&&this._walkTotal>=1600;
        const rare=this._tripSeen&&this._walkTotal-(this._lastFallWalk||0)>45000&&Math.random()<dt*.00004;
        if((eligible||rare)&&!rm.stone&&rm.t<.4)rm.stone={x:rm.to[0],y:rm.to[1],variant:variants[(this._fallCount||0)%5]};
        if(rm.stone&&!rm.stone.used&&rm.to[0]===rm.stone.x&&rm.to[1]===rm.stone.y&&rm.t>=.58){
          const carrier={dir:rm.dir};rm.fall=this.tripStart(carrier);rm.fall.variant=rm.stone.variant;rm.stone.used=true;return;
        }
      }
      if(rm.stone?.used&&!rm.fall)rm.stone=null;
      return fn(rm,dt,busy);
    });
    p.drawRoomPlayer=function(ctx,img,fr,x,y,rm){
      const f=rm.fall,ps=f?pose(f):{rot:0,lift:0,sx:1,sy:1};
      ctx.save();ctx.translate(x+8,y+24-ps.lift);ctx.translate(0,-12);ctx.rotate(ps.rot);ctx.translate(0,12);ctx.scale(ps.sx,ps.sy);
      ctx.drawImage(img,48+fr*16,224,16,24,-8,-24,16,24);ctx.restore();
      if(f)alert(ctx,x+8,y+24,1,f.t/f.dur);
    };
    p.drawRoomObstacle=function(ctx,rm){if(rm.stone)rock(ctx,rm.stone.x*16+8-rm.camX,rm.stone.y*16+14-rm.camY,1,rm.stone.variant,rm.clock);};
  }};
})(window);
