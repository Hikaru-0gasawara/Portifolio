/* Choreography shared by room visits, the regular pages and seismic vision. */
(function(g){
  const decks={archidekt:'https://archidekt.com/folders/1717569',moxfield:'https://moxfield.com/lists/Jb445-paper-decks'};
  const portals={
    projetos:{page:'projetos',to:'inicio',arrival:'projects-button',selector:'.portal-anchor'},
    sobre:{page:'sobre',to:'inicio',arrival:'about-button',selector:'.portal-anchor'},
    'contact-home':{page:'contato',to:'inicio',arrival:'home-contact',selector:'[data-portal-id="contact-home"]'},
    'home-contact':{page:'inicio',to:'contato',arrival:'contact-home',selector:'[data-portal-id="home-contact"]'},
    'home-room':{page:'inicio',to:'quarto',arrival:'room-home',selector:'[data-portal-id="home-room"]'}
  };
  const arrivals={
    'projects-button':'[data-portal-to="projetos"]','about-button':'[data-portal-to="sobre"]',
    'contact-home':'[data-portal-id="contact-home"]','home-contact':'[data-portal-id="home-contact"]','home-room':'[data-portal-id="home-room"]'
  };
  function teleportPose(t,out){
    const k=Math.min(1,Math.max(0,t/760));
    return {dir:['d','l','u','r'][Math.floor(t/62)%4],lift:4*Math.sin(k*Math.PI),sx:(.45+.55*Math.abs(Math.cos(t/62)))*(out?1-.8*k:.2+.8*k),sy:out?1-.6*k:.4+.6*k};
  }
  function route(from,to,geo,r=Math.random(),random=Math.random){
    const distance=Math.hypot(to.x-from.x,to.y-from.y),u=geo.u;
    if(r<.6||distance<60*u)return [];
    const far=r>.98,count=r>.92?4:2,sign=random()<.5?-1:1;
    return Array.from({length:count},(_,i)=>{
      const k=(i+.35)/(count+1),amplitude=(far?Math.min(geo.H*.65,150*u):Math.min(distance*.24,(r>.92?60:30)*u));
      return {x:Math.max(12*u,Math.min(geo.W-12*u,from.x+(to.x-from.x)*k)),y:Math.max(28*u,Math.min(geo.CH-6*u,from.y+(to.y-from.y)*k+sign*(i%2?-1:1)*amplitude))};
    });
  }
  g.PortfolioScene={decks,route,portals,teleportPose,install(C){
    const p=C.prototype,base={};
    const wrap=(name,fn)=>{const original=p[name];base[name]=original;p[name]=function(...args){return fn.call(this,original.bind(this),...args);};};
    p.calm=function(){return !!this.st().motionReduced;};
    p.worldRoute=function(wk,to,geo){return this.calm()||this._wTrip?.run?[]:route(wk,to,geo);};
    p.worldRouteStep=function(wk,points,dt,geo){
      if(!points?.length)return false;
      const p=points[0],dx=p.x-wk.x,dy=p.y-wk.y,distance=Math.hypot(dx,dy),speed=.23*geo.u*dt*this.worldFloSpeed(wk);
      if(distance<=Math.max(speed,geo.u)){wk.x=p.x;wk.y=p.y;points.shift();return points.length>0;}
      wk.x+=dx/distance*speed;wk.y+=dy/distance*speed;wk.dir=Math.abs(dx)>Math.abs(dy)?dx<0?'l':'r':dy<0?'u':'d';wk.moving=true;wk.walk+=dt;return true;
    };
    wrap('go',function(fn,to,...args){
      if(!this.st().transitioning&&to!==this.curPage()&&this._teleportDestination!==to){
        this._teleportArrival=null;this._teleportDestination=null;this.portalHatch(this._wk?.anim?.hatch,false);
        if(this._wk?.anim?.kind.startsWith('teleport-'))this._wk.anim=null;
        if(this._rm?.portalTravel)this._rm.portalTravel=null;
      }
      if(to==='sobre'&&this.curPage()!=='sobre'&&!this.st().transitioning){this._diffDone=false;this._diffStarted=false;this._diffElSeen=null;this.setState({diffStep:0});}
      return fn(to,...args);
    });
    p.worldOn=function(){return this.worldPages().includes(this.curPage());};
    wrap('worldGeo',function(fn){const geo=fn();return geo?{...geo,u:geo.u*.76}:null;});
    wrap('worldDoorTo',function(fn,page,side){return side==='L'&&(this.st().backRoom||this._directRoom)?'quarto':fn(page,side);});
    p.toRoom=function(){
      if(this.worldOn()&&!this.st().transitioning){this._directRoom=true;this.setState({paused:false,palOpen:false,achOpen:false,recOpen:false});this.worldUseDoor('L');}
      else this.go('quarto');
    };
    wrap('enterRoomDoor',function(fn){this._directRoom=false;return fn();});
    wrap('worldSpawn',function(fn,page,geo){
      const wk=fn(page,geo);wk.hidden=false;
      if(!wk.anim)wk.anim={kind:'out',side:'L',t:-120,flourish:false};
      if(this._teleportDestination===page){
        const el=this.teleportAnchor(geo),spot=this.teleportSpot(geo);wk.x=spot.x;wk.y=spot.y;
        // Scroll the landing into view before the spin begins, including on small screens.
        geo.sc.scrollTop=Math.max(0,Math.min(geo.CH-geo.H,wk.y-geo.H*.45));geo.top=geo.sc.scrollTop;
        wk.anim=this.calm()?null:{kind:'teleport-in',t:0,hatch:el};this.portalHatch(el,!this.calm());
        this._teleportDestination=null;this._teleportArrival=null;
      }
      return wk;
    });
    p.teleportAnchor=function(geo){
      const selector=arrivals[this._teleportArrival]||(this.curPage()==='inicio'?'[data-portal-to="'+(this._teleportReturnFrom==='projetos'?'projetos':'sobre')+'"]':'.portal-anchor');
      return geo?.sc.querySelector?.(selector);
    };
    p.teleportSpot=function(geo){
      const el=this.teleportAnchor(geo);
      if(el){const rect=el.getBoundingClientRect(),screen=geo.sc.getBoundingClientRect();return {x:rect.left-screen.left+rect.width/2,y:rect.bottom-screen.top+geo.top-8};}
      return {x:Math.max(40,geo.W*.4),y:geo.dy+25*geo.u};
    };
    p.portalHit=function(geo,wk,target){
      if(!geo||!wk||wk.hidden)return null;
      const elements=target?[target]:Array.from(geo.sc.querySelectorAll?.('.portal-anchor')||[geo.sc.querySelector?.('.portal-anchor')]);
      const sr=geo.sc.getBoundingClientRect(),x=wk.x+sr.left,y=wk.y-geo.top+sr.top-3*geo.u;
      return elements.find(el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;})||null;
    };
    p.portalHatch=function(el,open){if(el?.classList?.contains('portal-hatch'))el.classList[open?'add':'remove']('is-open');};
    // Resolve the actual button geometry, so scrolling, translations and seismic overlays
    // cannot move the visual pedestal away from its walking/keyboard interaction.
    p.portalPoint=function(el,geo){const r=el.getBoundingClientRect(),sr=geo.sc.getBoundingClientRect();return [r.left-sr.left+r.width/2,r.bottom-sr.top+geo.top-8-3*geo.u];};
    wrap('worldPoke',function(fn,el,fire,pt,style){
      const geo=el?.classList?.contains('portal-anchor')&&this.worldGeo();
      return fn(el,fire,geo?this.portalPoint(el,geo):pt,style);
    });
    wrap('worldKey',function(fn,e){
      const s=this.st(),wk=this._wk;
      if((e.key||'').toLowerCase()==='e'&&this.worldOn()&&wk&&!wk.anim&&!wk.auto&&!this._wTrip&&!s.paused&&!s.palOpen&&!s.achOpen&&!s.troOpen&&!s.recOpen&&!s.credOpen&&!s.languageOpen&&!s.transitioning){
        const el=this.portalHit(this.worldGeo(),wk);if(el)this._wHit=el;
      }
      return fn(e);
    });
    p.teleportHome=function(){
      this.usePortal(this.curPage()==='contato'?'contact-home':this.curPage());
    };
    p.usePortal=function(id){
      const link=portals[id],s=this.st(),wk=this._wk;
      if(!link||this.curPage()!==link.page||s.transitioning||s.paused||s.languageOpen||s.palOpen||s.achOpen||s.recOpen||s.troOpen||s.credOpen||wk?.anim?.kind.startsWith('teleport-'))return;
      const geo=this.worldGeo(),el=geo?.sc.querySelector?.(link.selector);if(!el)return;
      if(wk&&!wk.hidden&&this.worldOn()&&!this.calm()&&!this.portalHit(geo,wk,el)){
        // Keyboard-activated buttons follow the same walk-and-interact path as a click.
        this.worldPoke(el,true,null,'twirl');return;
      }
      this._teleportReturnFrom=this.curPage();if(link.to==='inicio')this.unlock('portal-return');this.teleport(link.to,link.arrival,el);
    };
    p.teleportGo=function(to){
      this._teleportDestination=to;
      // The bedroom's ordinary go() path walks through its door. This passage owns its exit.
      const prior=this._rmOutGo;this._rmOutGo=this.curPage()==='quarto'||prior;
      try{this.go(to);}finally{this._rmOutGo=prior;}
    };
    p.teleport=function(to,arrival=null,source=null){
      const wk=this._wk;
      if(wk?.anim?.kind==='teleport-out')return;
      this._teleportArrival=arrival;
      if(!this.worldOn()||!wk||this.calm()){this.teleportGo(to);return;}
      this.worldPokeCancel();this.setTrip(null);this._wKeys={};wk.auto=null;wk.flo=null;
      wk.anim={kind:'teleport-out',t:0,to,hatch:source};this.portalHatch(source,true);this.sfx('poof');
    };
    wrap('worldAnim',function(fn,wk,dt,geo){
      const a=wk.anim;
      if(a.kind==='pickup'){
        a.t+=dt;wk.moving=false;
        if(a.t>=420){if(this._coinSpot===a.spot)base.coinTake.call(this);wk.act=null;return false;}
        return true;
      }
      if(a.kind.startsWith('teleport-')){
        a.t+=dt;wk.moving=false;wk.hidden=false;wk.dir=['d','l','u','r'][Math.floor(a.t/62)%4];
        if(a.t>=760){
          this.portalHatch(a.hatch,false);
          if(a.kind==='teleport-out'){this.teleportGo(a.to);wk.hidden=true;}
          this.sfx('poof');return false;
        }
        return true;
      }
      // Touch visitors can also see and use Hikaru after entering a page.
      const result=fn(wk,dt,geo);if(wk.anim?.kind==='poof'&&wk.anim.t===0){wk.anim=null;wk.hidden=false;return false;}return result;
    });
    wrap('worldPose',function(fn,wk){
      const pose=fn(wk),a=wk.anim;
      if(a?.kind==='pickup'){const k=Math.sin(Math.min(1,a.t/420)*Math.PI);pose.sy=1-.28*k;pose.sx=1+.12*k;}
      if(a?.kind.startsWith('teleport-'))Object.assign(pose,teleportPose(a.t,a.kind==='teleport-out'));
      return pose;
    });
    p.roomPortal=function(){return this.data().room.find(o=>o.id==='room-home');};
    p.roomPortalStart=function(){
      const rm=this.rmInit(),o=this.roomPortal(),s=this.st();
      if(!o||rm.portalTravel||rm.moving||rm.enter||rm.exit||rm.pickup||s.transitioning||s.paused||s.languageOpen||s.rmDlg)return;
      if(rm.x!==o.t[0]||rm.y!==o.t[1]){this.rmGoTo(o.t[0],o.t[1],this.data().room.indexOf(o));return;}
      rm.path=[];rm.held=[];rm.goal=-1;rm.fall=null;rm.stone=null;rm.alignX=0;rm.turn=0;
      this._roomSeen={...this._roomSeen,[o.id]:true};this.setState({roomSeenN:this.roomSeenN(),rmDlg:false,rmIntro:false,rmHov:-1});
      if(this.roomSeenN()>=this.roomTotal())this.unlock('room');this.persistSoon();
      this._teleportArrival='home-room';this.unlock('portal-return');this.sfx('poof');
      rm.portalTravel={kind:'out',t:0};
      if(this.calm()){rm.portalTravel.kind='wait';this.teleportGo('inicio');}
    };
    wrap('rmWalkIn',function(fn){
      const rm=this.rmInit();rm.portalTravel=null;
      if(this._teleportDestination!=='quarto'||this._teleportArrival!=='room-home')return fn();
      const o=this.roomPortal(),[x,y]=o.t;this._rmOut=null;this._directRoom=false;
      Object.assign(rm,{x,y,from:[x,y],to:[x,y],dir:'d',moving:false,t:0,path:[],held:[],goal:-1,goalDir:'',turn:0,enter:false,exit:false,sit:null,fall:null,stone:null,pickup:null,alignX:0,doorT:0,portalTravel:this.calm()?null:{kind:'in',t:0}});
      this._teleportDestination=null;this._teleportArrival=null;this.setState({rmDlg:false,rmIntro:false,rmHov:-1});this.sfx('poof');
    });
    wrap('rmReach',function(fn,rm){
      if(this.data().room[rm.goal]?.portal){rm.goal=-1;this.roomPortalStart();return;}
      return fn(rm);
    });
    wrap('rmInteract',function(fn){
      const rm=this.rmInit(),o=this.roomPortal();if(rm.portalTravel||rm.moving)return;
      if(o&&rm.x===o.t[0]&&rm.y===o.t[1]){this.roomPortalStart();return;}
      const front=this.rmFront(rm);
      if(o&&front[0]===o.t[0]&&front[1]===o.t[1]){this.rmGoTo(o.t[0],o.t[1],this.data().room.indexOf(o));return;}
      return fn();
    });
    wrap('rmGoTo',function(fn,...args){if(!this._rm?.portalTravel)return fn(...args);});
    wrap('rmKey',function(fn,e){if(this._rm?.portalTravel){e.preventDefault?.();return true;}return fn(e);});
    wrap('drawRoomProps',function(fn,ctx,rm){
      fn(ctx,rm);
      const o=this.roomPortal();if(!o)return;
      const x=o.t[0]*16-rm.camX,y=o.t[1]*16-rm.camY;
      // Only the edge peeks out around the foliage; the plant's existing art stays intact.
      ctx.save();ctx.beginPath();ctx.rect(x,y,16,16);
      ctx.moveTo(x+8,y+6);ctx.lineTo(x+14,y+12);ctx.lineTo(x+14,y+16);ctx.lineTo(x+2,y+16);ctx.lineTo(x+2,y+11);ctx.closePath();ctx.clip('evenodd');
      ctx.fillStyle='#193025';ctx.strokeStyle='#799585';ctx.lineWidth=1;ctx.globalAlpha=rm.portalTravel?1:.65;
      ctx.beginPath();ctx.ellipse(x+8,y+14,7,3,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
    });
    p.requestCoin=function(){
      const a=this._coinSpot;if(!a||a.page!==this.curPage())return;
      if(a.tile){const rm=this.rmInit();if(!rm.moving&&rm.x===a.tile[0]&&rm.y===a.tile[1])this.coinTake();else this.rmGoTo(a.tile[0],a.tile[1],-1);return;}
      const geo=this.worldGeo();if(this.worldOn()&&this._wk&&geo){const xy=this.coinXY(a,geo.sc);this.worldPokeCancel();this._wk.autoTarget={x:xy.x+15,y:xy.y+15+6*geo.u,spot:a};this._wKeys={};return;}
      // The lab has no walking layer; the normal collection remains available there.
      this.coinTake();
    };
    wrap('worldMove',function(fn,wk,dt,geo){
      const target=wk.autoTarget;if(!target)return fn(wk,dt,geo);
      if(this._coinSpot!==target.spot||Object.values(this._wKeys||{}).some(Boolean)){wk.autoTarget=null;return fn(wk,dt,geo);}
      const dx=target.x-wk.x,dy=target.y-wk.y,dist=Math.hypot(dx,dy),speed=.22*geo.u*dt;
      if(dist<=speed){wk.x=target.x;wk.y=target.y;wk.autoTarget=null;wk.moving=false;this.coinTake();return false;}
      wk.x+=dx/dist*speed;wk.y+=dy/dist*speed;wk.dir=Math.abs(dx)>Math.abs(dy)?dx<0?'l':'r':dy<0?'u':'d';wk.moving=true;wk.walk+=dt;return true;
    });
    wrap('coinTake',function(fn){
      const spot=this._coinSpot;if(!spot||this.fichaN()>=9)return false;
      if(this.curPage()==='quarto'){const rm=this.rmInit();if(rm.pickup)return false;rm.pickup={t:0,spot};rm.held=[];return false;}
      if(this.worldOn()&&this._wk){if(this._wk.anim)return false;this._wk.anim={kind:'pickup',t:0,spot};return false;}
      return fn();
    });
    p.roomFacing=function(object,rm){const front=this.rmFront(rm);return rm.dir===object.face&&front[0]>=object.t[0]&&front[0]<object.t[0]+object.t[2]&&front[1]>=object.t[1]&&front[1]<object.t[1]+object.t[3];};
    wrap('rmUpdate',function(fn,rm,dt,busy){
      if(rm.portalTravel){
        const a=rm.portalTravel;if(busy||a.kind==='wait')return;
        a.t+=dt;rm.dir=teleportPose(a.t,a.kind==='out').dir;
        if(a.t>=760){if(a.kind==='out'){a.kind='wait';this.teleportGo('inicio');}else{rm.portalTravel=null;rm.dir='d';this.sfx('poof');}}
        return;
      }
      const o=this.data().room[this.st().roomObj],aligned=!rm.moving&&o?.face&&this.roomFacing(o,rm);
      const target=aligned?(o.v?o.v[0]+o.v[2]/2:(o.t[0]+o.t[2]/2)*16)-(rm.x*16+8):0;
      rm.alignX=(rm.alignX||0)+(target-(rm.alignX||0))*Math.min(1,dt/100);
      if(rm.pickup){rm.pickup.t+=dt;if(rm.pickup.t>=420){const spot=rm.pickup.spot;rm.pickup=null;if(this._coinSpot===spot)base.coinTake.call(this);}return;}
      return fn(rm,dt,busy);
    });
    wrap('drawRoomPlayer',function(fn,ctx,img,fr,x,y,rm){
      if(rm.portalTravel){
        if(rm.portalTravel.kind==='wait')return;
        const pose=teleportPose(rm.portalTravel.t,rm.portalTravel.kind==='out');
        const frame={d:0,u:3,l:6,r:9}[pose.dir];
        ctx.save();ctx.translate(x+8,y+24-pose.lift);ctx.scale(pose.sx,pose.sy);ctx.translate(-x-8,-y-24);fn(ctx,img,frame,x,y,rm);ctx.restore();return;
      }
      const a=rm.pickup||this._deckGrab,k=a?Math.sin(Math.min(1,a.t/(rm.pickup?420:700))*Math.PI):0;
      ctx.save();ctx.translate(x+8,y+24);ctx.scale(1+.08*k,1-.2*k);ctx.translate(-x-8,-y-24);fn(ctx,img,fr,x,y,rm);ctx.restore();
      if(this._deckGrab){ctx.fillStyle='#efcf86';ctx.fillRect(x+11,y+12-4*k,5,7);ctx.fillStyle='#4a6268';ctx.fillRect(x+12,y+13-4*k,3,5);}
      if(rm.pickup){ctx.fillStyle='#ebd16f';ctx.fillRect(x+10,y+13-3*k,3,3);}
    });
    wrap('roomAct',function(fn,code,e){
      if(code==='portal:home'){this.roomPortalStart();return;}
      if(code==='puff'){
        const rm=this.rmInit(),o=this.data().room.find(o=>o.id==='puff');rm.held=[];rm.path=[];
        rm.sit={kind:'puff',back:[rm.x,rm.y,rm.dir],at:o.t.slice(0,2),t0:rm.clock,out:0};this.sfx('sit');this.say('O melhor lugar para uma partida na TV de tubo. Pode sentar, o segundo controle é seu.');this.setState({rmDlg:true});this.unlock('little-sun');return;
      }
      if(code==='stand'){this.pcStand(false);this.rmClose();return;}
      if(code==='drone'){
        const rm=this.rmInit(),start=[10,13],route=this.rmPath(9,13,[[8,11],[8,12],[9,12]]);
        const outward=[start,[9,13],...(route?.path||[])];this._drone={t:0,path:outward.concat(outward.slice(0,-1).reverse())};this.sfx('beeps');this.say('Reconhecimento iniciado. O drone vai dar uma volta e já retorna à base.');return;
      }
      if(code.startsWith('decks:')){
        const url=decks[code.slice(6)];if(!url||this._deckGrab)return;
        // Reserve a tab during the user gesture so the later animation cannot trigger a popup block.
        const tab=g.open('about:blank','_blank');if(tab){tab.opener=null;tab.document.title=g.PortfolioI18n.t('Pegando os decks…');}
        this._deckGrab={t:0,url,tab};this._rm.held=[];this._rm.path=[];this.setState({rmDlg:false});this.sfx('grab');return;
      }
      return fn(code,e);
    });
    wrap('rmActs',function(fn){return this._rm?.sit?.kind==='puff'?[['Levantar do puff','stand']]:fn();});
    wrap('rmClose',function(fn){if(this._rm?.sit?.kind==='puff')this.pcStand(false);return fn();});
    wrap('rmKey',function(fn,e){if(this._rm?.sit?.kind==='puff'&&['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)&&!this.st().rmDlg)this.pcStand(true);return fn(e);});
    p.loopScene=function(dt){
      const s=this.st();if(s.paused||s.languageOpen)return;
      if(this._pad?.length&&!this._wPoke?.cur&&!this._wPoke?.q?.length&&!this._wk?.anim&&!this._wk?.moving){this._comboIdle=(this._comboIdle||0)+dt;if(this._comboIdle>=20000)this.padReset();}
      if(this._drone){this._drone.t+=dt;if(this._drone.t>this._drone.path.length*260)this._drone=null;}
      if(this._deckGrab){const a=this._deckGrab;a.t+=dt;if(a.t>=700){this._deckGrab=null;if(a.tab&&!a.tab.closed)a.tab.location.replace(a.url);else g.location.assign(a.url);}}
    };
    wrap('componentWillUnmount',function(fn){this.portalHatch(this._wk?.anim?.hatch,false);if(this._deckGrab?.tab&&!this._deckGrab.tab.closed)this._deckGrab.tab.close();return fn();});
    wrap('renderVals',function(fn){const r=fn();r.rootCls+=' '+(this.calm()?'motion-reduced':'motion-full');r.toggleMotion=()=>this.setState({motionReduced:!this.calm()});r.motionLabel=this.calm()?'Reduzido':'Completo';r.goProjetos=()=>this.teleport('projetos');r.goSobre=()=>this.teleport('sobre');r.portalHome=()=>this.teleportHome();r.portalContact=()=>this.usePortal('home-contact');r.portalRoom=()=>this.usePortal('home-room');r.seisCoinTake=()=>this.requestCoin();return r;});
  }};
})(window);
