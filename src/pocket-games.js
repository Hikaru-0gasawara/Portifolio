/* Small original games for the classic controllers; pure updates are independently testable. */
(function(g){
  const pieces=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]];
  const rotate=m=>m[0].map((_,i)=>m.map(row=>row[i]).reverse());
  const blockNew=()=>({kind:'blocks',mode:'title',board:Array.from({length:16},()=>Array(10).fill(0)),piece:null,x:3,y:0,score:0,lines:0,acc:0});
  const fits=(s,p=s.piece,x=s.x,y=s.y)=>p.every((row,dy)=>row.every((v,dx)=>!v||(x+dx>=0&&x+dx<10&&y+dy<16&&(y+dy<0||!s.board[y+dy][x+dx]))));
  function spawn(s){s.piece=pieces[Math.floor(Math.random()*pieces.length)].map(row=>row.slice());s.x=3;s.y=0;if(!fits(s))s.mode='over';}
  function drop(s){if(fits(s,s.piece,s.x,s.y+1)){s.y++;return;}
    s.piece.forEach((row,dy)=>row.forEach((v,dx)=>{if(v&&s.y+dy>=0)s.board[s.y+dy][s.x+dx]=v;}));
    const left=s.board.filter(row=>row.some(v=>!v)),n=16-left.length;s.lines+=n;s.score+=[0,100,300,500,800][n];
    s.board=Array.from({length:n},()=>Array(10).fill(0)).concat(left);spawn(s);
  }
  function blockInput(s,k){
    if(k==='S'){if(['title','over'].includes(s.mode)){Object.assign(s,blockNew(),{mode:'play'});spawn(s);}else s.mode=s.mode==='play'?'pause':'play';return;}
    if(s.mode!=='play')return;
    if(k==='L'||k==='R'){const x=s.x+(k==='L'?-1:1);if(fits(s,s.piece,x,s.y))s.x=x;}
    if(k==='A'){const p=rotate(s.piece);for(const dx of [0,-1,1,-2,2])if(fits(s,p,s.x+dx,s.y)){s.piece=p;s.x+=dx;break;}}
    if(k==='D')drop(s);
    if(k==='B'||k==='U'){while(fits(s,s.piece,s.x,s.y+1))s.y++;drop(s);}
  }
  function blockStep(s,dt){if(s.mode!=='play')return;s.acc+=dt;const interval=Math.max(230,1000-s.lines*25);if(s.acc>=interval){s.acc%=interval;drop(s);}}
  const raceNew=()=>({kind:'race',mode:'title',time:0,lane:1,obstacles:[],score:0,spawn:1600,lives:3,guard:0,speed:1});
  function raceInput(s,k){if(k==='S'){if(['title','over'].includes(s.mode))Object.assign(s,raceNew(),{mode:'play'});else s.mode=s.mode==='pause'?'play':'pause';return;}if(s.mode!=='play')return;if(k==='L'||k==='X')s.lane=Math.max(0,s.lane-1);if(k==='R'||k==='Y')s.lane=Math.min(2,s.lane+1);if(k==='A'||k==='U')s.speed=1.35;if(k==='B'||k==='D')s.speed=.7;}
  function raceStep(s,dt){if(s.mode!=='play')return;s.time+=dt;s.guard=Math.max(0,s.guard-dt);s.spawn-=dt;s.score+=dt*.01*s.speed;
    if(s.spawn<=0){s.spawn=1900;s.obstacles.push({lane:Math.floor(Math.random()*3),y:-20});}
    for(const o of s.obstacles){o.y+=dt*.06*s.speed;if(!o.hit&&o.lane===s.lane&&o.y>132&&o.y<167&&!s.guard){s.lives--;s.guard=1500;o.hit=true;}}
    s.obstacles=s.obstacles.filter(o=>o.y<200);if(!s.lives)s.mode='over';
  }
  const notes=['U','R','D','L'],tone={U:'sim0',R:'sim1',D:'sim2',L:'sim3'};
  const melodyNew=()=>({kind:'melody',mode:'title',seq:[],pos:0,phase:'show',time:0,index:-1,score:0,lit:''});
  function melodyNext(s){s.seq.push(notes[Math.floor(Math.random()*4)]);s.pos=0;s.phase='show';s.time=0;s.index=-1;}
  function melodyInput(s,k,sound=()=>{}){if(k==='A'||k==='S'){if(['title','over'].includes(s.mode)){Object.assign(s,melodyNew(),{mode:'play'});melodyNext(s);}else s.mode=s.mode==='play'?'pause':'play';return;}if(k==='B'&&s.mode==='play'){s.phase='show';s.time=0;s.index=-1;s.pos=0;return;}if(s.mode!=='play'||s.phase!=='input'||!notes.includes(k))return;sound(tone[k]);s.lit=k;if(k!==s.seq[s.pos]){s.mode='over';return;}s.pos++;if(s.pos===s.seq.length){s.score++;melodyNext(s);}}
  function melodyStep(s,dt,sound=()=>{}){if(s.mode!=='play'||s.phase!=='show')return;s.time+=dt;const i=Math.floor(s.time/800);if(i>=s.seq.length){s.phase='input';s.lit='';return;}if(i!==s.index){s.index=i;sound(tone[s.seq[i]]);}s.lit=s.time%800<500?s.seq[i]:'';}
  function draw(cv,s,t){if(!cv)return;const c=cv.getContext('2d');if(!c)return;cv.width=320;cv.height=192;c.fillStyle='#0c1911';c.fillRect(0,0,320,192);c.font='11px "JetBrains Mono","DotGothic16",monospace';c.textBaseline='top';
    if(s.kind==='blocks'){
      c.strokeStyle='#546a45';c.strokeRect(14,12,101,161);
      const cell=(x,y)=>{c.fillStyle='#9cb869';c.fillRect(15+x*10,13+y*10,9,9);c.fillStyle='#c2d590';c.fillRect(16+x*10,14+y*10,6,2);};
      s.board.forEach((row,y)=>row.forEach((v,x)=>{if(v)cell(x,y);}));if(s.piece)s.piece.forEach((row,y)=>row.forEach((v,x)=>{if(v)cell(s.x+x,s.y+y);}));
      c.fillStyle='#d9ddb0';[t('BLOCOS'),t('Pontos')+': '+s.score,t('Linhas')+': '+s.lines,'A: '+t('Girar'),'B / ↑: '+t('Soltar'),'↓: '+t('Descer')].forEach((line,i)=>c.fillText(line,134,18+i*23));
    }else if(s.kind==='race'){
      c.fillStyle='#35423d';c.fillRect(85,0,150,192);c.fillStyle='#bbbd86';for(let lane=1;lane<3;lane++)for(let y=-20;y<192;y+=36)c.fillRect(85+lane*50,y+s.time*.05%36,2,18);
      c.fillStyle='#d17d67';for(const o of s.obstacles)if(!o.hit)c.fillRect(99+o.lane*50,o.y,22,30);
      if(!s.guard||Math.floor(s.guard/100)%2){c.fillStyle='#85b79a';c.fillRect(99+s.lane*50,145,22,32);c.fillStyle='#19272b';c.fillRect(103+s.lane*50,149,14,8);}
      c.fillStyle='#d9ddb0';c.fillText(String(Math.floor(s.score)),10,12);c.fillText(t('Vidas')+': '+s.lives,10,30);
    }else{
      c.fillStyle='#d9ddb0';c.fillText(t('MELODIA 64')+' · '+s.score,14,12);c.fillText(t(s.phase==='show'?'Escute a sequência':'Sua vez'),14,34);
      notes.forEach((n,i)=>{c.fillStyle=s.lit===n?'#f1d77c':'#526a65';c.beginPath();c.arc(64+i*64,102,22,0,Math.PI*2);c.fill();c.fillStyle='#102117';c.fillText({U:'↑',R:'→',D:'↓',L:'←'}[n],60+i*64,96);});
    }
    if(s.mode!=='play'){c.fillStyle='#05100be8';c.fillRect(25,60,270,78);c.fillStyle='#e9d38a';c.textAlign='center';c.fillText(t({title:'START para jogar',pause:'Pausado · START continua',over:'Fim de jogo · START reinicia'}[s.mode]),160,91);c.textAlign='left';}
  }
  g.PortfolioPocket={blockNew,blockInput,blockStep,fits,rotate,raceNew,raceInput,raceStep,melodyNew,melodyInput,melodyStep,draw,install(C){
    const p=C.prototype,base={};const wrap=(n,fn)=>{base[n]=p[n];p[n]=function(...a){return fn.call(this,base[n].bind(this),...a);};};
    const current=c=>c.st().ctl||'hitbox';
    p.pocketInput=function(k){const type=current(this);if(type==='gb'&&this._gbSnake){if(k==='S')this.padStart();else this.snakeInput(k);return;}const s=this._pocket||(this._pocket=type==='gb'?blockNew():type==='n64'?melodyNew():raceNew());if(type==='gb')blockInput(s,k);else if(type==='n64')melodyInput(s,k,snd=>this.sfx(snd));else raceInput(s,k);if(s.mode==='play'){this._moves={...this._moves,['game:'+type]:true};this.persistSoon();}this.setState({pocketMode:s.mode});};
    wrap('ctlSet',function(fn,k){fn(k);this._gbSnake=false;this._pocket=k==='gb'?blockNew():k==='n64'?melodyNew():k==='pad'?raceNew():null;});
    wrap('miniIn',function(fn,k){const type=current(this);if(['gb','n64','pad'].includes(type))return this.pocketInput(k);fn(k);if(this._mini?.mode==='play'){this._moves={...this._moves,['game:'+type]:true};}});
    wrap('pad',function(fn,k){if(current(this)==='gb')return this.pocketInput(k);return fn(k);});
    wrap('loopSnake',function(fn,dt){if(this._gbSnake)return fn(dt);});
    wrap('loopMini',function(fn,dt){if(['atari','sms'].includes(current(this))){const st=this.st(),frozen=this._wPoke?.cur||st.paused||st.palOpen||st.languageOpen||st.achOpen;fn(frozen?0:dt);if(['gb','atari','sms','n64','pad'].every(k=>this._moves?.['game:'+k]))this.unlock('cartridge-tour');}});
    p.loopPocket=function(dt){
      if(this.curPage()!=='sobre'||!['gb','n64','pad'].includes(current(this))||this._gbSnake)return;
      const s=this._pocket||(this._pocket=current(this)==='gb'?blockNew():current(this)==='n64'?melodyNew():raceNew());
      const st=this.st();if(!st.paused&&!st.palOpen&&!st.languageOpen&&!st.achOpen&&!st.recOpen&&!st.credOpen&&!document.hidden&&!this._wPoke?.cur&&!this._wPoke?.q?.length){if(s.kind==='blocks')blockStep(s,Math.min(dt,60));else if(s.kind==='race')raceStep(s,Math.min(dt,60));else melodyStep(s,dt,tone=>this.sfx(tone));}
      this.miniSetHi(current(this),Math.floor(s.score));
      draw(this._lcdCv,s,g.PortfolioI18n.t);
      if(['gb','atari','sms','n64','pad'].every(k=>this._moves?.['game:'+k]))this.unlock('cartridge-tour');
    };
    wrap('renderVals',function(fn){const r=fn(),type=current(this);if(['gb','n64','pad'].includes(type)){
      r.lcdIdle=false;r.lcdMenuOn=false;r.lcdCardOn=false;r.lcdList=false;r.miniIdle=false;r.lcdCls='is-game';
      const names={gb:'Blocos de bolso · cartucho principal',n64:'Melodia 64 · memória musical',pad:'Estrada · corrida de três pistas'};r.ctlSub=this._gbSnake?'Cobrinha · cartucho extra':names[type];
      r.lcdHint=this._gbSnake?'START joga ou pausa · SELECT troca cartucho':{gb:'← → move · A gira · B solta · START pausa',n64:'Escute e repita com C · A começa ou pausa · B repete',pad:'←/X · →/Y · A acelera · B freia · START pausa'}[type];
      for(const [key,token] of [['U','U'],['D','D'],['L','L'],['R','R'],['A','A'],['B','B']])r['pad'+key]=()=>this.pocketInput(token);
      r.padStart=()=>this.pocketInput('S');r.startLabel='jogar / pausa';r.selLabel='cartucho';r.padSelect=()=>{this._gbSnake=!this._gbSnake;this._pad=[];this.setState({lcdMenu:false,lcdList:false});if(this._gbSnake)this.snakeStart();else if(this._snake)this._snake.mode='off';};
    }return r;});
  }};
})(window);
