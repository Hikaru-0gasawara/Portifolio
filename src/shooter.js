/* A small original side-scrolling arcade game for the shooting cabinet. */
(function(g){
  const fresh=()=>({mode:'ready',time:0,x:70,y:228,vy:0,dir:1,aim:0,pointerAim:null,keys:{},shots:[],foes:[],sparks:[],score:0,hp:5,spawn:700,fire:0,hurt:0,tank:0,wave:1,serial:0,healed:0});
  function step(s,dt){
    if(s.mode!=='play')return;
    const seconds=dt/1000;s.time+=dt;s.fire=Math.max(0,s.fire-dt);s.hurt=Math.max(0,s.hurt-dt);s.tank=Math.max(0,s.tank-dt);
    const horizontal=(s.keys.right?1:0)-(s.keys.left?1:0),vertical=(s.keys.down?1:0)-(s.keys.up?1:0);
    s.x=Math.max(12,Math.min(600,s.x+horizontal*190*seconds));if(horizontal)s.dir=horizontal;
    if(s.pointerAim)s.aim=Math.atan2(s.pointerAim.y-(s.y-16),s.pointerAim.x-s.x);
    else s.aim=Math.atan2(vertical,horizontal||(!vertical?s.dir:0));
    if(s.keys.jump&&s.y>=228){s.vy=-350;s.keys.jump=false;}
    s.vy+=850*seconds;s.y=Math.min(228,s.y+s.vy*seconds);if(s.y===228)s.vy=0;
    if(s.keys.fire&&!s.fire){s.shots.push({x:s.x+Math.cos(s.aim)*15,y:s.y-16+Math.sin(s.aim)*15,vx:Math.cos(s.aim)*430,vy:Math.sin(s.aim)*430,enemy:false});s.fire=s.tank?110:180;}
    s.spawn-=dt;
    if(s.spawn<=0){const id=s.serial++,flying=id%3===2;s.foes.push({x:660,y:flying?155:228,baseY:flying?145+Math.random()*35:228,flying,hp:flying?1:2,id,shoot:1200+Math.random()*1600});s.spawn=Math.max(900,2000-s.wave*150);}
    for(const foe of s.foes){foe.x-=(32+s.wave*5)*seconds;if(foe.flying)foe.y=foe.baseY+Math.sin(s.time/460+foe.id)*10;foe.shoot-=dt;if(foe.shoot<0){foe.shoot=2600;const angle=Math.atan2(s.y-16-(foe.y-13),s.x-foe.x);s.shots.push({x:foe.x,y:foe.y-13,vx:Math.cos(angle)*155,vy:Math.sin(angle)*155,enemy:true});}}
    for(const shot of s.shots){
      shot.x+=shot.vx*seconds;shot.y+=shot.vy*seconds;
      if(!shot.enemy){for(const foe of s.foes){if(foe.hp>0&&!shot.dead&&Math.abs(foe.x-shot.x)<16&&Math.abs(foe.y-13-shot.y)<17){shot.dead=true;foe.hp-=s.tank?2:1;if(foe.hp<=0){s.score+=100;s.sparks.push({x:foe.x,y:foe.y-15,t:350});}}}}
      else if(!s.hurt&&Math.abs(shot.x-s.x)<10&&Math.abs(shot.y-(s.y-13))<14){shot.dead=true;s.hp--;s.hurt=1500;}
    }
    for(const foe of s.foes)if(foe.x<0){foe.hp=0;if(!s.hurt){s.hp--;s.hurt=1300;}}
    s.foes=s.foes.filter(f=>f.hp>0);s.shots=s.shots.filter(b=>!b.dead&&b.x>-20&&b.x<680&&b.y>-20&&b.y<250);s.sparks=s.sparks.filter(p=>(p.t-=dt)>0);
    if(Math.floor(s.score/600)>s.healed){s.healed=Math.floor(s.score/600);s.hp=Math.min(5,s.hp+1);}
    s.wave=1+Math.floor(s.score/600);
    if(s.hp<=0)s.mode='over';else if(s.score>=2400)s.mode='win';
  }
  function draw(ctx,s,t){
    ctx.clearRect(0,0,640,300);ctx.fillStyle='#101a17';ctx.fillRect(0,0,640,300);
    const scroll=s.time*.025;
    for(let i=0;i<14;i++){const x=((i*66-scroll*.4)%900+900)%900-80;ctx.fillStyle=i%2?'#1e302a':'#263a30';ctx.fillRect(x,70+i%3*24,48,168);ctx.fillStyle='#627455';for(let j=0;j<3;j++)ctx.fillRect(x+7+j*12,95+i%3*24,4,7);}
    ctx.fillStyle='#526042';ctx.fillRect(0,232,640,8);ctx.fillStyle='#2e3228';ctx.fillRect(0,240,640,60);
    ctx.strokeStyle='#8b8650';for(let i=0;i<12;i++){const x=(i*70-scroll)%840;ctx.beginPath();ctx.moveTo(x,252);ctx.lineTo(x+30,252);ctx.lineTo(x+43,265);ctx.lineTo(x+60,265);ctx.stroke();}
    for(const f of s.foes){ctx.save();ctx.translate(f.x,f.y);ctx.scale(.82,.82);ctx.translate(-f.x,-f.y);if(f.flying){ctx.fillStyle='#808b91';ctx.fillRect(f.x-12,f.y-18,24,9);ctx.fillStyle='#d9b667';ctx.fillRect(f.x-3,f.y-17,6,3);ctx.fillStyle='#4a6269';ctx.fillRect(f.x-20,f.y-22,13,3);ctx.fillRect(f.x+7,f.y-22,13,3);ctx.fillStyle='#a3b7aa';ctx.fillRect(f.x-18,f.y-26,Math.floor(s.time/90)%2?18:10,1);ctx.fillRect(f.x+8,f.y-26,Math.floor(s.time/90)%2?10:18,1);}else{ctx.fillStyle='#a15e4b';ctx.fillRect(f.x-10,f.y-28,20,21);ctx.fillStyle='#d9b667';ctx.fillRect(f.x-8,f.y-24,12,4);ctx.fillStyle='#333d38';ctx.fillRect(f.x-13,f.y-8,27,8);ctx.fillRect(f.x-18,f.y-18,13,4);}ctx.restore();}
    if(!s.hurt||Math.floor(s.hurt/100)%2===0){
      ctx.save();ctx.translate(s.x,s.y);ctx.scale(s.dir*(s.tank?.85:.68),s.tank?.85:.68);ctx.translate(-s.x,-s.y);
      if(s.tank){ctx.fillStyle='#778b4e';ctx.fillRect(s.x-16,s.y-22,42,17);ctx.fillRect(s.x-8,s.y-30,24,12);ctx.fillRect(s.x+9,s.y-28,29,5);ctx.fillStyle='#272f28';ctx.fillRect(s.x-20,s.y-8,49,10);ctx.fillStyle='#b4b17a';for(let i=0;i<5;i++)ctx.fillRect(s.x-15+i*9,s.y-5,5,4);}
      else{ctx.fillStyle='#c8b891';ctx.fillRect(s.x-6,s.y-33,13,12);ctx.fillStyle='#586940';ctx.fillRect(s.x-8,s.y-36,16,5);ctx.fillRect(s.x-7,s.y-21,15,14);const stride=s.keys.left||s.keys.right?Math.sin(s.time/80)*3:0;ctx.fillStyle='#303732';ctx.fillRect(s.x-7,s.y-7,5,8+stride);ctx.fillRect(s.x+3,s.y-7,5,8-stride);}
      ctx.restore();ctx.save();ctx.translate(s.x,s.y-16);ctx.rotate(s.aim);ctx.fillStyle='#d6c3a5';ctx.fillRect(1,-2,8,4);ctx.fillStyle='#708275';ctx.fillRect(8,-3,12,4);ctx.restore();
    }
    for(const b of s.shots){ctx.fillStyle=b.enemy?'#e69466':'#f4dc85';ctx.fillRect(b.x,b.y,8,3);}
    for(const p of s.sparks){ctx.fillStyle='#e2bd60';for(let j=0;j<6;j++)ctx.fillRect(p.x+Math.cos(j)*((350-p.t)/15),p.y+Math.sin(j)*((350-p.t)/15),3,3);}
    ctx.fillStyle='#e9e7ce';ctx.font='12px "JetBrains Mono","DotGothic16",monospace';ctx.fillText(t('Pontos')+': '+s.score,16,22);ctx.fillText(t('Onda')+': '+s.wave,265,22);
    for(let i=0;i<5;i++){ctx.fillStyle=i<s.hp?'#e9c77b':'#435047';const x=532+i*18;ctx.fillRect(x,13,5,5);ctx.fillRect(x+7,13,5,5);ctx.fillRect(x+1,16,10,5);ctx.fillRect(x+3,21,6,2);ctx.fillRect(x+5,23,2,2);}
    if(s.mode!=='play'){ctx.fillStyle='#07100ce8';ctx.fillRect(100,85,440,112);ctx.textAlign='center';ctx.fillStyle='#efd586';ctx.font='20px "JetBrains Mono","DotGothic16",monospace';ctx.fillText(t({ready:'OPERAÇÃO CIRCUITO',pause:'PAUSADO',over:'FIM DE JOGO',win:'MISSÃO CUMPRIDA'}[s.mode]),320,124);ctx.font='12px "JetBrains Mono","DotGothic16",monospace';ctx.fillStyle='#d8e3cd';ctx.fillText(t(s.mode==='pause'?'Pressione P para continuar':'Enter: jogar ou reiniciar'),320,156);ctx.textAlign='left';}
  }
  g.PortfolioShooter={fresh,step,draw,install(C){
    const p=C.prototype,render=p.renderVals,act=p.roomAct,rootKey=p.rootKey,rootUp=p.rootKeyUp,mount=p.componentDidMount,unmount=p.componentWillUnmount;
    p.shooterOpen=function(){this._shooter=fresh();this._shooterTankUsed=false;this._wKeys={};if(this._rm){this._rm.held=[];this._rm.path=[];}this.setState({shooterOpen:true,rmDlg:false,paused:false});this.startLoop();};
    p.shooterClose=function(){this._shooter=null;this.setState({shooterOpen:false});this.focusRoot();};
    p.shooterStart=function(){if(this._shooter?.mode==='pause'){this._shooter.mode='play';return;}this._shooter=fresh();this._shooter.mode='play';this._shooterTankUsed=false;this.unlock('circuit-start');};
    p.shooterInput=function(key,on){const s=this._shooter;if(!s)return;if(key==='tank'&&on&&s.mode==='play'&&!this._shooterTankUsed){s.tank=8000;this._shooterTankUsed=true;this.sfx('special');this.unlock('tank-call');}else s.keys[key]=on;};
    p.shooterKey=function(e,on){
      const k=e.key.toLowerCase();const key={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',arrowdown:'down',w:'jump',k:'jump',' ':'fire',j:'fire',t:'tank'}[k];
      if(key&&this._shooter&&['left','right','up','down'].includes(key))this._shooter.pointerAim=null;
      if(key){e.preventDefault();this.shooterInput(key,on);}if(on&&!e.repeat){if(k==='escape'){e.preventDefault();this.shooterClose();}if(k==='enter'){e.preventDefault();this.shooterStart();}if(k==='p'&&this._shooter)this._shooter.mode=this._shooter.mode==='pause'?'play':this._shooter.mode==='play'?'pause':this._shooter.mode;}
    };
    p.rootKey=function(e){if(this.st().shooterOpen){this.shooterKey(e,true);return;}rootKey.call(this,e);};
    p.rootKeyUp=function(e){if(this.st().shooterOpen){this.shooterKey(e,false);return;}rootUp.call(this,e);};
    p.roomAct=function(code,e){if(code==='shooter'){this.shooterOpen();return;}return act.call(this,code,e);};
    p.componentDidMount=function(){mount.call(this);this._shooterBlur=()=>{if(this._shooter){this._shooter.keys={};if(this._shooter.mode==='play')this._shooter.mode='pause';}};window.addEventListener('blur',this._shooterBlur);};
    p.componentWillUnmount=function(){window.removeEventListener('blur',this._shooterBlur);unmount.call(this);};
    p.loopShooter=function(dt){const s=this._shooter;if(!this.st().shooterOpen||!s||!this._shooterCv)return;const hp=s.hp,score=s.score;step(s,Math.min(40,dt));if(s.hp<hp)this.sfx('bump');if(s.score>score)this.sfx('key');if(s.mode==='win')this.unlock('circuit-win');draw(this._shooterCv.getContext('2d'),s,g.PortfolioI18n.t);};
    p.renderVals=function(){const r=render.call(this);return {...r,shooterOpen:!!this.st().shooterOpen,setShooter:el=>{this._shooterCv=el;if(el){el.width=640;el.height=300;}},shooterAim:e=>{if(e.pointerType==='touch'||!this._shooter)return;const box=e.currentTarget.getBoundingClientRect();this._shooter.pointerAim={x:(e.clientX-box.left)/box.width*640,y:(e.clientY-box.top)/box.height*300};},shooterClose:()=>this.shooterClose(),shooterStart:()=>this.shooterStart(),shooterControls:[['left','←'],['right','→'],['up','Mirar ↑'],['down','Mirar ↓'],['jump','Pular'],['fire','Atirar'],['tank','Tanque']].map(([key,label])=>({label,down:e=>{e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId);if(this._shooter)this._shooter.pointerAim=null;this.shooterInput(key,true);},up:()=>this.shooterInput(key,false)}))};};
  }};
})(window);
