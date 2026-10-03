/* Choreography shared by room visits, the regular pages and seismic vision. */
(function(g){
  const decks={archidekt:'https://archidekt.com/folders/1717569',moxfield:'https://moxfield.com/lists/Jb445-paper-decks'};
  // Every page reaches every other one through a hidden passage. Each end names its page, where it leads and
  // the end it comes out of (which leads back); `style` is its passage (a spin when absent). Page ends are
  // buttons found by `selector`; the bedroom ends are tiles (room objects with the same id).
  const sel=id=>'[data-portal-id="'+id+'"]';
  const portals={
    // Início: the hatch above the kanji, the payphone after "Ver sobre" and the two home buttons' passages
    'home-room':{page:'inicio',to:'quarto',arrival:'room-home',selector:sel('home-room')},
    'home-contact':{page:'inicio',to:'contato',arrival:'contact-home',selector:sel('home-contact')},
    'projects-button':{page:'inicio',to:'projetos',arrival:'projetos',selector:'[data-portal-to="projetos"]',style:'fall'},
    'about-button':{page:'inicio',to:'sobre',arrival:'sobre',selector:'[data-portal-to="sobre"]',style:'stairs'},
    // Projetos: the pedestal by the title, two doors in the schematic's walls and a hatch in its floor line
    projetos:{page:'projetos',to:'inicio',arrival:'projects-button',selector:sel('projetos')},
    'projects-about':{page:'projetos',to:'sobre',arrival:'about-projects',selector:sel('projects-about')},
    'projects-contact':{page:'projetos',to:'contato',arrival:'contact-projects',selector:sel('projects-contact')},
    'projects-room':{page:'projetos',to:'quarto',arrival:'room-projects',selector:sel('projects-room')},
    // Sobre: the door by the title, two doors in the "Jogando agora" panel and a hatch under the portrait
    sobre:{page:'sobre',to:'inicio',arrival:'about-button',selector:sel('sobre')},
    'about-projects':{page:'sobre',to:'projetos',arrival:'projects-about',selector:sel('about-projects')},
    'about-contact':{page:'sobre',to:'contato',arrival:'contact-about',selector:sel('about-contact')},
    'about-room':{page:'sobre',to:'quarto',arrival:'room-about',selector:sel('about-room')},
    // Contato: the payphone by GitHub, a door in the bubble wrap, the coin slot and the dot of the "?"
    'contact-home':{page:'contato',to:'inicio',arrival:'home-contact',selector:sel('contact-home')},
    'contact-projects':{page:'contato',to:'projetos',arrival:'projects-contact',selector:sel('contact-projects')},
    'contact-about':{page:'contato',to:'sobre',arrival:'about-contact',selector:sel('contact-about')},
    'contact-room':{page:'contato',to:'quarto',arrival:'room-contact',selector:sel('contact-room')},
    // Quarto: behind the plant, under the pinball, behind the shelf and under the bed
    'room-home':{page:'quarto',to:'inicio',arrival:'home-room'},
    'room-projects':{page:'quarto',to:'projetos',arrival:'projects-room'},
    'room-about':{page:'quarto',to:'sobre',arrival:'about-room'},
    'room-contact':{page:'quarto',to:'contato',arrival:'contact-room'}
  };
  const arrivals=Object.fromEntries(Object.entries(portals).filter(([,link])=>link.selector).map(([id,link])=>[id,link.selector]));
  // The walk between pages, door to door: the bedroom is behind Início's left door.
  const pageOrder=['quarto','inicio','projetos','sobre','contato'];
  function directPortal(from,to){return Object.keys(portals).find(id=>portals[id].page===from&&portals[id].to===to)||null;}
  function portalChance(from,to){
    const a=pageOrder.indexOf(from),b=pageOrder.indexOf(to);
    return a<0||b<0?0:([0,1/10,1/8,1/6,1/4][Math.abs(b-a)]||0);
  }
  function journeyArrival(from,to){return portals[directPortal(from,to)]?.arrival||null;}
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
  // The two home buttons are passages themselves instead of the spin: "Ver projetos" splits open as a trapdoor
  // and drops Hikaru onto the Projetos pedestal, and "Ver sobre" slides aside off a secret staircase that takes
  // him down to Sobre. Times are in ms; poses and drawings are in sprite pixels with his feet at (0,0).
  // The hidden ends have passages of their own too: he walks through a door in a wall (door-l / door-r, by the
  // wall the door is in) or drops into a floor hatch, and comes out of the other end the same way. Those doors
  // and hatches are HTML, so these passages only move and clip Hikaru. Sobre's title has a door seen from the
  // front (door): he walks into it, away from us, and out of it towards us. Início and Contato call each other
  // from two payphones (phone): he answers, it rings and he goes down the line, out of the other one.
  const passages={fall:{out:1000,in:1150},stairs:{out:1500,in:1500},'door-l':{out:900,in:900},'door-r':{out:900,in:900},hatch:{out:1000,in:900},door:{out:900,in:900},phone:{out:1150,in:1000}};
  const clamp=x=>Math.max(0,Math.min(1,x)),easeIn=x=>x*x,easeOut=x=>1-(1-x)*(1-x),easeInOut=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
  const passageCues={
    fall:{out:[[0,'crack'],[120,'door'],[480,'whoosh'],[800,'doorShut']],in:[[0,'whoosh'],[720,'stomp']]},
    stairs:{out:[[0,'creak'],[430,'land'],[520,'land'],[660,'land'],[800,'land'],[940,'land'],[1080,'land'],[1440,'doorShut']],in:[[0,'creak'],[430,'land'],[520,'land'],[660,'land'],[800,'land'],[940,'land'],[1080,'land'],[1440,'doorShut']]},
    hatch:{out:[[0,'door'],[480,'whoosh'],[820,'doorShut']],in:[[0,'door'],[160,'jump'],[560,'land'],[780,'doorShut']]}
  };
  passageCues.door={out:[[0,'door'],[260,'land'],[430,'land'],[600,'land'],[820,'doorShut']],in:[[0,'door'],[300,'land'],[470,'land'],[640,'land'],[820,'doorShut']]};
  passageCues.phone={out:[[0,'ring'],[420,'ring'],[700,'dial']],in:[[0,'ring'],[640,'land']]};
  passageCues['door-l']=passageCues['door-r']={out:[[0,'door'],[300,'land'],[460,'land'],[620,'land'],[800,'doorShut']],in:[[0,'door'],[240,'land'],[400,'land'],[560,'land'],[780,'doorShut']]};
  // How far the trapdoor's leaves or the slab are open: 0 closed, 1 open. Popping back out of the trapdoor
  // (hatch, on "Ver projetos"), the leaves open at once and are shut again before he lands on them.
  function passageOpen(style,out,t){
    const d=passages[style][out?'out':'in'];
    if(style==='fall')return !out?0:t<120?0:t<320?easeOut((t-120)/200):t<780?1:1-easeInOut(clamp((t-780)/200));
    if(style==='hatch')return out?0:t<150?easeOut(t/150):t<400?1:1-easeInOut(clamp((t-400)/160));
    return t<450?easeOut(t/450):t<d-350?1:1-easeInOut(clamp((t-(d-350))/300));
  }
  // hole: the opening's rectangle (sprite px from his feet) when the passage is a button; he is clipped into it.
  function passagePose(style,out,t,drop=60,hole=null){
    const p={dx:0,dy:0,lift:0,rot:0,sx:1,sy:1,dir:'d',alpha:1,walk:false,mark:false,clip:null,dark:0};
    if(style==='door-l'||style==='door-r'){
      // A door in a left wall opens onto him from his right: he steps back while it swings, walks through and is
      // cut off by the wall line (x = 0). The arrival walks out of the wall and ends on the outside.
      const s=style==='door-l'?1:-1,wall=s>0?[-200,-80,200,160]:[0,-80,200,160];
      if(out){
        p.dir=s>0?'r':'l';
        if(t<200)p.dx=-10*s*easeOut(t/200);
        else{const k=clamp((t-200)/600);Object.assign(p,{dx:s*(-10+22*easeInOut(k)),walk:k<1,clip:wall,alpha:k<1?1:0});}
      }else if(t<150)Object.assign(p,{dx:12*s,alpha:0,clip:wall});
      else{const k=clamp((t-150)/600);Object.assign(p,{dir:k<1?(s>0?'l':'r'):'d',dx:s*(12-24*easeInOut(k)),walk:k<1,clip:k<1?wall:null});}
      return p;
    }
    if(style==='door'){
      // A door seen from the front: he turns to it, walks in and fades into the dark, or the other way round.
      if(out){
        p.dir='u';
        if(t>=200){const k=clamp((t-200)/600);Object.assign(p,{walk:k<1,dy:-7*easeIn(k),alpha:1-clamp((k-.35)/.65)});p.sx=p.sy=1-.18*k;}
      }else if(t<150)p.alpha=0;
      else if(t<750){const k=clamp((t-150)/600);Object.assign(p,{walk:true,dy:-7*(1-easeOut(k)),alpha:clamp(k/.5)});p.sx=p.sy=.82+.18*k;}
      return p;
    }
    if(style==='phone'){
      // The payphone: he answers it with his back to us, then the line pulls him up and thin, flickering out;
      // the arrival gathers him from the line and turns him round.
      const flicker=Math.floor(t/50)%2?1:.55;
      if(out){
        p.dir='u';
        if(t>=300&&t<420)p.lift=1.5*Math.sin(Math.PI*(t-300)/120);
        else if(t>=500){const k=easeIn(clamp((t-500)/600));Object.assign(p,{sx:1-.85*k,sy:1+1.2*k,dy:-10*k,alpha:k>=1?0:(1-k)*flicker});}
      }else if(t<100)p.alpha=0;
      else if(t<600){const k=easeOut(clamp((t-100)/500));Object.assign(p,{dir:'u',sx:.15+.85*k,sy:2.2-1.2*k,dy:-10*(1-k),alpha:Math.min(1,k*1.4)*flicker});}
      else if(t<800){const b=Math.sin(Math.PI*(t-600)/200);Object.assign(p,{dir:'d',sy:1-.2*b,sx:1+.12*b});}
      return p;
    }
    if(style==='hatch'){
      // The hatch, the coin slot and the dot of the "?" open under him: the trapdoor drop, then he pops back up.
      if(out)return {...passagePose('fall',true,t),dx:0};
      if(t<150)p.alpha=0;
      else if(t<550){const k=clamp((t-150)/400);Object.assign(p,{lift:10*Math.sin(Math.PI*k),rot:-.7*(1-k),alpha:Math.min(1,k*3),dir:['d','r','u','l'][Math.floor(t/70)%4]});p.sx=p.sy=.2+.8*easeOut(k);}
      else if(t<750){const b=Math.sin(Math.PI*(t-550)/200);p.sy=1-.25*b;p.sx=1+.2*b;}
      return p;
    }
    if(style==='fall'&&out){
      if(t<320){if(t>120)p.sy=1-.1*Math.sin(Math.PI*(t-120)/200);}
      else if(t<480){p.lift=2*Math.sin(Math.PI*(t-320)/160);p.mark=true;}
      else if(t<780){
        const k=easeIn((t-480)/300),s=1-.82*k;p.sx=p.sy=s;p.rot=.7*k;p.alpha=1-.75*k;
        // into the button's pit he shrinks towards its depth, darkening; a small hatch takes him through its rim
        if(hole)Object.assign(p,{dy:2*k-12*(1-s),dark:.7*k,clip:hole});
        else{p.dy=6*k;p.clip=[-11,-30+26*k,22,34-26*k];}
      }else p.alpha=0;
    }else if(style==='fall'){
      const T=720;
      if(t<T){const k=t/T;p.lift=drop*(1-k*k);p.rot=Math.PI*4*k;p.dir=['d','l','u','r'][Math.floor(t/70)%4];}
      else if(t<900){const b=Math.sin(Math.PI*(t-T)/180);p.sy=1-.35*b;p.sx=1+.3*b;}
      else p.lift=3*Math.sin(Math.PI*clamp((t-900)/250));
    }else{
      // He turns to the steps the slab uncovered and walks down them into the dark, smaller and darker with
      // every step, until the far end takes him; the arrival climbs out of the dark the same way, towards us.
      const q=out?clamp((t-450)/700):1-clamp((t-450)/700);
      p.dir=out&&t>=300?'u':'d';p.walk=t>=450&&t<1150;p.sx=p.sy=1-.3*q;p.dark=.8*q;
      p.dy=(p.walk?-Math.abs(Math.sin(t/70)):0)-16*easeInOut(q);p.alpha=q>=1?0:1-clamp((q-.7)/.3);p.clip=hole||[-12,-60,24,62];
    }
    return p;
  }
  function drawHikaru(ctx,img,p,t){
    if(!img||p.alpha<=0)return;
    const fr={d:0,u:3,l:6,r:9}[p.dir]+(p.walk?[0,1,0,2][Math.floor(t/130)%4]:0);
    ctx.save();ctx.globalAlpha=p.alpha;if(p.dark)ctx.filter='brightness('+(1-p.dark)+')';
    if(p.clip){ctx.beginPath();ctx.rect(...p.clip);ctx.clip();}
    ctx.translate(p.dx||0,p.dy-p.lift);ctx.translate(0,-12);ctx.rotate(p.rot);ctx.translate(0,12);ctx.scale(p.sx,p.sy);
    ctx.drawImage(img,48+fr*16,224,16,24,-8,-24,16,24);
    ctx.restore();
  }
  // The openings are HTML (the home buttons, the hatches and doors on the panels): this draws Hikaru clipped
  // into them, the landing's shadow and dust, the grit of the button's seam and of the slab's trailing edge.
  function drawPassage(ctx,style,out,t,img,drop,clock,hole){
    const R=(x,y,w,h,c,a=1)=>{ctx.globalAlpha=a;ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    const pose=passagePose(style,out,t,drop,hole);
    if(style==='fall'&&!out){
      const k=Math.min(1,t/720),sw=4+8*k;R(-sw/2,-1,sw,1,'#000000',.12+.25*k);
      const b=(t-720)/320;if(b>=0&&b<1)for(let i=0;i<8;i++)R((i-3.5)*3*(1+b*1.5),-1-b*3*(i%2),2,2,'#b8aa90',.75*(1-b));
    }
    drawHikaru(ctx,img,pose,t);
    if(hole){
      const [hx,hy,hw,hh]=hole,cx=hx+hw/2;
      // the seam cracking down the middle of "Ver projetos", and the dust its leaves puff out as they shut
      if(style==='fall'&&out&&t<420)for(let i=0;i<6;i++){const k=t/420;R(cx-1+(i%2)*2,hy+hh*(i+2*k)/8,1,1,'#9c8f78',1-k);}
      if(style==='fall'&&out&&t>=780&&t<1000)for(let i=0;i<10;i++){const k=(t-780)/220;R(cx+(i-4.5)*hw/14*(.5+k),hy+hh/2-k*4*(i%2),2,2,'#b8aa90',.7*(1-k));}
      // grit trickling off the slab's trailing edge while it grinds aside or back
      const open=passageOpen(style,out,t);
      if(style==='stairs'&&open>0&&open<1)for(let i=0;i<5;i++)R(hx+open*hw-1,hy+(clock/30+i*hh/5)%hh,1,1,'#9c8f78',.6);
    }
    // the line carries him as a few gold bits rising out of (or falling into) the payphone
    if(style==='phone'){const from=out?500:100,to=out?1100:600;if(t>=from&&t<to)for(let i=0;i<6;i++){const k=((t-from)/6+i*9)%34;R((i-2.5)*3,out?-24-k:-58+k,1,1,'#F0CE6A',.8*(1-k/34));}}
    if(pose.mark){const by=-34-pose.lift-(Math.floor(clock/300)%2);R(-3,by,7,8,'#050706');R(-2,by+1,5,6,'#F0CE6A');R(0,by+2,1,2,'#050706');R(0,by+5,1,1,'#050706');}
    ctx.globalAlpha=1;
  }
  // The bedroom ends: what hides each passage, which way he faces on its tile and how long the exit and the
  // arrival take (ms). The plant's circle is the plain spin; the others open first and close behind him.
  const roomEnds={
    'room-home':{hide:'plant',face:'d',len:{out:760,in:760}},
    'room-projects':{hide:'pinball',face:'l',len:{out:900,in:1200}},
    'room-about':{hide:'shelf',face:'u',len:{out:900,in:1200}},
    'room-contact':{hide:'bed',face:'l',len:{out:950,in:1200}}
  };
  const roomCues={
    pinball:{out:[[0,'creak'],[320,'door'],[600,'whoosh']],in:[[0,'creak'],[300,'jump'],[700,'land'],[900,'doorShut']]},
    shelf:{out:[[0,'creak'],[380,'land'],[540,'land'],[700,'land']],in:[[0,'creak'],[400,'land'],[560,'land'],[720,'land'],[900,'doorShut']]},
    bed:{out:[[0,'whoosh'],[250,'sit'],[520,'creak']],in:[[0,'creak'],[300,'sit'],[800,'land']]}
  };
  // How open the hiding place is (0 closed, 1 open). After the exit it stays open while the page fades.
  function roomOpen(id,kind,t){
    const end=roomEnds[id];if(!end||end.hide==='plant'||!kind)return 0;
    if(kind==='wait')return 1;
    const pre=end.hide==='bed'?250:300,len=end.len[kind==='out'?'out':'in'];
    if(kind==='out')return easeOut(clamp(t/pre));
    return t<pre?easeOut(t/pre):1-easeInOut(clamp((t-(len-pre))/pre));
  }
  // Where he is against his tile (room px), how he faces and how much of him shows. clipTop hides what is
  // above a room row (the lip of the doorway behind the shelf); under puts the bed back over him.
  function roomPose(id,out,t){
    const end=roomEnds[id]||roomEnds['room-home'],p={dir:end.face,walk:false,dx:0,dy:0,lift:0,sx:1,sy:1,rot:0,alpha:1,clipTop:null,under:false};
    if(end.hide==='plant'){const q=teleportPose(t,out);return {...p,dir:q.dir,lift:q.lift,sx:q.sx,sy:q.sy};}
    if(end.hide==='pinball'){
      // a step onto the hatch the cabinet uncovered, a hop, and down he goes; the arrival pops him back up
      if(out){
        if(t>=300&&t<500){const k=clamp((t-300)/200);p.walk=true;p.dx=-17*k;p.dy=-5*k;}
        else if(t>=500){
          p.dx=-17;p.dy=-5;p.dir='d';
          if(t<580)p.lift=3*Math.sin(Math.PI*(t-500)/80);
          else{const k=easeIn(clamp((t-580)/320));p.sx=p.sy=1-.8*k;p.rot=.9*k;p.dy=-5+4*k;p.alpha=1-k;}
        }
      }else if(t<300){p.dx=-17;p.dy=-5;p.alpha=0;}
      else if(t<700){const k=clamp((t-300)/400);Object.assign(p,{dx:-17,dy:-5,dir:['d','l','u','r'][Math.floor(t/70)%4],lift:10*Math.sin(Math.PI*k),alpha:Math.min(1,k*3)});p.sx=p.sy=.2+.8*easeOut(k);}
      else if(t<900){const k=clamp((t-700)/200);Object.assign(p,{dir:'r',walk:true,dx:-17+17*k,dy:-5+5*k});}
      else p.dir='d';
      return p;
    }
    if(end.hide==='shelf'){
      // up the steps behind the shelf, sinking behind the lip of the doorway
      p.clipTop=144;
      if(out){if(t>=300){const k=clamp((t-300)/600);p.walk=true;p.dy=-24*k;p.alpha=1-clamp((k-.7)/.3);}}
      else if(t<300){p.dy=-24;p.alpha=0;}
      else if(t<900){const k=clamp((t-300)/600);Object.assign(p,{dir:'d',walk:true,dy:-24+24*k,alpha:clamp(k/.3)});}
      else p.dir='d';
      return p;
    }
    // the bed: he crouches and crawls under it
    p.under=true;
    if(out){
      if(t>=250&&t<450)p.sy=1-.25*clamp((t-250)/200);
      else if(t>=450)Object.assign(p,{sy:.75,walk:true,dx:-26*easeInOut(clamp((t-450)/500))});
    }else if(t<250)Object.assign(p,{dx:-26,sy:.75});
    else if(t<750)Object.assign(p,{dir:'r',sy:.75,walk:true,dx:-26+26*easeInOut(clamp((t-250)/500))});
    else if(t<950)Object.assign(p,{dir:'d',sy:.75+.25*clamp((t-750)/200)});
    else p.dir='d';
    return p;
  }
  // Closed, only a hint peeks out; opening, the furniture moves aside. Room px, drawn under Hikaru.
  function drawRoomEnd(ctx,rm,id,open,active,img){
    const X=x=>x-rm.camX,Y=y=>y-rm.camY,R=(x,y,w,h,c,a=1)=>{ctx.globalAlpha=a;ctx.fillStyle=c;ctx.fillRect(X(x),Y(y),w,h);};
    const hide=roomEnds[id]?.hide;ctx.save();
    if(hide==='plant'){
      const x=X(368),y=Y(160);
      // Only the edge peeks out around the foliage; the plant's existing art stays intact.
      ctx.beginPath();ctx.rect(x,y,16,16);
      ctx.moveTo(x+8,y+6);ctx.lineTo(x+14,y+12);ctx.lineTo(x+14,y+16);ctx.lineTo(x+2,y+16);ctx.lineTo(x+2,y+11);ctx.closePath();ctx.clip('evenodd');
      ctx.fillStyle='#193025';ctx.strokeStyle='#799585';ctx.lineWidth=1;ctx.globalAlpha=active?1:.65;
      ctx.beginPath();ctx.ellipse(x+8,y+14,7,3,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    }else if(hide==='pinball'){
      if(open>0&&img){
        const s=Math.round(14*open);
        // floor where the cabinet stood, the hatch it covered, then the cabinet slid back
        ctx.globalAlpha=1;ctx.drawImage(img,225,64,16,48,X(205),Y(64),16,48);
        R(206,98,16,13,'#2a2118');R(208,100,12,9,'#030504');R(208,100,12,1,'#1d1812');R(209,107,10,1,'#193025',.9);
        ctx.globalAlpha=1;ctx.drawImage(img,205,64,16,47,X(205),Y(64-s),16,47);
      }else R(220,108,1,3,'#8fd3a6',.35);
    }else if(hide==='shelf'){
      if(open>0&&img){
        const s=Math.round(16*open);
        // a doorway with steps going down into the wall, then the shelf slid up along it
        R(0,144,16,16,'#0c0a07');['#2e291f','#211d16','#16130e'].forEach((c,i)=>R(1,146+i*4,14,3,c));
        ctx.globalAlpha=1;ctx.drawImage(img,0,96,16,64,X(0),Y(96-s),16,64);
      }else R(15,150,1,9,'#8fd3a6',.25);
    }else if(hide==='bed'){
      R(31,66,2,13,'#5fa07a',.12+.5*open);
      if(open>0)R(30,78,4,2,'#030504',.6*open);
    }
    ctx.restore();
  }
  const motionKey='okaru-motion';
  g.PortfolioScene={motionKey,decks,route,portals,pageOrder,directPortal,journeyArrival,teleportPose,portalChance,passages,passagePose,passageOpen,roomEnds,roomOpen,roomPose,install(C){
    const p=C.prototype,base={};
    const wrap=(name,fn)=>{const original=p[name];base[name]=original;p[name]=function(...args){return fn.call(this,original.bind(this),...args);};};
    // The pause-menu setting is the only motion switch; it survives reloads and new games, separate from the save.
    p.calm=function(){const s=this.st().motionReduced;if(typeof s==='boolean')return s;if(this._motionSaved===undefined){try{this._motionSaved=g.localStorage.getItem(motionKey)==='reduced';}catch{this._motionSaved=false;}}return this._motionSaved;};
    p.toggleMotion=function(){const next=!this.calm();this._motionSaved=next;try{g.localStorage.setItem(motionKey,next?'reduced':'full');}catch{/* Still applies to this visit. */}this.setState({motionReduced:next});};
    p.worldRoute=function(wk,to,geo){return this.calm()||this._wTrip?.run?[]:route(wk,to,geo);};
    p.worldRouteStep=function(wk,points,dt,geo){
      if(!points?.length)return false;
      const p=points[0],dx=p.x-wk.x,dy=p.y-wk.y,distance=Math.hypot(dx,dy),speed=.23*geo.u*dt*this.worldFloSpeed(wk);
      if(distance<=Math.max(speed,geo.u)){wk.x=p.x;wk.y=p.y;points.shift();return points.length>0;}
      wk.x+=dx/distance*speed;wk.y+=dy/distance*speed;wk.dir=Math.abs(dx)>Math.abs(dy)?dx<0?'l':'r':dy<0?'u':'d';wk.moving=true;wk.walk+=dt;return true;
    };
    wrap('go',function(fn,to,...args){
      if(!this.st().transitioning&&to!==this.curPage()&&this._teleportDestination!==to){
        this._teleportArrival=null;this._teleportDestination=null;this._teleportStyle=null;this.portalHatch(this._wk?.anim?.hatch,false);
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
    // Roll once per navigation request: he may take the hidden passage that joins the two pages instead of
    // walking door to door. Explicit doors, pedestal clicks and the room's objects keep their routes.
    // Keeping this in the existing trip preserves accelerate, skip and destination changes.
    wrap('navGo',function(fn,to,then){
      const from=this.curPage(),s=this.st(),wk=this._wk,prior=this._wTrip;
      if(wk?.anim?.kind==='teleport-out'&&pageOrder.includes(to)){
        if(to===from){this.portalHatch(wk.anim.hatch,false);wk.anim=null;this._teleportArrival=null;this.setTrip(null);if(then)then();return;}
        wk.anim.to=to;wk.anim.then=then;this._teleportArrival=journeyArrival(from,to);return;
      }
      // The bedroom has no walking layer: its roll happens where he would head for the door (rmExit).
      if(from==='quarto'){this._rmNavRoll=true;try{return fn(to,then);}finally{this._rmNavRoll=false;}}
      const id=directPortal(from,to),link=portals[id];
      const eligible=!s.transitioning&&wk&&!wk.hidden&&wk.page===from&&(!prior||prior.to!==to)&&!!link?.selector&&portalChance(from,to)>0;
      const result=fn(to,then),trip=this._wTrip;
      if(eligible&&trip?.to===to){
        const el=this.portalEl(this.worldGeo(),link.selector),r=el?.getBoundingClientRect();
        if(r?.width>0&&r.height>0&&Math.random()<portalChance(from,to)){
          this.setTrip({...trip,portal:{id,from}});
          if(wk.auto)wk.auto.route=null;
        }
      }
      return result;
    });
    wrap('worldAutoMove',function(fn,wk,dt,geo){
      const trip=this._wTrip,choice=trip?.portal;
      if(!choice)return fn(wk,dt,geo);
      const link=portals[choice.id],el=link&&choice.from===this.curPage()?this.portalEl(geo,link.selector):null,r=el?.getBoundingClientRect();
      if(!r?.width||!r.height){
        const fallback={...trip};delete fallback.portal;this.setTrip(fallback);wk.auto.route=null;return fn(wk,dt,geo);
      }
      const [x,py]=this.portalPoint(el,geo),y=py+3*geo.u,auto=wk.auto;
      if(!auto.portalTarget||Math.hypot(x-auto.portalTarget.x,y-auto.portalTarget.y)>geo.u){
        auto.portalTarget={x,y};auto.route=this.worldRoute(wk,auto.portalTarget,geo);
      }
      if(this.worldRouteStep(wk,auto.route,dt,geo))return true;
      const dx=x-wk.x,dy=y-wk.y,distance=Math.hypot(dx,dy),speed=(trip.run ? .3 : .15)*geo.u*dt*this.worldFloSpeed(wk);
      if(distance<=Math.max(speed,geo.u)){
        wk.x=x;wk.y=y;wk.moving=false;this._teleportReturnFrom=choice.from;
        if(trip.to==='inicio')this.unlock('portal-return');
        this.teleport(trip.to,link.arrival,el,trip.then,link.style);return true;
      }
      wk.x+=dx/distance*speed;wk.y+=dy/distance*speed;wk.dir=Math.abs(dx)>Math.abs(dy)?dx<0?'l':'r':dy<0?'u':'d';wk.moving=true;wk.walk+=dt*(trip.run?2:1.5);return true;
    });
    wrap('worldSpawn',function(fn,page,geo){
      const wk=fn(page,geo);wk.hidden=false;
      if(!wk.anim)wk.anim={kind:'out',side:'L',t:-120,flourish:false};
      if(this._teleportDestination===page){
        const el=this.teleportAnchor(geo),spot=this.teleportSpot(geo);wk.x=spot.x;wk.y=spot.y;
        // Scroll the landing into view before the spin begins, including on small screens.
        geo.sc.scrollTop=Math.max(0,Math.min(geo.CH-geo.H,wk.y-geo.H*.45));geo.top=geo.sc.scrollTop;
        // The home buttons' trapdoor and staircase arrive the way they left; every other end by its own kind.
        const style=this._teleportStyle||this.endStyle(el);
        wk.anim=this.calm()?null:{kind:'teleport-in',t:0,hatch:el,style,drop:(wk.y-geo.top)/geo.u+14};this.portalHatch(el,!this.calm()&&!this._teleportStyle);
        this._teleportDestination=null;this._teleportArrival=null;this._teleportStyle=null;
      }
      return wk;
    });
    p.teleportAnchor=function(geo){
      const selector=arrivals[this._teleportArrival]||(this.curPage()==='inicio'?'[data-portal-to="'+(this._teleportReturnFrom==='projetos'?'projetos':'sobre')+'"]':'.portal-anchor');
      return this.portalEl(geo,selector);
    };
    // An end may exist twice, once per layout (the schematic's passages move to the quest list on narrow
    // screens): the one on screen wins.
    p.portalEl=function(geo,selector){
      const sc=geo?.sc,first=sc?.querySelector?.(selector),shown=el=>{const r=el?.getBoundingClientRect?.();return r?.width>0&&r.height>0;};
      if(!first||shown(first))return first||null;
      return Array.from(sc.querySelectorAll?.(selector)||[]).find(shown)||first;
    };
    p.teleportSpot=function(geo){
      const el=this.teleportAnchor(geo);
      const rect=el?.getBoundingClientRect();
      if(rect?.width>0&&rect.height>0){const screen=geo.sc.getBoundingClientRect();return {x:rect.left-screen.left+rect.width/2,y:rect.bottom-screen.top+geo.top-8};}
      return {x:Math.max(40,geo.W*.4),y:geo.dy+25*geo.u};
    };
    p.portalHit=function(geo,wk,target){
      if(!geo||!wk||wk.hidden)return null;
      const elements=target?[target]:Array.from(geo.sc.querySelectorAll?.('.portal-anchor')||[geo.sc.querySelector?.('.portal-anchor')]);
      const sr=geo.sc.getBoundingClientRect(),x=wk.x+sr.left,y=wk.y-geo.top+sr.top-3*geo.u;
      // Short ends (a slot, the dot of a letter) still count where portalPoint parks him.
      return elements.find(el=>{if(!el)return false;const r=el.getBoundingClientRect(),top=Math.min(r.top,r.bottom-8-6*geo.u-1);return r.width>0&&r.height>0&&x>=r.left&&x<=r.right&&y>=top&&y<=r.bottom;})||null;
    };
    // Hatches, doors, the letter and the hidden pedestals show that they are open while he goes through.
    p.portalHatch=function(el,open){
      if(['portal-hatch','portal-door','portal-letter','portal-secret','portal-front','portal-phone'].some(k=>el?.classList?.contains(k)))el.classList[open?'add':'remove']('is-open');
      if(!open&&el&&this._btnFx?.el===el)this.buttonFxEnd();
    };
    // "Ver projetos" and "Ver sobre" open themselves. The button stays where it is as the opening (CSS swaps its
    // face for the pit or the steps) and what moves are copies of it laid over it: the trapdoor's two halves,
    // dropping into the dark, or the slab, sliding aside. They are set every frame from Hikaru's clock.
    p.passageButton=function(el){return el?.matches?.('.btn[data-portal-to]')?el:null;};
    p.buttonFx=function(el,style,out,t){
      let fx=this._btnFx;
      if(fx&&fx.el!==el){this.buttonFxEnd();fx=null;}
      if(!fx){
        const cs=g.getComputedStyle(el),arrow=el.querySelector('.arr'),nudge=arrow&&g.getComputedStyle(arrow).transform,kind=style==='stairs'?'slab':'trap';
        // exactly where it is (fractions included, or a label that just fits would wrap), as it looks right now:
        // a hovered button is lighter and its arrow nudged
        const box=el.parentNode,r=el.getBoundingClientRect(),br=box.getBoundingClientRect();
        const copy=cls=>{
          const c=el.cloneNode(true);c.removeAttribute('data-portal-to');c.classList.remove('wk-poke');c.classList.add('pass-copy',cls);
          c.setAttribute('aria-hidden','true');c.tabIndex=-1;c.inert=true;
          Object.assign(c.style,{left:r.left-br.left-box.clientLeft+'px',top:r.top-br.top-box.clientTop+'px',width:r.width+'px',height:r.height+'px',color:cs.color,borderColor:cs.borderColor});
          if(kind==='trap')c.style.backgroundColor=cs.backgroundColor;
          if(nudge&&nudge!=='none')c.querySelector('.arr').style.transform=nudge;
          c.style.setProperty('--w',r.width+'px');box.appendChild(c);return c;
        };
        fx=this._btnFx={el,copies:kind==='trap'?[copy('pass-l'),copy('pass-r')]:[copy('pass-slab')]};
        el.classList.add('pass-hole',kind==='trap'?'pass-pit':'pass-steps');
      }
      const open=passageOpen(style,out,t),seam=style==='fall'&&out?clamp(t/120):1,shake=open>0&&open<1&&style==='stairs'?Math.sin(t/16)*.6:0;
      for(const c of fx.copies){c.style.setProperty('--open',open.toFixed(3));c.style.setProperty('--seam',seam.toFixed(2));c.style.setProperty('--shake',shake.toFixed(2)+'px');}
    };
    p.buttonFxEnd=function(){
      const fx=this._btnFx;if(!fx)return;this._btnFx=null;
      for(const c of fx.copies)c.remove();
      // its own face comes back at once, without the gold fading in over the pit
      const el=fx.el;el.style.transition='none';el.classList.remove('pass-hole','pass-pit','pass-steps');void el.offsetWidth;el.style.transition='';
    };
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
      if(!link?.selector||this.curPage()!==link.page||s.transitioning||s.paused||s.languageOpen||s.palOpen||s.achOpen||s.recOpen||s.troOpen||s.credOpen||wk?.anim?.kind.startsWith('teleport-'))return;
      const geo=this.worldGeo(),el=this.portalEl(geo,link.selector);if(!el)return;
      if(wk&&!wk.hidden&&this.worldOn()&&!this.calm()&&!this.portalHit(geo,wk,el)){
        // Keyboard-activated buttons follow the same walk-and-interact path as a click.
        this.worldPoke(el,true,null,'twirl');return;
      }
      this._teleportReturnFrom=this.curPage();if(link.to==='inicio')this.unlock('portal-return');this.teleport(link.to,link.arrival,el,undefined,link.style);
    };
    p.teleportGo=function(to,then){
      this._teleportDestination=to;
      // The bedroom's ordinary go() path walks through its door. This passage owns its exit.
      const prior=this._rmOutGo;this._rmOutGo=this.curPage()==='quarto'||prior;
      try{this.go(to,then);}finally{this._rmOutGo=prior;}
    };
    // Which passage an end uses: hidden doors are walked through, hatches (the coin slot and the "?" too) are
    // dropped into, Sobre's door and the payphones have their own, "Ver sobre" is its staircase, "Ver projetos"
    // a trapdoor he pops back out of, and the pedestal and the kanji hatch spin.
    p.endStyle=function(el){
      const has=k=>!!el?.classList?.contains?.(k),to=el?.getAttribute?.('data-portal-to');
      return has('portal-door-l')?'door-l':has('portal-door-r')?'door-r':has('portal-floor')||has('portal-letter')||to==='projetos'?'hatch':has('portal-front')?'door':has('portal-phone')?'phone':to==='sobre'?'stairs':'spin';
    };
    // The home buttons are passages: like any other end, he walks onto the button before it opens.
    p.homePassage=function(id){
      const link=portals[id];
      if(this.portalEl(this.worldGeo(),link.selector))this.usePortal(id);
      else this.teleport(link.to,link.arrival,null,undefined,link.style);
    };
    p.teleport=function(to,arrival=null,source=null,then,style='spin'){
      const wk=this._wk;
      if(wk?.anim?.kind==='teleport-out')return;
      // The trapdoor's fall shapes both ends (he lands on the Projetos pedestal). Every other passage leaves the
      // way its button or end goes (the "Ver sobre" staircase) and arrives the way the other end does.
      const shared=style==='fall';
      this._teleportArrival=arrival;this._teleportStyle=shared?style:null;
      this.worldPokeCancel();this.setTrip(null);this._wKeys={};if(wk){wk.auto=null;wk.flo=null;}
      if(!this.worldOn()||!wk||this.calm()){this._teleportStyle=null;this.teleportGo(to,then);return;}
      const leave=style!=='spin'?style:this.endStyle(source);
      // a button opens under him, so he has to be on it (he is hidden on a tap, and may be anywhere then)
      const geo=this.passageButton(source)&&this.worldGeo();
      if(geo&&!this.portalHit(geo,wk,source)){const [x,y]=this.portalPoint(source,geo);wk.x=x;wk.y=y+3*geo.u;}
      wk.anim={kind:'teleport-out',t:0,to,hatch:source,then,style:leave};
      if(!shared){this.portalHatch(source,true);if(leave==='spin')this.sfx('poof');}
    };
    p.passageCue=function(a,from,to){
      const out=a.kind==='teleport-out';
      for(const [at,name] of passageCues[a.style]?.[out?'out':'in']||[])if(at>=from&&at<to||at===0&&from===0)this.sfx(name);
    };
    wrap('worldAnim',function(fn,wk,dt,geo){
      const a=wk.anim;
      if(a.kind==='pickup'){
        a.t+=dt;wk.moving=false;
        if(a.t>=420){if(this._coinSpot===a.spot)base.coinTake.call(this);wk.act=null;return false;}
        return true;
      }
      if(a.kind.startsWith('teleport-')){
        const passage=passages[a.style],out=a.kind==='teleport-out',duration=passage?passage[out?'out':'in']:760,from=a.t;
        a.t+=dt;wk.moving=false;wk.hidden=false;
        if(passage){this.passageCue(a,from,a.t);wk.dir=passagePose(a.style,out,Math.min(a.t,duration-1),a.drop).dir;}
        else wk.dir=['d','l','u','r'][Math.floor(a.t/62)%4];
        if(a.t>=duration){
          this.portalHatch(a.hatch,false);
          if(out){this.teleportGo(a.to,a.then);wk.hidden=true;}
          // walking out of a door ends outside it: keep him where the last frame left him
          else if(passage){const q=passagePose(a.style,false,duration,a.drop);if(q.dx)wk.x+=q.dx*geo.u;}
          if(!passage)this.sfx('poof');else wk.dir='d';
          return false;
        }
        return true;
      }
      // Touch visitors can also see and use Hikaru after entering a page.
      const result=fn(wk,dt,geo);if(wk.anim?.kind==='poof'&&wk.anim.t===0){wk.anim=null;wk.hidden=false;return false;}return result;
    });
    wrap('worldPose',function(fn,wk){
      const pose=fn(wk),a=wk.anim;
      if(a?.kind==='pickup'){const k=Math.sin(Math.min(1,a.t/420)*Math.PI);pose.sy=1-.28*k;pose.sx=1+.12*k;}
      if(a?.kind.startsWith('teleport-')){
        if(passages[a.style]){const q=passagePose(a.style,a.kind==='teleport-out',a.t,a.drop);Object.assign(pose,{dir:q.dir,lift:q.lift-q.dy,rot:q.rot,sx:q.sx,sy:q.sy});}
        else Object.assign(pose,teleportPose(a.t,a.kind==='teleport-out'));
      }
      return pose;
    });
    // Passages clip Hikaru into their opening, so the regular sprite is skipped for that frame. A home button
    // opens with him, and is the hole he goes through (popping out of the trapdoor, he leaves it unclipped).
    wrap('worldDraw',function(fn,cv,geo,wk){
      const a=wk?.anim,style=a?.kind?.startsWith('teleport-')&&passages[a.style]?a.style:null,out=a?.kind==='teleport-out';
      const button=style&&this.passageButton(a.hatch);
      if(button)this.buttonFx(button,style,out,a.t);else if(this._btnFx)this.buttonFxEnd();
      if(!style||wk.hidden)return fn(cv,geo,wk);
      wk.hidden=true;try{fn(cv,geo,wk);}finally{wk.hidden=false;}
      const ctx=cv.getContext?.('2d');if(!ctx)return;
      let hole=null;
      if(button&&style!=='hatch'){const r=button.getBoundingClientRect(),sr=geo.sc.getBoundingClientRect();hole=[(r.left-sr.left-wk.x)/geo.u,(r.top-sr.top-wk.y+geo.top)/geo.u,r.width/geo.u,r.height/geo.u];}
      const dpr=Math.min(2,g.devicePixelRatio||1),u=geo.u*dpr;
      ctx.save();ctx.translate(Math.round(wk.x*dpr),Math.round((wk.y-geo.top)*dpr));ctx.scale(u,u);ctx.imageSmoothingEnabled=false;
      drawPassage(ctx,style,out,a.t,this.worldImg(),a.drop,this._wClock||a.t,hole);
      ctx.restore();
    });
    // ---- the bedroom ends ----
    p.roomPortals=function(){return this.data().room.filter(o=>o.portal&&roomEnds[o.id]);};
    p.roomPortal=function(id='room-home'){return this.data().room.find(o=>o.portal&&o.id===id)||null;};
    p.roomPortalAt=function(x,y){return this.roomPortals().find(o=>o.t[0]===x&&o.t[1]===y)||null;};
    p.roomPortalStart=function(id='room-home'){
      const rm=this.rmInit(),o=this.roomPortal(id),s=this.st();
      if(!o||rm.portalTravel||rm.moving||rm.enter||rm.exit||rm.pickup||s.transitioning||s.paused||s.languageOpen||s.rmDlg)return;
      if(rm.x!==o.t[0]||rm.y!==o.t[1]){this.rmGoTo(o.t[0],o.t[1],this.data().room.indexOf(o));return;}
      // an automatic trip that chose this passage hands over its callback
      const trip=this._rmOut?.portal===o.id?this._rmOut:null;if(this._rmOut){this._rmOut=null;this.tripSync();}
      const link=portals[o.id],end=roomEnds[o.id];
      rm.path=[];rm.held=[];rm.goal=-1;rm.fall=null;rm.stone=null;rm.alignX=0;rm.turn=0;if(end.hide!=='plant')rm.dir=end.face;
      this._roomSeen={...this._roomSeen,[o.id]:true};this.setState({roomSeenN:this.roomSeenN(),rmDlg:false,rmIntro:false,rmHov:-1});
      if(this.roomSeenN()>=this.roomTotal())this.unlock('room');this.persistSoon();
      this._teleportArrival=link.arrival;if(link.to==='inicio')this.unlock('portal-return');if(end.hide==='plant')this.sfx('poof');
      rm.portalTravel={kind:'out',t:0,id:o.id,then:trip?.then};
      if(this.calm()){rm.portalTravel.kind='wait';this.teleportGo(link.to,trip?.then);}
    };
    p.roomCue=function(a,from,to){
      const cues=roomCues[roomEnds[a.id]?.hide]?.[a.kind==='out'?'out':'in']||[];
      for(const [at,name] of cues)if(at>=from&&at<to||at===0&&from===0)this.sfx(name);
    };
    wrap('rmWalkIn',function(fn){
      const rm=this.rmInit();rm.portalTravel=null;
      const o=this._teleportDestination==='quarto'?this.roomPortal(this._teleportArrival):null;
      if(!o)return fn();
      const [x,y]=o.t,end=roomEnds[o.id];this._rmOut=null;this._directRoom=false;
      Object.assign(rm,{x,y,from:[x,y],to:[x,y],dir:end.hide==='plant'?'d':end.face,moving:false,t:0,path:[],held:[],goal:-1,goalDir:'',turn:0,enter:false,exit:false,sit:null,fall:null,stone:null,pickup:null,alignX:0,doorT:0,portalTravel:this.calm()?null:{kind:'in',t:0,id:o.id}});
      this._teleportDestination=null;this._teleportArrival=null;this.setState({rmDlg:false,rmIntro:false,rmHov:-1});
      if(end.hide==='plant'||!rm.portalTravel)this.sfx('poof');
      if(!rm.portalTravel){rm.dir='d';this.roomIntro();}
    });
    wrap('rmReach',function(fn,rm){
      const o=this.data().room[rm.goal];
      if(o?.portal){rm.goal=-1;this.roomPortalStart(o.id);return;}
      // Walking to an object can end on a passage tile: that object, not the passage, answers.
      this._rmReaching=true;try{return fn(rm);}finally{this._rmReaching=false;}
    });
    wrap('rmInteract',function(fn){
      const rm=this.rmInit();if(rm.portalTravel||rm.moving)return;
      const here=this._rmReaching?null:this.roomPortalAt(rm.x,rm.y);
      if(here){this.roomPortalStart(here.id);return;}
      const front=this.rmFront(rm),ahead=this.roomPortalAt(front[0],front[1]);
      if(ahead){this.rmGoTo(ahead.t[0],ahead.t[1],this.data().room.indexOf(ahead));return;}
      return fn();
    });
    // Leaving through the navigation: like on the pages, he may head for the passage to that page instead
    // of the door (once per request). The door, its dialog and the room's objects keep their routes.
    wrap('rmExit',function(fn,to,then){
      const rm=this._rm;
      if(this._rmOut?.portal&&this._rmOut.to!==to){this._rmOut=null;if(rm){rm.path=[];rm.goal=-1;}}
      if(this._rmOut||!this._rmNavRoll||!rm||!this._rmCv||rm.enter||rm.exit||rm.sit||rm.portalTravel||this.calm())return fn(to,then);
      const G=this.rmGrid(),onDoor=G.obj[rm.y*G.W+rm.x]===G.door,o=this.roomPortal(directPortal('quarto',to));
      if(!o||onDoor||Math.random()>=portalChance('quarto',to))return fn(to,then);
      const px=rm.moving?rm.to[0]:rm.x,py=rm.moving?rm.to[1]:rm.y,r=px===o.t[0]&&py===o.t[1]?{path:[]}:this.rmPath(px,py,[o.t.slice(0,2)]);
      if(!r)return fn(to,then);
      Object.assign(rm,{path:r.path,goal:this.data().room.indexOf(o),goalDir:'',held:[],turn:0});
      this._rmOut={to,then,run:false,portal:o.id};
      this.sfx('nav');this.setState({rmDlg:false,rmSel:0,rmIntro:false,rmHov:-1,paused:false,palOpen:false,achOpen:false,troOpen:false});
      this.tripSync();this.focusRoot();
      if(!rm.moving&&!r.path.length)this.rmReach(rm);
      return true;
    });
    wrap('rmExitDone',function(fn){if(this._rmOut?.portal&&this._rm)this._rm.goal=-1;return fn();});
    wrap('rmGoTo',function(fn,...args){if(!this._rm?.portalTravel)return fn(...args);});
    wrap('rmKey',function(fn,e){if(this._rm?.portalTravel){e.preventDefault?.();return true;}return fn(e);});
    p.rmAtlasImg=function(){const el=this._rmAtlasEl;return el&&el.complete&&el.naturalWidth?el:this._rmAtlas||null;};
    wrap('drawRoomProps',function(fn,ctx,rm){
      fn(ctx,rm);
      const a=rm.portalTravel,img=this.rmAtlasImg();
      for(const o of this.roomPortals()){const active=a?.id===o.id;drawRoomEnd(ctx,rm,o.id,active?roomOpen(o.id,a.kind,a.t):0,active,img);}
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
        const out=a.kind==='out',end=roomEnds[a.id]||roomEnds['room-home'],len=end.len[out?'out':'in'],from=a.t;
        a.t+=dt;this.roomCue(a,from,a.t);rm.dir=roomPose(a.id,out,Math.min(a.t,len-1)).dir;
        if(a.t>=len){
          if(out){a.kind='wait';this.teleportGo(portals[a.id]?.to||'inicio',a.then);}
          else{rm.portalTravel=null;rm.dir='d';if(end.hide==='plant')this.sfx('poof');this.roomIntro();}
        }
        return;
      }
      // "» Acelerar" also hurries a walk to a passage (the door walk has its own pace)
      if(this._rmOut?.portal&&this._rmOut.run&&rm.moving)rm.t+=dt/150*.8;
      const o=this.data().room[this.st().roomObj],aligned=!rm.moving&&o?.face&&this.roomFacing(o,rm);
      const target=aligned?(o.v?o.v[0]+o.v[2]/2:(o.t[0]+o.t[2]/2)*16)-(rm.x*16+8):0;
      rm.alignX=(rm.alignX||0)+(target-(rm.alignX||0))*Math.min(1,dt/100);
      if(rm.pickup){rm.pickup.t+=dt;if(rm.pickup.t>=420){const spot=rm.pickup.spot;rm.pickup=null;if(this._coinSpot===spot)base.coinTake.call(this);}return;}
      return fn(rm,dt,busy);
    });
    wrap('drawRoomPlayer',function(fn,ctx,img,fr,x,y,rm){
      const trip=rm.portalTravel;
      if(trip){
        if(trip.kind==='wait')return;
        const q=roomPose(trip.id,trip.kind==='out',trip.t),frame={d:0,u:3,l:6,r:9}[q.dir]+(q.walk?[0,1,0,2][Math.floor(trip.t/130)%4]:0);
        if(q.alpha>0){
          ctx.save();
          if(q.clipTop!=null){ctx.beginPath();ctx.rect(0,q.clipTop-rm.camY,4096,4096);ctx.clip();}
          ctx.globalAlpha=q.alpha;ctx.translate(x+8+q.dx,y+24+q.dy-q.lift);ctx.rotate(q.rot);ctx.scale(q.sx,q.sy);ctx.translate(-x-8,-y-24);
          fn(ctx,img,frame,x,y,rm);ctx.restore();
        }
        // under the bed: the bed (and the Mimikyu on it) is drawn again over him
        if(q.under&&img){ctx.drawImage(img,0,32,32,48,-rm.camX,32-rm.camY,32,48);ctx.fillStyle='#385f4a';ctx.fillRect(3-rm.camX,48-rm.camY,26,13);g.PortfolioRoom?.draw(ctx,'mimikyu',7-rm.camX,49-rm.camY,9,10);}
        return;
      }
      const a=rm.pickup||this._deckGrab,k=a?Math.sin(Math.min(1,a.t/(rm.pickup?420:700))*Math.PI):0;
      ctx.save();ctx.translate(x+8,y+24);ctx.scale(1+.08*k,1-.2*k);ctx.translate(-x-8,-y-24);fn(ctx,img,fr,x,y,rm);ctx.restore();
      if(this._deckGrab){ctx.fillStyle='#efcf86';ctx.fillRect(x+11,y+12-4*k,5,7);ctx.fillStyle='#4a6268';ctx.fillRect(x+12,y+13-4*k,3,5);}
      if(rm.pickup){ctx.fillStyle='#ebd16f';ctx.fillRect(x+10,y+13-3*k,3,3);}
    });
    wrap('roomAct',function(fn,code,e){
      if(code.startsWith('portal:')){this.roomPortalStart('room-'+code.slice(7));return;}
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
    wrap('renderVals',function(fn){const r=fn();r.rootCls+=' '+(this.calm()?'motion-reduced':'motion-full');r.toggleMotion=()=>this.toggleMotion();r.motionLabel=this.calm()?'Reduzido':'Completo';r.goProjetos=()=>this.homePassage('projects-button');r.goSobre=()=>this.homePassage('about-button');r.portalHome=()=>this.teleportHome();r.portalContact=()=>this.usePortal('home-contact');r.portalRoom=()=>this.usePortal('home-room');r.portalUse=e=>this.usePortal(e?.currentTarget?.getAttribute?.('data-portal-id'));r.seisCoinTake=()=>this.requestCoin();return r;});
  }};
})(window);
