/* Original, self-contained brick breaker for the bedroom TV. No separate animation loop. */
(function(g){
  const width=480,height=320,radius=5,paddleWidth=108,paddleY=289,rounds=3,recordKey='tv-breakout';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function bricks(){return Array.from({length:24},(_,i)=>({x:32+i%8*53,y:44+Math.floor(i/8)*24,w:45,h:16,row:Math.floor(i/8),alive:true}));}
  function serve(s){s.mode='serve';s.keys={};s.trail=[];s.ball={x:s.paddle,y:paddleY-radius-1,vx:0,vy:0};}
  function fresh(){const s={mode:'serve',level:1,lives:3,score:0,paddle:width/2,target:null,keys:{},bricks:bricks(),trail:[],ball:null};serve(s);return s;}
  function launch(s){if(s.mode!=='serve')return;const speed=210+(s.level-1)*25;s.mode='play';s.ball.vx=75*(s.level%2?1:-1);s.ball.vy=-Math.sqrt(speed*speed-s.ball.vx*s.ball.vx);}
  function pause(s){if(s.mode==='pause'){s.mode=s.resume||'serve';s.resume=null;}else if(s.mode==='play'||s.mode==='serve'){s.resume=s.mode;s.mode='pause';}s.keys={};}
  function step(s,elapsed){
    const events=[];
    if(!['play','serve'].includes(s.mode)||!Number.isFinite(elapsed)||elapsed<=0)return events;
    let remaining=Math.min(50,elapsed);
    while(remaining>0){
      const dt=Math.min(5,remaining)/1000;remaining-=dt*1000;
      const dir=(s.keys.right?1:0)-(s.keys.left?1:0);
      if(dir)s.paddle+=dir*350*dt;
      else if(s.target!==null)s.paddle+=clamp(s.target-s.paddle,-650*dt,650*dt);
      s.paddle=clamp(s.paddle,paddleWidth/2+8,width-paddleWidth/2-8);
      const b=s.ball;
      if(s.mode==='serve'){b.x=s.paddle;b.y=paddleY-radius-1;continue;}
      const previousY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.x<radius+8){b.x=radius+8;b.vx=Math.abs(b.vx);events.push('wall');}
      if(b.x>width-radius-8){b.x=width-radius-8;b.vx=-Math.abs(b.vx);events.push('wall');}
      if(b.y<radius+12){b.y=radius+12;b.vy=Math.abs(b.vy);events.push('wall');}
      if(b.vy>0&&previousY+radius<=paddleY&&b.y+radius>=paddleY&&Math.abs(b.x-s.paddle)<paddleWidth/2+radius){
        const hit=clamp((b.x-s.paddle)/(paddleWidth/2),-1,1),speed=Math.min(295,Math.hypot(b.vx,b.vy)+3);
        b.y=paddleY-radius;b.vx=Math.sin(hit*Math.PI/3)*speed;b.vy=-Math.cos(hit*Math.PI/3)*speed;events.push('paddle');
      }
      for(const brick of s.bricks){
        if(!brick.alive)continue;
        const dx=b.x-clamp(b.x,brick.x,brick.x+brick.w),dy=b.y-clamp(b.y,brick.y,brick.y+brick.h);
        if(dx*dx+dy*dy>radius*radius)continue;
        brick.alive=false;s.score+=(3-brick.row)*10;
        if(previousY<=brick.y||previousY>=brick.y+brick.h)b.vy=-b.vy;else b.vx=-b.vx;
        events.push('brick');break;
      }
      if(s.bricks.every(brick=>!brick.alive)){
        s.score+=100;s.trail=[];
        if(s.level===rounds){s.mode='win';s.keys={};events.push('win');}
        else{s.level++;s.bricks=bricks();s.lives=Math.min(3,s.lives+1);serve(s);events.push('round');}
        break;
      }
      if(b.y-radius>height){
        s.lives--;s.trail=[];events.push('miss');
        if(s.lives<=0){s.mode='over';s.keys={};}else serve(s);
        break;
      }
    }
    if(s.mode==='play'){s.trail.push({x:s.ball.x,y:s.ball.y});if(s.trail.length>6)s.trail.shift();}
    return events;
  }
  function draw(ctx,s,calm=false){
    if(!ctx)return;
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#091610';ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='#152b20';ctx.lineWidth=1;
    for(let x=0;x<width;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
    for(let y=0;y<height;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
    ctx.fillStyle='#294735';ctx.fillRect(6,8,468,3);ctx.fillRect(6,8,3,290);ctx.fillRect(471,8,3,290);
    const colors=[['#d4b756','#f6dea0'],['#789c78','#c6d7a0'],['#426a5a','#7eaf91']];
    for(const brick of s.bricks){if(!brick.alive)continue;const [base,light]=colors[brick.row];ctx.fillStyle='#020a06';ctx.fillRect(brick.x+2,brick.y+3,brick.w,brick.h);ctx.fillStyle=base;ctx.fillRect(brick.x,brick.y,brick.w,brick.h);ctx.fillStyle=light;ctx.fillRect(brick.x+2,brick.y+2,brick.w-4,2);ctx.fillStyle='#152c22';ctx.fillRect(brick.x+brick.w-5,brick.y+brick.h-5,3,3);}
    if(!calm)for(let i=0;i<s.trail.length;i++){ctx.globalAlpha=(i+1)/s.trail.length*.25;ctx.fillStyle='#efdaa0';ctx.fillRect(s.trail[i].x-3,s.trail[i].y-3,6,6);}ctx.globalAlpha=1;
    ctx.fillStyle='#d7bd69';ctx.fillRect(Math.round(s.paddle-paddleWidth/2),paddleY,paddleWidth,8);ctx.fillStyle='#f5e6b2';ctx.fillRect(Math.round(s.paddle-paddleWidth/2)+3,paddleY,paddleWidth-6,2);
    ctx.fillStyle='#87b68d';ctx.fillRect(Math.round(s.paddle)-7,paddleY+3,14,3);
    if(!['over','win'].includes(s.mode)){ctx.fillStyle='#f4e5b4';ctx.fillRect(Math.round(s.ball.x)-4,Math.round(s.ball.y)-4,8,8);ctx.fillStyle='#fff7d9';ctx.fillRect(Math.round(s.ball.x)-3,Math.round(s.ball.y)-3,3,3);}
    ctx.fillStyle='#856943';for(let x=14;x<width-14;x+=12)ctx.fillRect(x,height-8,5,1);
  }
  const statuses={serve:'Prepare a raquete. A próxima bola é sua.',play:'Rebata a bola e limpe os blocos.',pause:'Partida pausada. Continue quando quiser.',over:'Fim de jogo. Que tal mais uma partida?',win:'Três fases completas. A TV é toda sua!'};
  g.PortfolioTvGame={width,height,radius,paddleWidth,paddleY,rounds,recordKey,fresh,launch,pause,step,draw,statuses,install(C){
    const p=C.prototype,base={};
    const wrap=(name,fn)=>{base[name]=p[name];p[name]=function(...args){return fn.call(this,base[name].bind(this),...args);};};
    p.tvGameSync=function(){
      const s=this._tvGame;if(!s)return;
      this.miniSetHi(recordKey,s.score);
      const signature=[s.mode,s.score,s.lives,s.level].join(':');
      if(signature!==this._tvGameSignature){this._tvGameSignature=signature;this.setState({tvGameTick:signature});}
    };
    p.openTvGame=function(){
      if(this.curPage()!=='quarto'||this._rm?.sit?.kind!=='puff'||this._rm.sit.out||this.st().tvGameOpen)return;
      this._tvGame=fresh();this._tvGameSignature='';this._tvGameFocused=false;this._wKeys={};this._rm.held=[];this._rm.path=[];
      this.setState({tvGameOpen:true,rmDlg:false,paused:false,palOpen:false});this.sfx('jTv');this.tvGameSync();this.startLoop();
    };
    p.closeTvGame=function(returnToPuff=true){
      this._tvGame=null;this._tvGameCv=null;this._tvGameFocused=false;
      if(!this.st().tvGameOpen)return;
      const seated=returnToPuff&&this.curPage()==='quarto'&&this._rm?.sit?.kind==='puff';
      this.setState({tvGameOpen:false,rmDlg:!!seated,rmSel:0,rmIntro:false});this.persist(false);this.focusRoot();
    };
    p.tvGamePrimary=function(){
      if(!this.st().tvGameOpen||!this._tvGame)return;
      if(['win','over'].includes(this._tvGame.mode))this._tvGame=fresh();
      if(this._tvGame.mode==='pause')pause(this._tvGame);
      else if(this._tvGame.mode==='serve'){launch(this._tvGame);this.sfx('blip');}
      this.tvGameSync();
    };
    p.tvGamePause=function(){if(this._tvGame){pause(this._tvGame);this.tvGameSync();}};
    p.tvGameRestart=function(){if(this.st().tvGameOpen){this._tvGame=fresh();this.tvGameSync();this.sfx('select');}};
    p.tvGameSuspend=function(){if(this._tvGame){this._tvGame.keys={};this._tvGame.target=null;if(['play','serve'].includes(this._tvGame.mode))pause(this._tvGame);this.tvGameSync();}};
    p.tvGameKey=function(e,down){
      if(e.ctrlKey||e.metaKey||e.altKey)return;
      const key=(e.key||'').toLowerCase(),s=this._tvGame;if(!s)return;
      const direction={arrowleft:'left',a:'left',arrowright:'right',d:'right'}[key];
      if(direction){e.preventDefault();s.keys[direction]=down;s.target=null;return;}
      if(!down||e.repeat)return;
      if([' ','enter'].includes(key)&&e.target?.closest?.('button,a,input'))return;
      if([' ','enter','p','r','escape'].includes(key))e.preventDefault();
      if(key===' '||key==='enter')this.tvGamePrimary();else if(key==='p')this.tvGamePause();else if(key==='r')this.tvGameRestart();else if(key==='escape')this.closeTvGame();
    };
    p.tvGamePointer=function(e,down=false){
      const s=this._tvGame;if(!s)return;
      if(e.pointerType==='touch'&&!down&&e.buttons===0)return;
      const rect=e.currentTarget.getBoundingClientRect();if(rect.width<=0)return;
      s.target=clamp((e.clientX-rect.left)/rect.width*width,paddleWidth/2+8,width-paddleWidth/2-8);s.keys={};
      if(down){e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId);e.currentTarget.focus?.({preventScroll:true});if(s.mode==='serve'){s.paddle=s.target;s.ball.x=s.paddle;}this.tvGamePrimary();}
    };
    p.loopTvGame=function(dt){
      const s=this._tvGame;if(!this.st().tvGameOpen||!s||!this._tvGameCv)return;
      const state=this.st();
      if(document.hidden||state.paused||state.languageOpen||state.palOpen||state.achOpen){this.tvGameSuspend();}
      else{const events=step(s,dt);if(events.includes('win')||events.includes('round'))this.sfx('coin');else if(events.includes('miss'))this.sfx('bump');else if(events.includes('brick'))this.sfx('key');else if(events.includes('paddle'))this.sfx('blip');}
      this.tvGameSync();draw(this._tvGameCv.getContext('2d'),s,this.calm());
    };
    wrap('roomAct',function(fn,code,e){if(code==='tvgame'){this.openTvGame();return;}return fn(code,e);});
    wrap('rmActs',function(fn){return this._rm?.sit?.kind==='puff'?[['Jogar na TV','tvgame'],['Levantar do puff','stand']]:fn();});
    wrap('rootKey',function(fn,e){if(this.st().tvGameOpen&&!this.st().languageOpen){this.tvGameKey(e,true);return;}return fn(e);});
    wrap('rootKeyUp',function(fn,e){if(this.st().tvGameOpen){this.tvGameKey(e,false);return;}return fn(e);});
    wrap('go',function(fn,to,...args){if(this.st().tvGameOpen&&to!==this.curPage())this.closeTvGame(false);return fn(to,...args);});
    wrap('reboot',function(fn,...args){if(this.st().tvGameOpen)this.closeTvGame(false);return fn(...args);});
    wrap('wipeProgress',function(fn,...args){this._tvGame=null;this._tvGameCv=null;this.setState({tvGameOpen:false});return fn(...args);});
    wrap('componentDidMount',function(fn){fn();this._tvGameBlur=()=>this.tvGameSuspend();this._tvGameVisibility=()=>{if(document.hidden)this.tvGameSuspend();};g.addEventListener?.('blur',this._tvGameBlur);document.addEventListener?.('visibilitychange',this._tvGameVisibility);});
    wrap('componentDidUpdate',function(fn,...args){fn(...args);if(this.st().tvGameOpen&&!this._tvGameFocused&&this._tvGameCv){this._tvGameFocused=true;this._tvGameCv.focus?.({preventScroll:true});}});
    wrap('componentWillUnmount',function(fn){g.removeEventListener?.('blur',this._tvGameBlur);document.removeEventListener?.('visibilitychange',this._tvGameVisibility);this._tvGame=null;this._tvGameCv=null;return fn();});
    wrap('renderVals',function(fn){
      const r=fn(),s=this._tvGame,mode=s?.mode||'serve';
      return {...r,tvGameOpen:!!this.st().tvGameOpen,tvGameTitle:'Rebote CRT',tvGameScore:s?.score||0,tvGameLives:s?.lives??3,tvGameRound:(s?.level||1)+' / '+rounds,tvGameBest:this.miniHi(recordKey),tvGameStatus:statuses[mode],tvGameOverlay:mode!=='play',tvGameOverlayTitle:{serve:'Uma partida no puff',pause:'PAUSADO',over:'FIM DE JOGO',win:'Tela limpa!'}[mode]||'',tvGamePrimaryLabel:{serve:'Lançar bola',play:'Bola em jogo',pause:'Continuar',over:'Jogar de novo',win:'Jogar de novo'}[mode],tvGamePlaying:mode==='play',tvGameFinished:mode==='win'||mode==='over',tvGamePauseLabel:mode==='pause'?'Continuar':'Pausar',tvGamePrimary:()=>this.tvGamePrimary(),tvGamePause:()=>this.tvGamePause(),tvGameRestart:()=>this.tvGameRestart(),tvGameClose:()=>this.closeTvGame(),tvGameMove:e=>this.tvGamePointer(e),tvGameDown:e=>this.tvGamePointer(e,true),setTvGameCanvas:el=>{this._tvGameCv=el;if(el&&this._tvGame)draw(el.getContext('2d'),this._tvGame,this.calm());}};
    });
  }};
})(window);
