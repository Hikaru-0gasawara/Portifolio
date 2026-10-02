/* Click-friendly tributes: commands are simplified, not frame-accurate game training.
   Only the exact entry counts, and a training dummy drops in to take every move. */
(function(g){
  const fighters=[
    ['ryu','Ryu · Street Fighter'],['ken','Ken · Street Fighter'],['chun','Chun-Li · Street Fighter'],['guile','Guile · Street Fighter'],['cammy','Cammy · Street Fighter'],['falke','Falke · Street Fighter'],
    ['scorpion','Scorpion · Mortal Kombat'],['subzero','Sub-Zero · Mortal Kombat'],['raiden','Raiden · Mortal Kombat'],['liu','Liu Kang · Mortal Kombat'],
    ['filia','Filia · Skullgirls'],['robo','Robo-Fortune · Skullgirls'],['squigly','Squigly · Skullgirls'],['bella','Cerebella · Skullgirls'],['bigband','Big Band · Skullgirls'],['annie','Annie · Skullgirls'],['fortune','Ms. Fortune · Skullgirls'],
    ['venom','Venom · Guilty Gear'],['dizzy','Dizzy · Guilty Gear'],['toph','Toph · Avatar'],['iroh','Iroh · Avatar'],['okaru','Okaru · Tecnologia']
  ];
  // fighter, name, sequence, kind of animation, colour, super
  const moves=[
    ['ryu','Hadouken','DRP','fireball','#8ec5ff'],['ryu','Shoryuken','RDRH','uppercut','#f0ce6a'],
    ['ken','Tatsumaki Senpukyaku','DLK','spin','#f0ce6a'],['ken','Shinryuken','DRDRH','flame','#f29a4a',true],
    ['chun','Kikoken','LRP','fireball','#9fd8ff'],['chun','Spinning Bird Kick','DUK','spin','#9fd8ff'],['chun','Hyakuretsukyaku','KKK','rapid','#f2e5c5'],
    ['guile','Sonic Boom','LRP','boom','#d8e87a'],['guile','Flash Kick','DUJ','uppercut','#b8f07a'],['cammy','Spiral Arrow','DRK','drill','#78d0b5'],
    ['falke','Psycho Kugel','PPP','psycho','#b67be0'],['falke','Psycho Schneide','MH','uppercut','#b67be0'],['falke','Psycho Fluegel','DRDRP','wings','#b67be0',true],
    ['scorpion','Spear','LLP','spear','#d8a25a'],['scorpion','Teleport Punch','DLH','teleport','#f29a4a'],
    ['subzero','Ice Ball','DRP','ice','#a3d9ea'],['subzero','Slide','LRK','slide','#a3d9ea'],['raiden','Flying Thunder God','LRR','torpedo','#e8e07a'],['liu','Bicycle Kick','KKJ','bicycle','#f29a4a'],
    ['filia','Updo','RDRP','uppercut','#8a6a9a'],['filia','Hairball','DLK','hair','#3b2a3f'],['robo','Theonite Beam','DRH','beam','#90e4c1'],
    ['squigly','Draugen Punch','RDRP','uppercut','#7ee0b8'],['squigly','Daisy Pusher','DLPK','grave','#efe6c8'],['squigly','Battle Opera','DLKN','opera','#7ee0b8',true],
    ['bella','Diamond Drop','RDLH','grab','#9b6fc4'],
    ['bigband',"Take the 'A' Train",'LRK','train','#d9b45a'],['bigband','Giant Step','DLK','stomp','#c9a14a'],['bigband','Beat Extend','RDRP','stretch','#e6c45c'],
    ['annie','Crescent Cut','DRP','crescent','#f0ce6a'],['annie','Sagan Beam','DRDRH','beam','#b9c8ff',true],
    ['fortune','Fiber Upper','RDRK','uppercut','#f2a65a'],['fortune','Cat Scratch','DRPPP','scratch','#f2a65a'],
    ['venom','Stinger Aim','LRM','billiard','#d39ac8'],['venom','Carcass Raid','DUM','carcass','#d39ac8'],
    ['dizzy','I used this to catch fish','DRP','fish','#7fd6c9'],['dizzy','Ice Field','DDK','icefield','#a3d9ea'],
    ['toph','Muralha de terra','DLP','wall','#a69566'],['toph','Pisada da dobradora','DDH','earth','#a69566'],['toph','Pedra em movimento','DRK','boulder','#a69566'],
    ['iroh','Sopro do Dragão do Oeste','DRH','breath','#f29a4a'],['iroh','Redirecionar o relâmpago','DLRH','redirect','#cfe6ff']
  ].map(([fighter,name,seq,kind,color,sup])=>({fighter,name,seq,kind,color,sup:!!sup}));
  // reach: dummy distance in sprite pixels; hits: impact times (ms, hit-stop excluded); react: what the dummy does
  const kinds={
    fireball:{reach:64,hits:[480],react:'knock'},crescent:{reach:64,hits:[460],react:'knock'},boom:{reach:64,hits:[440],react:'knock'},
    psycho:{reach:56,hits:[400,430,460],react:'knock'},ice:{reach:64,hits:[500],react:'freeze'},fish:{reach:64,hits:[520],react:'knock'},
    billiard:{reach:64,hits:[460],react:'knock'},carcass:{reach:56,hits:[560],react:'launch'},beam:{reach:60,hits:[300,380,460,540,620],react:'shake'},
    uppercut:{reach:18,hits:[240],react:'launch',travel:'rise'},flame:{reach:18,hits:[220,290,360,430],react:'launch',travel:'rise'},
    spin:{reach:36,hits:[360,480,600],react:'down',travel:'dash'},rapid:{reach:18,hits:[240,300,360,420,480,540,600],react:'shake'},
    bicycle:{reach:40,hits:[320,430,540,650],react:'down',travel:'dash'},scratch:{reach:20,hits:[260,420,580],react:'shake',travel:'step'},
    drill:{reach:40,hits:[380,450],react:'down',travel:'slide'},slide:{reach:40,hits:[400],react:'down',travel:'slide'},
    train:{reach:44,hits:[340,420,500,580],react:'launch',travel:'dash'},spear:{reach:64,hits:[400],react:'pull'},
    teleport:{reach:30,hits:[620],react:'knock',push:-1,travel:'teleport'},torpedo:{reach:42,hits:[440],react:'shock',travel:'fly'},
    hair:{reach:38,hits:[420],react:'knock',travel:'dash'},grab:{reach:16,hits:[300,820],react:'slam',travel:'step'},
    grave:{reach:30,hits:[360],react:'grave'},stretch:{reach:46,hits:[340],react:'launch'},stomp:{reach:28,hits:[520],react:'squash'},
    opera:{reach:46,hits:[420,520,620,720],react:'shake'},wall:{reach:30,hits:[400],react:'launch'},earth:{reach:56,hits:[460],react:'launch'},
    boulder:{reach:60,hits:[520],react:'knock'},breath:{reach:44,hits:[340,430,520,610,700],react:'burn'},redirect:{reach:60,hits:[560],react:'shock'},
    icefield:{reach:52,hits:[480],react:'freeze'},wings:{reach:40,hits:[420,500,580,660],react:'down'}
  };
  const tails={knock:900,shake:800,launch:1500,down:1300,pull:1500,freeze:1750,shock:1000,slam:1200,grave:2300,squash:900,burn:1500};
  const COMBAT=1150,STOP=45;
  const glyph={U:'↑',D:'↓',L:'←',R:'→',P:'LP',M:'MP',H:'HP',K:'LK',N:'MK',J:'HK',A:'A1',B:'A2'};
  const inputText=seq=>[...seq].map(k=>glyph[k]||k).join(' ');
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2,easeOut=x=>1-(1-x)*(1-x);
  function specFor(move){const kind=kinds[move.kind]?move.kind:'fireball';return {...kinds[kind],kind,color:move.color||'#f0ce6a',sup:!!move.sup};}
  const lifetime=spec=>spec.hits.at(-1)+(tails[spec.react]||1000);
  // Classic hit-stop: every impact holds the dummy and the effects for a few frames.
  function effective(t,hits){let shift=0;for(const h of hits){const r=h+shift;if(t<=r)return t-shift;if(t<r+STOP)return h;shift+=STOP;}return t-shift;}
  function frozen(t,hits){let shift=0;for(const h of hits){const r=h+shift;if(t>r&&t<r+STOP)return true;shift+=STOP;}return false;}
  // How far Hikaru moves forward (sprite pixels) during a move; he always ends where he started.
  function travel(spec,t){
    const k=spec.travel;if(!k)return 0;
    if(k==='teleport')return t>=330&&t<860?spec.reach+14:0;
    const goal=k==='rise'?5:spec.reach-14,from=k==='rise'?0:120,arrive=k==='rise'?220:Math.max(from+80,spec.hits[0]);
    const out=goal*ease(clamp((t-from)/(arrive-from)));
    return t<900?out:out*(1-ease(clamp((t-900)/250)));
  }
  function pose(spec,t,side=1){
    const kind=spec.kind,k=Math.min(1,t/COMBAT),pulse=Math.sin(Math.PI*k),p={lift:0,rot:0,sx:1,sy:1,dir:side<0?'l':'r'};
    if(['uppercut','flame'].includes(kind)){const r=clamp((t-150)/700);p.lift=30*Math.sin(Math.PI*r);p.rot=-.35*side*Math.sin(Math.PI*r);}
    else if(['spin','hair'].includes(kind)){p.lift=8*pulse;p.rot=kind==='spin'?Math.PI*pulse:Math.PI*2*k*side;p.dir=['r','u','l','d'][Math.floor(k*16)%4];}
    else if(['slide','drill'].includes(kind)){p.sy=1-.45*pulse;p.sx=1+.45*pulse;p.lift=-2*pulse;}
    else if(kind==='teleport'){const fade=t<200?1:t<330?1-(t-200)/130:t<450?(t-330)/120:t<780?1:t<860?1-(t-780)/80:t<1000?(t-860)/140:1;p.sx=Math.max(.001,fade);if(t>=330&&t<860)p.dir=side<0?'r':'l';}
    else if(kind==='torpedo'){const r=clamp((t-180)/120)*(1-clamp((t-700)/200));p.rot=side*1.35*r;p.lift=6*r;}
    else if(['earth','wall','stomp','boulder','grave'].includes(kind)){p.lift=5*Math.max(0,Math.sin(k*Math.PI*2));p.sy=1-.22*pulse;}
    else if(['rapid','bicycle','scratch','train'].includes(kind)){p.rot=-.45*side*pulse;p.sx=1+.2*pulse;p.lift=5*pulse;}
    else if(kind==='grab'){const r=clamp((t-300)/350)*(1-clamp((t-820)/120));p.lift=8*r;p.sy=t>820&&t<900?.8:1;}
    else if(kind==='wings'){p.lift=10*pulse;}
    else {p.sy=1-.14*pulse;p.sx=1+.12*pulse;}
    if(spec.travel&&spec.travel!=='teleport'&&t>900)p.lift+=5*Math.sin(Math.PI*clamp((t-900)/250));
    return p;
  }
  // The dummy's pose at effective time te: offsets in sprite pixels, rotation away from Hikaru.
  function dummyState(spec,te){
    const s={dx:0,lift:0,rot:0,sx:1,sy:1,pivot:0,tint:'',ice:0,stars:false,sink:0,shatter:-1,alpha:1};
    if(te<150)s.lift=34*Math.pow(1-te/150,2);
    else if(te<230)s.sy=1-.12*Math.sin((te-150)/80*Math.PI);
    const hits=spec.hits,h0=hits[0],hl=hits.at(-1),a=te-h0,dir=spec.push||1;
    const rattle=k=>{for(const h of hits){const b=te-h;if(b<0)break;s.dx+=k*(1-Math.exp(-b/60));s.rot+=.15*Math.exp(-b/200)*Math.cos(b/50);}};
    if(a>=0)switch(spec.react){
      case 'knock':s.dx=dir*8*(1-Math.exp(-a/70));s.rot=dir*.5*Math.exp(-a/380)*Math.cos(a/80);break;
      case 'shake':rattle(2.4);break;
      case 'burn':rattle(2);s.tint=te<hl+1200?'burn':'';break;
      case 'launch':{const A=640;s.pivot=-14;if(a<A){const p=a/A;s.lift=136*p*(1-p);s.rot=Math.PI*2*p;s.dx=12*p;}
        else{const b=a-A;s.dx=12;if(b<200)s.lift=6*Math.sin(Math.PI*b/200);else if(b<260)s.sy=1-.15*Math.sin(Math.PI*(b-200)/60);s.stars=b>200&&b<1300;}break;}
      case 'down':{for(const h of hits)if(te>=h)s.dx+=4*(1-Math.exp(-(te-h)/90));const b=te-hl;
        if(b<0)s.rot=.25*Math.sin(a/45);else if(b<140)s.rot=1.45*b/140;else if(b<640)s.rot=1.45-(b<240?.12*Math.sin(Math.PI*(b-140)/100):0);
        else{const c=b-640;s.rot=1.45*Math.exp(-c/110)*Math.cos(c/70);}break;}
      case 'pull':{const p=clamp(a/340);s.dx=-(spec.reach-18)*ease(p);s.rot=-.4*Math.sin(Math.PI*p);if(a>380){s.stars=a<1400;s.rot+=.08*Math.sin(a/120);}break;}
      case 'freeze':s.dx=4*(1-Math.exp(-a/60));if(a<1500){s.tint='ice';s.ice=1;if(spec.kind==='icefield')s.lift=4*(1-Math.exp(-a/50));}else s.shatter=(a-1500)/250;break;
      case 'shock':s.dx=14*(1-Math.exp(-a/90));if(a<650){s.tint=Math.floor(a/60)%2?'shock':'shockDark';s.dx+=Math.sin(a*.9)*1.2;}else{const b=a-650;s.rot=.35*Math.exp(-b/300)*Math.cos(b/80);}break;
      case 'slam':{const slam=hits[1];s.pivot=-14;
        if(te<h0+350){const p=easeOut(clamp(a/350));s.lift=30*p;s.rot=Math.PI*p;s.dx=-4*p;}
        else if(te<slam){const p=clamp((te-h0-350)/(slam-h0-350));s.lift=30*(1-p*p);s.rot=Math.PI;s.dx=-4;}
        else{const b=te-slam;s.dx=-4+4*clamp(b/300);if(b<300){s.rot=Math.PI*(1-ease(b/300));s.lift=8*Math.sin(Math.PI*b/300);}if(b<80)s.sy=.7;s.stars=b>300&&b<1200;}break;}
      case 'grave':if(a<320)s.sink=30*Math.pow(a/320,2);else if(a<1540)s.sink=30;else if(a<1840){const p=(a-1540)/300;s.sink=30*(1-easeOut(p));if(p>.6)s.lift=4*Math.sin(Math.PI*(p-.6)/.4);}break;
      case 'squash':{const amp=.45*Math.exp(-a/160);s.sy=1-amp*Math.cos(a/70);s.sx=1+(1-s.sy)*.6;break;}
    }
    s.alpha=clamp((lifetime(spec)-te)/300);
    return s;
  }
  const palettes={
    '':{base:'#2b302b',pole:'#5b4a33',body:'#b89a64',shade:'#8a7046',band:'#5f4c2c',target:'#b4534a',dot:'#efdcae',head:'#c9ad76',eye:'#2a2117'},
    ice:{base:'#2b3a44',pole:'#6f9fb6',body:'#bfe6f2',shade:'#8cc5da',band:'#6aa3bb',target:'#9fd3e6',dot:'#f2fbff',head:'#d4f0f8',eye:'#3c6f86'},
    burn:{base:'#1d1d1b',pole:'#2c2622',body:'#4a3d33',shade:'#352b24',band:'#241d18',target:'#6b3a2c',dot:'#a8653a',head:'#54453a',eye:'#f29a4a'},
    shock:{base:'#f8f4c8',pole:'#f8f4c8',body:'#fffbe0',shade:'#e8e07a',band:'#e8e07a',target:'#ffffff',dot:'#e8e07a',head:'#fffbe0',eye:'#2a2117'},
    shockDark:{base:'#141414',pole:'#e8e07a',body:'#1c1c1c',shade:'#2a2a2a',band:'#e8e07a',target:'#e8e07a',dot:'#ffffff',head:'#1c1c1c',eye:'#e8e07a'}
  };
  // A sandbag on a spring base, drawn in sprite pixels with its feet at (x, 0) and its face towards Hikaru.
  function drawDummy(ctx,s,x){
    const c=palettes[s.tint]||palettes[''],R=(px,py,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(px,py,w,h);};
    ctx.save();
    if(s.sink){ctx.beginPath();ctx.rect(x-40,-120,80,120);ctx.clip();}
    else{ctx.globalAlpha=.28*s.alpha*(1-clamp(s.lift/40));R(x+s.dx-7,-1,14,1,'#000000');}
    ctx.globalAlpha=s.alpha;
    ctx.translate(x+s.dx+(s.jx||0),-s.lift+s.sink);ctx.translate(0,s.pivot);ctx.rotate(s.rot);ctx.translate(0,-s.pivot);ctx.scale(s.sx,s.sy);
    R(-6,-2,12,2,c.base);R(-5,-3,10,1,c.base);R(-1,-7,2,5,c.pole);
    R(-6,-19,12,12,c.body);R(-5,-20,10,1,c.body);R(-5,-7,10,1,c.shade);R(3,-19,3,12,c.shade);
    R(-6,-15,12,1,c.band);R(-6,-10,12,1,c.band);R(-4,-16,4,4,c.target);R(-3,-15,2,2,c.dot);
    R(-1,-21,2,1,c.pole);R(-4,-27,8,6,c.head);R(-3,-28,6,1,c.head);R(2,-27,2,6,c.shade);R(-3,-25,1,1,c.eye);R(-1,-25,1,1,c.eye);
    if(s.ice){ctx.globalAlpha=s.alpha*.42;R(-8,-31,16,31,'#cfefff');ctx.globalAlpha=s.alpha*.9;R(-8,-31,16,1,'#f2fbff');R(-8,-31,1,31,'#f2fbff');}
    ctx.restore();
  }
  // Street Fighter style hit spark: a white star burst with a coloured core.
  function spark(ctx,x,y,age,col,big){
    const k=age/150;if(k<0||k>=1)return;const r=(big?1.4:1)*(3+9*k);
    ctx.save();ctx.globalAlpha=1-k*k;ctx.fillStyle='#fffbe8';
    for(let i=0;i<8;i++){const an=i*Math.PI/4,len=i%2?r*.6:r;for(let d=2;d<len;d+=1.5)ctx.fillRect(x+Math.cos(an)*d-.5,y+Math.sin(an)*d-.5,1,1);}
    const c=Math.max(1,4*(1-k));ctx.fillStyle=col;ctx.fillRect(x-c,y-c/2,c*2,c);ctx.fillRect(x-c/2,y-c,c,c*2);ctx.fillStyle='#ffffff';ctx.fillRect(x-1,y-1,2,2);
    ctx.restore();
  }
  function bolt(ctx,x1,y1,x2,y2,seed,col,width){
    const nx=-(y2-y1),ny=x2-x1,l=Math.hypot(nx,ny)||1;ctx.strokeStyle=col;ctx.lineWidth=width||1;ctx.beginPath();ctx.moveTo(x1,y1);
    for(let i=1;i<6;i++){const k=i/6,j=Math.sin(seed*7.1+i*2.3)*3;ctx.lineTo(x1+(x2-x1)*k+nx/l*j,y1+(y2-y1)*k+ny/l*j);}
    ctx.lineTo(x2,y2);ctx.stroke();
  }
  function stars(ctx,x,y,clock){ctx.fillStyle='#f0ce6a';for(let i=0;i<3;i++){const an=clock/170+i*2.09,px=x+Math.cos(an)*7,py=y+Math.sin(an)*2;ctx.fillRect(px-1,py,3,1);ctx.fillRect(px,py-1,1,3);}}
  // The move itself, in sprite pixels: Hikaru's feet at the origin, the dummy at spec.reach.
  function drawMove(ctx,spec,te,s,hx,clock){
    const col=spec.color,reach=spec.reach,hits=spec.hits,h0=hits[0],hl=hits.at(-1),front=reach+(spec.push<0?6:-6)+s.dx,seed=Math.floor(clock/50);
    const R=(x,y,w,h,c,a=1)=>{ctx.globalAlpha=a;ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    const shooting=te>=180&&te<h0,sx=12+(reach-18)*clamp((te-180)/(h0-180));
    const puff=(x,age,a,b)=>{if(age<0||age>260)return;for(let i=0;i<7;i++){const an=i*.9,d=age/26;R(x+Math.cos(an)*d,-12+Math.sin(an)*d-age/30,3,3,i%2?a:b,.8*(1-age/260));}};
    ctx.save();
    switch(spec.kind){
      case 'fireball':if(shooting){for(let i=3;i>0;i--)R(sx-4-i*4,-16,4,6,col,.22*i);R(sx-4,-18,8,8,col);R(sx-2,-16,4,4,'#ffffff');}break;
      case 'crescent':if(shooting)for(let i=-6;i<=6;i++){const off=Math.round(3*(1-i*i/36));R(sx+off-1,-14+i,2,1,col);R(sx+off+1,-14+i,1,1,'#fffbe8');}break;
      case 'boom':if(shooting){const w=2+Math.floor(clock/60)%2;for(let i=-5;i<=5;i++)R(sx+Math.round(2*(1-i*i/25))-w,-14+i,w,1,col,.9);R(sx-1,-15,2,2,'#ffffff');}break;
      case 'psycho':if(te>=160&&te<240)R(6,-17,5,6,col,.6);hits.forEach((h,i)=>{if(te<180||te>=h)return;const p=clamp((te-180)/(h-180)),px=14+(front-14)*p,py=-13+(i-1)*4*(1-p);R(px-2,py-2,4,4,col);R(px-1,py-1,2,2,'#f6e8ff');});break;
      case 'ice':if(shooting){for(let i=1;i<4;i++)R(sx-4-i*4,-14+i%2,1,1,'#f2fbff',.6);R(sx-3,-15,6,4,col);R(sx-2,-17,4,8,col);R(sx-1,-15,2,2,'#f2fbff');}break;
      case 'icefield':for(let x=14;x<=reach;x+=6){const b=te-(200+(h0-200)*(x-14)/Math.max(1,reach-14));if(b<0||b>=700)continue;const hgt=(x>=reach-5?12:7)*Math.min(1,b/60)*(1-clamp((b-500)/200));R(x-1,-hgt,3,hgt,col,.9);R(x,-hgt-2,1,2,'#f2fbff',.9);}break;
      case 'fish':if(shooting){R(sx-4,-16,8,5,col);R(sx-7,-17,2,7,col);R(sx+2,-15,1,1,'#102020');R(sx+5,-19,1,1,'#f2fbff',.8);}break;
      case 'billiard':if(te>=100&&te<220){const e=clamp((te-100)/80)*6;R(-2+e,-13,10,1,'#8a6a3a');R(8+e,-13,2,1,'#f2e5c5');}if(shooting){R(sx-3,-16,6,6,col);R(sx-2,-17,4,8,col);R(sx-1,-15,2,2,'#ffffff');}break;
      case 'carcass':if(shooting){const p=clamp((te-180)/(h0-180)),bx=12+(front-12)*p,by=-14*(1-p)-24*p-44*Math.sin(Math.PI*p);R(bx-3,by-3,6,6,col);R(bx-1,by-2,2,2,'#ffffff');}break;
      case 'beam':if(te<220&&spec.sup){R(-2,-20,10,10,col,.25+.25*Math.sin(te/30));}
        if(te>=220&&te<hl+120){const th=spec.sup?9:5,f=Math.floor(clock/40)%2?.65:.9;R(10,-15-th/2,front-10,th,col,f);R(10,-15.5,front-10,1,'#fffbe8');R(6,-16-th/2,5,th+2,'#fffbe8',.7);
          if(spec.sup)for(let i=0;i<8;i++)R(10+((i*37+clock/3)%Math.max(1,front-10)),-17-th/2-(i%3),1,1,'#ffffff',.9);}break;
      case 'uppercut':case 'flame':{if(te>=180&&te<700){const p=clamp((te-180)/320),top=-8-30*p;for(let y=-6;y>top;y-=2){const q=(y+6)/(top+6);R(hx+6+Math.round(3*Math.sin(q*Math.PI)),y,2,2,col,.75*(1-p*.6));}}
        if(spec.kind==='flame'&&te>=160&&te<820)for(let i=0;i<14;i++){const fx=hx-2+((i*5+seed)%12),fy=-4-((i*7+clock/6)%42);R(fx,fy,3,3,i%3?'#f29a4a':'#f8d36a',.8*(1+fy/50));}break;}
      case 'spin':if(te>=120&&te<900)for(let i=0;i<8;i++){const an=te/60+i*.8;R(hx+Math.cos(an)*13,-14+Math.sin(an)*5,3,2,col,.7);}break;
      case 'rapid':if(te>=220&&te<680)for(let i=0;i<6;i++){const y=-8-((i*5+seed*3)%14),len=4+((i*7+seed)%6);R(6,y,len,1,col,.8);R(6+len,y-1,2,3,'#ffffff',.9);}break;
      case 'bicycle':if(te>=200&&te<800)for(let i=0;i<6;i++){const an=te/45+i;R(hx+8+Math.cos(an)*5,-12+Math.sin(an)*5,2,2,col,.75);}break;
      case 'scratch':for(const h of hits){const b=te-h;if(b<0||b>220)continue;for(let j=0;j<3;j++)for(let d=0;d<8;d++)R(reach+s.dx-4+j*3+d*.7,-19+d*1.6,1,1,col,1-b/220);}break;
      case 'drill':if(te>=180&&te<h0+120)for(let i=0;i<7;i++)R(hx+10+i*2,-8+Math.sin(te/25+i*.9)*4,2,1,col,.8);// falls through to the slide dust
      case 'slide':if(te>=200&&te<h0+200){for(let i=0;i<5;i++)R(hx-6-i*4,-2-(i%2),3,2,'#9c8f78',.5*(1-i/5));if(spec.kind==='slide')R(hx-14,-1,14,1,col,.6);}break;
      case 'train':if(te>=150&&te<700){for(let i=0;i<4;i++){const age=(te/3+i*40)%120;R(hx-4-age/8,-28-age/6,3+age/40,3,'#e8e6dc',.6*(1-age/120));}R(hx-14,-12,6,1,col,.6);R(hx-16,-8,8,1,col,.4);}break;
      case 'spear':{let tip=null;if(te>=180&&te<h0)tip=7+(front+1-7)*clamp((te-180)/(h0-180));else if(te>=h0&&te<h0+420)tip=reach-5+s.dx;
        if(tip!==null){ctx.globalAlpha=1;ctx.strokeStyle='#d8a25a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(7,-14);ctx.quadraticCurveTo((7+tip)/2,-12+(te<h0?2:0),tip,-14);ctx.stroke();R(tip-1,-16,3,4,'#d9d9d9');R(tip+2,-15,2,2,'#d9d9d9');R(tip-3,-15,2,2,'#8a6a3a');}break;}
      case 'teleport':puff(0,te-180,'#f29a4a','#5a4a3a');puff(reach+14,te-330,'#f29a4a','#5a4a3a');puff(reach+14,te-780,'#f29a4a','#5a4a3a');puff(0,te-860,'#f29a4a','#5a4a3a');break;
      case 'torpedo':if(te>=200&&te<h0+60){for(let i=0;i<3;i++)bolt(ctx,hx-10,-14+i*3,hx+10,-12-i*3,seed+i,i?col:'#fffbe8',1);R(hx-20,-13,12,1,col,.5);}break;
      case 'hair':if(te>=120&&te<h0+80)for(let i=0;i<12;i++){const an=i*.52+te/50;R(hx+Math.cos(an)*9-1,-12+Math.sin(an)*9-1,3,3,i%4?col:'#8a6a9a',.85);}break;
      case 'grab':{const cx=reach+s.dx,cy=-14-s.lift;if(te>=120&&te<h0){const hx2=6+(reach-17)*clamp((te-120)/(h0-120));R(hx2,-17,4,7,col,.9);}
        else if(te>=h0&&te<hits[1]+120){R(cx-11,cy-4,4,7,col,.9);R(cx+7,cy-4,4,7,col,.9);}
        const b=te-hits[1];if(b>=0&&b<300){for(let i=0;i<6;i++)R(reach-12+i*5,-1,3,1,'#5a4a3a',1-b/300);for(let i=0;i<8;i++)R(reach+(i-3.5)*4*(1+b/150),-2-(b/40)*(i%2),2,2,'#b8aa90',.7*(1-b/300));}break;}
      case 'grave':{const a=te-h0,fade=1-clamp((a-1900)/300);if(te>=150&&te<300)R(6,-3,4,3,'#9c8f78',.7);
        if(a>=-20&&a<520||a>=1500&&a<1900){const w=18*clamp((a+20)/80);R(reach-w/2,-1,w,2,'#120d0a');R(reach-w/2-2,-2,2,2,'#6b5238');R(reach+w/2,-2,2,2,'#6b5238');if(a>=330&&a<520)R(reach-9,-2,18*clamp((a-330)/190),2,'#6b5238');}
        else if(a>=520&&a<1500){R(reach-9,-3,18,3,'#6b5238');R(reach-7,-4,14,1,'#7d6244');}
        if(a>=560&&a<2200){const gr=clamp((a-560)/400),fx=reach+5;R(fx,-4-8*gr,1,8*gr,'#5f9a4a',fade);R(fx+1,-4-5*gr,2,1,'#5f9a4a',fade);if(gr===1){R(fx-2,-13,5,1,col,fade);R(fx,-15,1,5,col,fade);R(fx-1,-14,3,3,col,fade);R(fx,-13,1,1,'#f0ce6a',fade);}}break;}
      case 'stretch':{let tx=null,ty=-15;if(te>=150&&te<h0)tx=8+(front-8)*clamp((te-150)/(h0-150));else if(te>=h0&&te<h0+600){tx=reach+s.dx-5;ty=-15-s.lift*.6;}else if(te>=h0+600&&te<h0+800)tx=(reach-5)*(1-clamp((te-h0-600)/200))+8;
        if(tx!==null){ctx.globalAlpha=1;ctx.strokeStyle='#4a3a2a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(7,-15);ctx.lineTo(tx,ty);ctx.stroke();R(tx-3,ty-3,6,6,col);R(tx-2,ty-2,4,4,'#3a2a1a');R(tx-4,ty,1,1,'#fff6c8');R(tx+3,ty-1,1,1,'#fff6c8');}break;}
      case 'stomp':{if(te>=200&&te<h0+300){const y=te<h0?-70+43*ease(clamp((te-200)/(h0-200))):-27*s.sy,a=te<h0?1:1-clamp((te-h0-100)/200);R(reach-1,y-40,2,30,'#5a4a33',a);R(reach-6,y-10,12,10,col,a);R(reach-6,y-2,12,2,'#7a5a24',a);}
        const b=te-h0;if(b>=0&&b<500)for(let i=0;i<4;i++){R(reach-14-i*6-b/20,-1,3,1,'#9c8f78',1-b/500);R(reach+11+i*6+b/20,-1,3,1,'#9c8f78',1-b/500);}break;}
      case 'opera':if(te>=180&&te<hl+150){const bx=te<h0?10+(front-14)*ease(clamp((te-180)/(h0-180))):front-4,by=-16+Math.sin(te/120)*2,r=5+Math.sin(te/60);
        for(let i=0;i<12;i++){const an=i*.52;R(bx+Math.cos(an)*r-1,by+Math.sin(an)*r-1,2,2,col,.85);}R(bx-1,by-2,1,5,'#1c2a24');R(bx-3,by+2,3,2,'#1c2a24');R(bx,by-3,3,1,'#1c2a24');
        for(let i=0;i<3;i++){const age=(te+i*200)%600;R(bx-6+i*6,by-8-age/30,1,3,col,.8*(1-age/600));R(bx-7+i*6,by-6-age/30,2,1,col,.8*(1-age/600));}}break;
      case 'wall':{if(te>=150&&te<300)R(-6,-2,12,2,'#9c8f78',.6);if(te>=300&&te<h0+700){const hgt=te<h0?22*ease(clamp((te-300)/(h0-300))):te<h0+500?22:22*(1-clamp((te-h0-500)/200));R(reach-12,-hgt,7,hgt,'#a69566');R(reach-12,-hgt,7,2,'#c2b183');R(reach-7,-hgt,2,hgt,'#756443');}break;}
      case 'earth':{for(let x=10;x<=front+2;x+=5){const b=te-(200+(h0-200)*(x-10)/Math.max(1,front-10));if(b>=0&&b<220){const hgt=8*Math.sin(Math.PI*b/220);R(x,-hgt,4,hgt,'#a69566');R(x,-hgt,4,1,'#c2b183');}}
        const b=te-h0;if(b>=0&&b<300){const hgt=14*Math.sin(Math.PI*b/300);R(reach-4,-hgt,8,hgt,'#a69566');R(reach-4,-hgt,8,1,'#c2b183');}break;}
      case 'boulder':if(te>=150&&te<h0){let x=12,y;if(te<280){y=-14*ease(clamp((te-150)/130));R(8,-2,10,2,'#9c8f78',.6);}else{const p=clamp((te-280)/(h0-280));x=12+(front-16)*p;y=-14-6*Math.sin(Math.PI*p);}
        R(x-4,y-4,8,7,'#a69566');R(x-3,y-5,6,1,'#c2b183');R(x+2,y-3,2,5,'#756443');}break;
      case 'breath':if(te>=260&&te<hl+120)for(let i=0;i<18;i++){const d=(i*13+te/2)%Math.max(1,front-6),spread=d/(front-7)*7,size=2+d/20;R(7+d,-19+d*.15+Math.sin(i*1.7+te/50)*spread,size,size,d<15?'#fff2b0':d<30?'#f8c44a':'#f2742a',.85);}
        if(s.tint==='burn'&&te>hl)for(let i=0;i<4;i++){const age=(te+i*150)%600;R(reach+s.dx-3+i*2+Math.sin(age/80),-27-age/25,2,2,'#5a5550',.6*(1-age/600));}break;
      case 'redirect':if(te>=200&&te<380)bolt(ctx,hx-2,-90,-3,-16,seed,col,1.5);
        if(te>=380&&te<540)for(let i=0;i<6;i++){const an=(te-380)/40+i*1.05;R(Math.cos(an)*6-1,-14+Math.sin(an)*8,2,2,col,.9);}
        if(te>=540&&te<700){bolt(ctx,7,-16,front,-13,seed,'#ffffff',1.5);bolt(ctx,7,-16,front,-13,seed+3,col,1);R(5,-18,4,4,'#ffffff',.8);}break;
      case 'wings':if(te>=150&&te<900){const a=.7*(1-clamp((te-700)/200));for(let i=0;i<7;i++){R(-6-i*2,-14-i*3,2,2,col,a*(1-i/9));R(4+i*2,-14-i*3,2,2,col,a*(1-i/9));}}
        for(const h of hits){const b=te-h;if(b>=-80&&b<0)R(10,-14+(h/80%3-1)*3,front-10,1,col,.8);}break;
    }
    if(s.shatter>=0&&s.shatter<1)for(let i=0;i<10;i++){const an=i*.63,d=s.shatter*16;R(reach+s.dx+Math.cos(an)*d,-14+Math.sin(an)*d+s.shatter*8,2,2,'#cfefff',1-s.shatter);}
    ctx.restore();
    for(const h of hits)spark(ctx,front,-13-s.lift,te-h,col,spec.sup);
  }
  // Supers freeze the scene for a moment: the page darkens behind Hikaru and a ring flashes around him.
  function superFlash(ctx,cv,x,y,u,te){
    const k=clamp(te/260);ctx.save();ctx.setTransform(1,0,0,1,0,0);
    ctx.globalCompositeOperation='destination-over';ctx.fillStyle='rgba(3,6,4,'+(.55*(1-k)).toFixed(3)+')';ctx.fillRect(0,0,cv.width,cv.height);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1-k;ctx.fillStyle='#fffbe8';
    for(let i=0;i<12;i++){const an=i*Math.PI/6,r=(6+k*30)*u;ctx.fillRect(x+Math.cos(an)*r,y+Math.sin(an)*r,Math.max(1,u),Math.max(1,u));}
    ctx.restore();
  }
  function label(ctx,text,x,y,u,col){
    const size=Math.max(10,Math.round(5*u));y=Math.max(size+4,y);
    ctx.save();ctx.font=size+"px 'DotGothic16','JetBrains Mono',monospace";ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.lineJoin='round';ctx.lineWidth=Math.max(2,u);ctx.strokeStyle='#050706';ctx.strokeText(text,x,y);ctx.fillStyle=col;ctx.fillText(text,x,y);ctx.restore();
  }
  const worldBusy=s=>!!(s.paused||s.palOpen||s.achOpen||s.recOpen||s.arcOpen||s.dOpen||s.skOpen||s.credOpen||s.transitioning||s.powering||s.languageOpen||s.galleryLarge||s.shooterOpen||s.deOpen||s.tvGameOpen);
  g.PortfolioHitbox={fighters,moves,kinds,glyph,inputText,specFor,effective,travel,pose,dummyState,lifetime,install(C){
    const p=C.prototype,base={};const wrap=(n,fn)=>{base[n]=p[n];p[n]=function(...a){return fn.call(this,base[n].bind(this),...a);};};
    wrap('ctlList',function(fn){return [{k:'hitbox',name:'Hitbox',game:'Treino de golpes',hint:'direções + ataques · SELECT limpa'}].concat(fn());});
    p.hitMoves=function(){const fighter=this.st().hitFighter||'ryu';return fighter==='okaru'?this.data().specials.map(m=>({...m,fighter:'okaru',kind:m.fx||'beam'})):moves.filter(m=>m.fighter===fighter);};
    p.hitInput=function(key){
      if((this._comboIdle||0)>=20000)this._pad=[];this._comboIdle=0;
      if(!this._pad?.length)this._hitInvalid=false;
      this._pad=(this._pad||[]).concat(key).slice(-24);const sequence=this._pad.join('');
      const list=this.hitMoves().concat(this.data().secrets.map(m=>({...m,kind:m.fx==='seis'?'earth':'fireball'})));
      // Exact entry only: everything typed since the last clear must be the whole sequence, nothing before or in between.
      const move=list.find(m=>m.seq===sequence),longer=list.some(m=>m.seq.length>sequence.length&&m.seq.startsWith(sequence));
      if(!move||longer){const invalid=!move&&!longer;this.sfx(invalid&&!this._hitInvalid?'bump':'key');this._hitInvalid=invalid;this.setState({padSeq:this._pad.slice(),hitResult:''});return;}
      this.sfx('key');this._pad=[];this._hitInvalid=false;this._moves={...this._moves,[move.fighter?'fight:'+move.fighter+':'+move.name:move.seq]:true};
      if(move.fighter==='okaru')this._moves[move.seq]=true;
      this.setState({padSeq:[],hitResult:move.name});this.unlock(move.fx==='konami'?'konami':'special');
      if(move.fx)this.moveFx(move.fx);this.sfx('special');this.persistSoon();
      if(Object.keys(this._moves).filter(k=>k.startsWith('fight:')&&!k.startsWith('fight:okaru:')).length>=10)this.unlock('hitbox-classics');
      if(this._wk&&!this.calm())this.hitStrike(move);
    };
    // Hikaru performs the move where he stands; the dummy drops in on the side with room for it.
    p.hitStrike=function(move){
      const wk=this._wk,spec=specFor(move),prior=wk.anim?.kind==='combat'?wk.anim:null,x0=Number.isFinite(prior?.x0)?prior.x0:wk.x,y0=Number.isFinite(prior?.y0)?prior.y0:wk.y;
      const geo=this.worldGeo?.();let side=1;
      if(geo&&Number.isFinite(x0)){const need=(spec.reach+(spec.travel==='teleport'?24:10))*geo.u;if(geo.W-x0<need&&x0>geo.W-x0)side=-1;}
      wk.anim={kind:'combat',t:0,move,spec,side,x0,y0};wk.flo=null;this._wKeys={};
      this._dummy=Number.isFinite(x0)&&Number.isFinite(y0)?{page:this.curPage(),t:0,spec,side,x0,y0}:null;
    };
    wrap('pad',function(fn,key){if((this.st().ctl||'hitbox')==='hitbox')return this.hitInput(key);return fn(key);});
    p.hitKey=function(e){if(e.repeat||['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;const key={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',w:'U',s:'D',a:'L',d:'R',j:'P',k:'M',l:'H',u:'K',i:'N',o:'J','1':'A','2':'B',' ':'U'}[e.key];if(key){e.preventDefault();e.stopPropagation();this.hitInput(key);}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.padReset();}};
    wrap('padReset',function(fn){this._hitInvalid=false;return fn();});
    wrap('worldAnim',function(fn,wk,dt,geo){
      const a=wk.anim;if(a.kind!=='combat')return fn(wk,dt,geo);
      a.t+=dt;wk.moving=false;const done=a.t>=COMBAT;
      if(Number.isFinite(a.x0)&&geo?.u)wk.x=a.x0+(done?0:(a.side||1)*travel(a.spec||specFor(a.move),a.t)*geo.u);
      return !done;
    });
    wrap('worldPose',function(fn,wk){const a=wk.anim;return a?.kind==='combat'?pose(a.spec||specFor(a.move),a.t,a.side||1):fn(wk);});
    wrap('loopWorld',function(fn,dt){
      const d=this._dummy;
      if(d&&!worldBusy(this.st())){
        const before=effective(d.t,d.spec.hits);d.t+=dt;const now=effective(d.t,d.spec.hits);
        if(d.spec.hits.some(h=>before<h&&now>=h))this.sfx(d.spec.react==='freeze'&&now<d.spec.hits[0]+20?'crack':'strike');
        if(d.spec.react==='freeze'&&before<d.spec.hits[0]+1500&&now>=d.spec.hits[0]+1500)this.sfx('shatter');
      }
      return fn(dt);
    });
    wrap('worldDraw',function(fn,cv,geo,wk){
      fn(cv,geo,wk);
      const d=this._dummy;if(!d)return;
      if(!wk||wk.hidden||d.page!==this.curPage()){this._dummy=null;return;}
      const te=effective(d.t,d.spec.hits);if(te>lifetime(d.spec)){this._dummy=null;return;}
      const ctx=cv.getContext?.('2d');if(!ctx)return;
      const dpr=Math.min(2,g.devicePixelRatio||1),u=geo.u*dpr,X=d.x0*dpr,Y=(d.y0-geo.top)*dpr,side=d.side;
      const s=dummyState(d.spec,te);if(frozen(d.t,d.spec.hits))s.jx=(Math.floor(d.t/25)%2?1:-1)*.8;
      const a=wk.anim?.kind==='combat'&&wk.anim.spec===d.spec?wk.anim:null,hx=a?travel(d.spec,a.t):0;
      if(d.spec.sup&&te<260)superFlash(ctx,cv,X+side*hx*u,Y-12*u,u,te);
      ctx.save();ctx.translate(X,Y);ctx.scale(side*u,u);
      drawDummy(ctx,s,d.spec.reach);drawMove(ctx,d.spec,te,s,hx,d.t);if(s.stars)stars(ctx,d.spec.reach+s.dx,-31-s.lift,d.t);
      ctx.restore();
      const landed=d.spec.hits.filter(h=>te>=h).length;
      if(d.spec.hits.length>1&&landed>1&&te<d.spec.hits.at(-1)+900)label(ctx,landed+' HITS',X+side*(d.spec.reach+s.dx)*u,Y-(36+s.lift)*u,u,'#f0ce6a');
      if(d.spec.kind==='spear'&&te>=140&&te<900)label(ctx,'GET OVER HERE!',X,Y-34*u,u,'#f29a4a');
    });
    wrap('renderVals',function(fn){const r=fn(),s=this.st(),hit=(s.ctl||'hitbox')==='hitbox';r.isHitbox=hit;r.hitKey=e=>this.hitKey(e);r.hitReset=()=>{this.padReset();this.setState({hitResult:''});};r.hitFighter=s.hitFighter||'ryu';r.hitFighters=fighters.map(([id,label])=>({id,label}));r.hitChoose=e=>{if(fighters.some(f=>f[0]===e.target.value)){this.padReset();this.setState({hitFighter:e.target.value,hitResult:''});}};
      r.hitDirections=[['L','←','Esquerda'],['D','↓','Baixo'],['R','→','Direita'],['U','↑','Cima']].map(([key,label,name])=>({key,label,name,run:()=>this.hitInput(key)}));
      r.hitAttacks=[['P','LP','Soco leve'],['M','MP','Soco médio'],['H','HP','Soco forte'],['A','A1','Assistência 1'],['K','LK','Chute leve'],['N','MK','Chute médio'],['J','HK','Chute forte'],['B','A2','Assistência 2']].map(([key,label,name])=>({key,label,name,run:()=>this.hitInput(key)}));
      r.hitMoveList=this.hitMoves().map(move=>({name:move.name,seq:inputText(move.seq)}));
      const invalid=!!this._hitInvalid&&!!this._pad?.length;r.hitInvalid=invalid;
      if(hit){r.lcdIdle=true;r.lcdMenuOn=false;r.lcdCardOn=false;r.lcdList=false;r.miniIdle=false;r.lcdCls='is-hitbox'+(invalid?' is-invalid':'');r.padDisplay=s.hitResult||inputText(this._pad?.join('')||'')||'— — —';r.padSub=s.hitResult?'Golpe executado':invalid?'Sequência inválida · SELECT limpa':'Escolha um lutador e experimente a lista';r.lcdHint='Sequência exata · SELECT limpa · A2 A1 = B A';r.ctlSub='Seis ataques · duas assistências · quatro direções';}
      return r;
    });
  }};
})(window);
