/* Click-friendly tributes: commands are simplified, not frame-accurate game training. */
(function(g){
  const fighters=[['ryu','Ryu · Street Fighter'],['ken','Ken · Street Fighter'],['chun','Chun-Li · Street Fighter'],['guile','Guile · Street Fighter'],['cammy','Cammy · Street Fighter'],['scorpion','Scorpion · Mortal Kombat'],['subzero','Sub-Zero · Mortal Kombat'],['raiden','Raiden · Mortal Kombat'],['liu','Liu Kang · Mortal Kombat'],['filia','Filia · Skullgirls'],['robo','Robo-Fortune · Skullgirls'],['peacock','Peacock · Skullgirls'],['bella','Cerebella · Skullgirls'],['venom','Venom · Guilty Gear'],['dizzy','Dizzy · Guilty Gear'],['toph','Toph · Avatar'],['okaru','Okaru · Tecnologia']];
  const moves=[
    ['ryu','Hadouken','DRP','fireball'],['ryu','Shoryuken','RDRH','uppercut'],
    ['ken','Tatsumaki Senpukyaku','DLK','spin'],['ken','Shinryuken','DRDRH','uppercut'],
    ['chun','Kikoken','LRP','fireball'],['chun','Spinning Bird Kick','DUK','spin'],['chun','Hyakuretsukyaku','KKK','kick'],
    ['guile','Sonic Boom','LRP','beam'],['guile','Flash Kick','DUJ','uppercut'],['cammy','Spiral Arrow','DRK','slide'],
    ['scorpion','Spear','LLP','spear'],['scorpion','Teleport Punch','DLH','teleport'],
    ['subzero','Ice Ball','DRP','ice'],['subzero','Slide','LRK','slide'],['raiden','Flying Thunder God','LRR','lightning'],['liu','Bicycle Kick','KKJ','kick'],
    ['filia','Updo','RDRP','uppercut'],['filia','Hairball','DLK','hair'],['robo','Theonite Beam','DRH','beam'],['peacock','Bang!','DRP','fireball'],['bella','Diamond Drop','RDLH','kick'],
    ['venom','Stinger Aim','LRM','billiard'],['venom','Carcass Raid','DUM','billiard'],
    ['dizzy','I used this to catch fish','DRP','fish'],['dizzy','Ice Field','DDK','ice'],
    ['toph','Muralha de terra','DLP','wall'],['toph','Pisada da dobradora','DDH','earth'],['toph','Pedra em movimento','DRK','earth']
  ].map(([fighter,name,seq,kind])=>({fighter,name,seq,kind}));
  const glyph={U:'↑',D:'↓',L:'←',R:'→',P:'LP',M:'MP',H:'HP',K:'LK',N:'MK',J:'HK',A:'A1',B:'A2'};
  const inputText=seq=>[...seq].map(k=>glyph[k]||k).join(' ');
  function pose(kind,k){const pulse=Math.sin(Math.PI*k),p={lift:0,rot:0,sx:1,sy:1,dir:'r'};
    if(kind==='uppercut'){p.lift=30*pulse;p.rot=-.35*pulse;}
    else if(['spin','hair'].includes(kind)){p.lift=8*pulse;p.rot=kind==='spin'?Math.PI*pulse:Math.PI*2*k;p.dir=['r','u','l','d'][Math.floor(k*16)%4];}
    else if(kind==='slide'){p.sy=1-.45*pulse;p.sx=1+.45*pulse;p.lift=-2*pulse;}
    else if(kind==='teleport'){p.sx=.3+.7*Math.abs(Math.cos(k*Math.PI*3));p.lift=7*pulse;}
    else if(['earth','wall'].includes(kind)){p.lift=5*Math.max(0,Math.sin(k*Math.PI*2));p.sy=1-.22*pulse;}
    else if(kind==='kick'){p.rot=-.45*pulse;p.sx=1+.2*pulse;p.lift=5*pulse;}
    else {p.sy=1-.14*pulse;p.sx=1+.12*pulse;}
    return p;
  }
  function effect(ctx,move,k,x,y,u){
    if(k<.18||k>.92)return;const p=(k-.18)/.74,color={ice:'#a3d9ea',fish:'#a3d9ea',lightning:'#d6c86c',earth:'#a69566',wall:'#a69566',billiard:'#d39ac8',spear:'#dc9472',beam:'#90e4c1'}[move.kind]||'#e3ba63';
    ctx.save();ctx.translate(x,y);ctx.scale(u,u);ctx.globalAlpha=Math.min(1,(1-p)*4);ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=1;
    if(['earth','wall'].includes(move.kind)){for(let i=0;i<5;i++){const h=(move.kind==='wall'?18:8)*(1-Math.abs(p-.5)*2);ctx.fillRect(12+i*9,-h,7,h);ctx.fillStyle=i%2?color:'#756443';}ctx.beginPath();ctx.ellipse(8,0,12+p*45,3+p*9,0,0,Math.PI*2);ctx.stroke();}
    else if(move.kind==='spear'){ctx.beginPath();ctx.moveTo(6,-12);ctx.lineTo(12+p*68,-12);ctx.stroke();ctx.fillRect(10+p*68,-14,5,4);}
    else if(['spin','hair','kick','uppercut'].includes(move.kind)){for(let i=0;i<8;i++){const angle=p*8+i*.8;ctx.fillRect(Math.cos(angle)*14,-15+Math.sin(angle)*14-(move.kind==='uppercut'?p*20:0),3,2);}}
    else if(move.kind==='beam'){ctx.fillRect(9,-17,15+p*70,5);ctx.fillStyle='#e8f7dc';ctx.fillRect(9,-15,15+p*70,1);}
    else if(move.kind==='teleport'){for(let i=0;i<12;i++)ctx.fillRect(Math.cos(i)*p*22,-16+Math.sin(i)*p*22,2,3);}
    else {const xx=12+p*65,yy=-14+(move.kind==='billiard'?Math.sin(p*8)*9:0);ctx.fillRect(xx-4,yy-4,8,8);ctx.fillRect(xx-6,yy-2,12,4);ctx.fillStyle='#f2e5c5';ctx.fillRect(xx-2,yy-2,3,3);if(move.kind==='fish')ctx.fillRect(xx-10,yy-4,4,8);}
    ctx.restore();
  }
  g.PortfolioHitbox={fighters,moves,glyph,inputText,pose,effect,install(C){
    const p=C.prototype,base={};const wrap=(n,fn)=>{base[n]=p[n];p[n]=function(...a){return fn.call(this,base[n].bind(this),...a);};};
    wrap('ctlList',function(fn){return [{k:'hitbox',name:'Hitbox',game:'Treino de golpes',hint:'direções + ataques · SELECT limpa'}].concat(fn());});
    p.hitMoves=function(){const fighter=this.st().hitFighter||'ryu';return fighter==='okaru'?this.data().specials.map(m=>({...m,fighter:'okaru',kind:m.fx||'beam'})):moves.filter(m=>m.fighter===fighter);};
    p.hitInput=function(key){
      if((this._comboIdle||0)>=20000)this._pad=[];this._comboIdle=0;
      this._pad=(this._pad||[]).concat(key).slice(-24);const sequence=this._pad.join('');this.sfx('key');
      const list=this.hitMoves().concat(this.data().secrets.map(m=>({...m,kind:m.fx==='seis'?'earth':'fireball'}))).sort((a,b)=>b.seq.length-a.seq.length);
      const longer=list.some(m=>m.seq.length>sequence.length&&m.seq.startsWith(sequence));
      const move=!longer&&list.find(m=>sequence.endsWith(m.seq));
      if(!move){this.setState({padSeq:this._pad.slice(),hitResult:''});return;}
      this._pad=[];this._moves={...this._moves,[move.fighter?'fight:'+move.fighter+':'+move.name:move.seq]:true};
      if(move.fighter==='okaru')this._moves[move.seq]=true;
      this.setState({padSeq:[],hitResult:move.name});this.unlock(move.fx==='konami'?'konami':'special');
      if(move.fx)this.moveFx(move.fx);this.sfx('special');this.persistSoon();
      if(Object.keys(this._moves).filter(k=>k.startsWith('fight:')&&!k.startsWith('fight:okaru:')).length>=10)this.unlock('hitbox-classics');
      if(this._wk&&!this.calm()){this._wk.anim={kind:'combat',t:0,move};this._wk.flo=null;this._wKeys={};}
    };
    wrap('pad',function(fn,key){if((this.st().ctl||'hitbox')==='hitbox')return this.hitInput(key);return fn(key);});
    p.hitKey=function(e){if(e.repeat||['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;const key={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',w:'U',s:'D',a:'L',d:'R',j:'P',k:'M',l:'H',u:'K',i:'N',o:'J','1':'A','2':'B',' ':'U'}[e.key];if(key){e.preventDefault();e.stopPropagation();this.hitInput(key);}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.padReset();}};
    wrap('worldAnim',function(fn,wk,dt,geo){if(wk.anim.kind!=='combat')return fn(wk,dt,geo);wk.anim.t+=dt;wk.moving=false;return wk.anim.t<1150;});
    wrap('worldPose',function(fn,wk){return wk.anim?.kind==='combat'?pose(wk.anim.move.kind,Math.min(1,wk.anim.t/1150)):fn(wk);});
    wrap('worldDraw',function(fn,cv,geo,wk){fn(cv,geo,wk);if(wk?.anim?.kind==='combat'){const dpr=Math.min(2,g.devicePixelRatio||1);effect(cv.getContext('2d'),wk.anim.move,Math.min(1,wk.anim.t/1150),wk.x*dpr,(wk.y-geo.top)*dpr,geo.u*dpr);}});
    wrap('renderVals',function(fn){const r=fn(),s=this.st(),hit=(s.ctl||'hitbox')==='hitbox';r.isHitbox=hit;r.hitKey=e=>this.hitKey(e);r.hitReset=()=>{this.padReset();this.setState({hitResult:''});};r.hitFighter=s.hitFighter||'ryu';r.hitFighters=fighters.map(([id,label])=>({id,label}));r.hitChoose=e=>{if(fighters.some(f=>f[0]===e.target.value)){this.padReset();this.setState({hitFighter:e.target.value,hitResult:''});}};
      r.hitDirections=[['L','←','Esquerda'],['D','↓','Baixo'],['R','→','Direita'],['U','↑','Cima']].map(([key,label,name])=>({key,label,name,run:()=>this.hitInput(key)}));
      r.hitAttacks=[['P','LP','Soco leve'],['M','MP','Soco médio'],['H','HP','Soco forte'],['A','A1','Assistência 1'],['K','LK','Chute leve'],['N','MK','Chute médio'],['J','HK','Chute forte'],['B','A2','Assistência 2']].map(([key,label,name])=>({key,label,name,run:()=>this.hitInput(key)}));
      r.hitMoveList=this.hitMoves().map(move=>({name:move.name,seq:inputText(move.seq)}));
      if(hit){r.lcdIdle=true;r.lcdMenuOn=false;r.lcdCardOn=false;r.lcdList=false;r.miniIdle=false;r.lcdCls='is-hitbox';r.padDisplay=s.hitResult||inputText(this._pad?.join('')||'')||'— — —';r.padSub=s.hitResult?'Golpe executado':'Escolha um lutador e experimente a lista';r.lcdHint='20 s de espera · SELECT limpa · A2 A1 = B A';r.ctlSub='Seis ataques · duas assistências · quatro direções';}
      return r;
    });
  }};
})(window);
