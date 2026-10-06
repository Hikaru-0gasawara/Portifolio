/* okwm: the room computer runs a tiling window manager. Every app claims a tile, nothing overlaps and the keyboard
   rules (Alt+Enter, Alt+P, Alt+1–4, Alt+H/J/K/L). Terminal commands stay explicitly allowlisted. */
(function(g){
  // [id, launcher description, label]
  const apps=[
    ['terminal','neofetch, projetos, contato e mais','Terminal'],
    ['files','Projetos, diagramas e currículos','Arquivos'],
    ['monitor','Quadros, memória e processos desta página','Monitor'],
    ['music','As trilhas 8-bit do portfólio','Música'],
    ['profile','Quem é o Hikaru','Perfil'],
    ['skills','Árvore de habilidades','Habilidades'],
    ['notes','Notas adesivas','Notas'],
    ['lab','Bancada, inventário e hexdump','Lab'],
    ['game','SEM CONEXÃO, o jogo offline','Jogar'],
    ['resume','Currículo em PDF','Currículo'],
    ['clock','Sua hora, São Paulo e Tóquio','Relógio'],
    ['settings','Idioma, som e movimento','Ajustes']
  ];
  const icons={
    terminal:'M3 5h18v14H3z M6 9l3 3-3 3 M12 15h5',
    files:'M3 6h6l2 2h10v11H3z M3 10h18',
    monitor:'M3 4h18v13H3z M6 12h3l2-4 2 7 2-3h3 M8 21h8 M12 17v4',
    music:'M9 17V5l10-2v12 M9 17a3 3 0 1 1-3-3h3 M19 15a3 3 0 1 1-3-3h3',
    profile:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 21v-2a8 6 0 0 1 16 0v2',
    skills:'M10 3h4v4h-4z M3 17h4v4H3z M17 17h4v4h-4z M12 7v5 M5 17v-5h14v5',
    notes:'M5 3h14v12l-6 6H5z M13 21v-6h6 M8 8h8 M8 12h5',
    lab:'M8 3h8 M10 3v7L4 20h16l-6-10V3 M7 15h10',
    game:'M7 7h10l4 9-2 3-5-4h-4l-5 4-2-3z M6 11h5 M8.5 8.5v5 M16 10h.1 M18 13h.1',
    resume:'M5 2h10l4 4v16H5z M14 2v6h5 M8 12h8 M8 16h8',
    clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 6v7h5',
    settings:'M4 6h9 M17 6h3 M4 12h3 M11 12h9 M4 18h11 M19 18h1 M15 4v4 M9 10v4 M17 16v4'
  };
  const glyphs={
    soundOn:'M4 9h4l5-4v14l-5-4H4z M16 9a4 4 0 0 1 0 6 M18.5 6.5a7.5 7.5 0 0 1 0 11',soundOff:'M4 9h4l5-4v14l-5-4H4z M16 9l5 6 M21 9l-5 6',
    net:'M2 8.5a15 15 0 0 1 20 0 M5 12a10 10 0 0 1 14 0 M8.5 15.5a5 5 0 0 1 7 0 M12 19h.01',netOff:'M2 8.5a15 15 0 0 1 20 0 M5 12a10 10 0 0 1 14 0 M8.5 15.5a5 5 0 0 1 7 0 M12 19h.01 M3 3l18 18',
    globe:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M3 12h18 M12 3c-6 4-6 14 0 18 M12 3c6 4 6 14 0 18',power:'M12 3v9 M6.4 6.4a8 8 0 1 0 11.2 0',
    min:'M6 12h12',full:'M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5',unfull:'M9 4v5H4 M20 9h-5V4 M15 20v-5h5 M4 15h5v5',close:'M6 6l12 12 M18 6L6 18',
    prev:'M6 5v14 M19 5L9 12l10 7z',play:'M7 4l13 8-13 8z',pause:'M7 5h3v14H7z M14 5h3v14h-3z',next:'M18 5v14 M5 5l10 7-10 7z',
    back:'M15 5l-7 7 7 7',out:'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',lock:'M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4',enter:'M20 5v7a3 3 0 0 1-3 3H5 M9 11l-4 4 4 4',
    grid:'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z'
  };
  // 光 (hikari, "light"): the first character of his name as a 13×13 pixel bitmap. Drawn as SVG cells, so it never
  // depends on a font having block glyphs.
  const art=['......X......','.X....X....X.','..X...X...X..','...X..X..X...','......X......','XXXXXXXXXXXXX','....X...X....','....X...X....','....X...X....','...X....X....','..X.....X...X','.X......X...X','X........XXXX'];
  const ascii=art.map(row=>row.replace(/X/g,'█').replace(/\./g,' ')).join('\n');
  const logo=art.flatMap((row,y)=>[...row].map((c,x)=>c==='X'?{x:String(x),y:String(y)}:null).filter(Boolean));
  const system=['OS: Arch Linux','Host: Okaru Workstation','Kernel: portfolio 1.0','WM: okwm (mosaico)','Shell: okaru-sh','Fonte: JetBrains Mono'];
  const profile=['Hikaru Ogasawara · 小笠原 光','OS: humano','Uptime: 21 anos','Modelo: Engenharia da Computação','Local: São Paulo, Brasil','Formação: Ibmec · 2023–2027 (previsto)','Foco: hardware, infraestrutura e segurança','Guilda: Ycare · vice-presidente','Contato: hogasawara2311@outlook.com'];
  const help='Comandos: help, neofetch, whoami, ls, projetos, contato, abrir, btop, date, lang, clear.';
  const swatches=['#0A0F0B','#E04A3A','#62B37F','#D8B24A','#7FB2DA','#8FD3A6','#F0CE6A','#E8E4D4'];
  const links=[['E-mail','hogasawara2311@outlook.com','mailto:hogasawara2311@outlook.com'],['LinkedIn','/in/hikaru-ogasawara','https://www.linkedin.com/in/hikaru-ogasawara'],['GitHub','Hikaru-0gasawara','https://github.com/Hikaru-0gasawara']];
  // Only facts already stated elsewhere in the portfolio.
  const notes=[
    {t:'Procurando estágio em infraestrutura, segurança ou embarcados.',link:links[0],tone:'gold'},
    {t:'Ycare · todo segundo sábado do mês: cestas com alimentos e itens de higiene.',tone:'jade'},
    {t:'Formatura prevista: 2027 · Engenharia da Computação no Ibmec.',tone:'sky'},
    {t:'Dica: digite neofetch no terminal.',tone:'paper'}
  ];
  const commands=['help','neofetch','whoami','ls','cat','projects','contact','open','btop','date','lang','echo','history','clear','exit'];
  const aliases={ajuda:'help',projetos:'projects',contato:'contact',abrir:'open',htop:'btop',top:'btop',data:'date',idioma:'lang',limpar:'clear',sair:'exit',logout:'exit','histórico':'history',historico:'history'};
  const localCmd={projects:'projetos',contact:'contato',open:'abrir'};
  const helpLines=[['help','esta lista'],['neofetch','o sistema e quem mora nele'],['whoami','quem é o Hikaru'],['ls','lista os arquivos (ls projects)'],['cat','mostra um arquivo (cat README.md)'],['projects','os quatro projetos'],['contact','e-mail, LinkedIn e GitHub'],['open','abre um app (open arquivos)'],['btop','monitor de processos'],['date','data e hora'],['lang','troca o idioma (lang en)'],['clear','limpa a tela'],['exit','fecha o terminal']];
  const workspaces={1:['terminal','files','monitor','music'],2:['skills','profile','notes'],3:['lab','game'],4:['resume','clock','settings']};
  const wsNames={pt:['dev','sobre','lab','cv'],en:['dev','about','lab','cv'],ja:['dev','自己紹介','ラボ','履歴書']};
  const zones=[['Aqui','local'],['São Paulo','America/Sao_Paulo'],['Tóquio','Asia/Tokyo']];
  const GAP=8,TAB=34,NARROW=640;
  const zoomDuration=2300;
  function command(raw){const value=String(raw||'').trim().slice(0,128);return {raw:value,name:value.toLowerCase()};}
  function slug(text){return String(text||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  function clock(ms){const s=Math.max(0,Math.floor(ms/1000)),p=n=>String(n).padStart(2,'0');return p(Math.floor(s/3600))+':'+p(Math.floor(s/60)%60)+':'+p(s%60);}

  // ---- the tiling tree: a leaf holds an app, a node splits its rect horizontally (h) or vertically (v) ----
  function leaves(t){return !t?[]:t.app?[t.app]:[...leaves(t.a),...leaves(t.b)];}
  function layout(t,rect,gap=GAP){
    const rects={},gutters=[];
    const walk=(n,r,path)=>{
      if(!n)return;
      if(n.app){rects[n.app]={x:r.x,y:r.y,w:Math.max(0,r.w),h:Math.max(0,r.h)};return;}
      const h=n.split==='h',span=h?r.w:r.h,first=Math.round((span-gap)*n.ratio);
      walk(n.a,h?{x:r.x,y:r.y,w:first,h:r.h}:{x:r.x,y:r.y,w:r.w,h:first},path+'a');
      walk(n.b,h?{x:r.x+first+gap,y:r.y,w:span-gap-first,h:r.h}:{x:r.x,y:r.y+first+gap,w:r.w,h:span-gap-first},path+'b');
      gutters.push({path,split:n.split,ratio:n.ratio,x:h?r.x+first:r.x,y:h?r.y:r.y+first,w:h?gap:r.w,h:h?r.h:gap,start:h?r.x:r.y,span});
    };
    walk(t,rect,'');
    return {rects,gutters};
  }
  // The new app takes the second half of the target's tile, split along its longer side.
  function insert(t,target,app,rect){
    if(!t)return {app};
    const r=rect||{w:2,h:1},split=r.w>=r.h?'h':'v';
    if(!leaves(t).includes(target))return {split,ratio:.5,a:t,b:{app}};
    const rep=n=>n.app?(n.app===target?{split,ratio:.5,a:n,b:{app}}:n):{...n,a:rep(n.a),b:rep(n.b)};
    return rep(t);
  }
  function remove(t,app){
    if(!t)return null;if(t.app)return t.app===app?null:t;
    const a=remove(t.a,app),b=remove(t.b,app);
    if(!a)return b;if(!b)return a;
    return a===t.a&&b===t.b?t:{...t,a,b};
  }
  function swap(t,x,y){if(!t)return t;if(t.app)return t.app===x?{app:y}:t.app===y?{app:x}:t;return {...t,a:swap(t.a,x,y),b:swap(t.b,x,y)};}
  function setRatio(t,path,ratio){
    if(!t||t.app)return t;
    if(!path)return {...t,ratio:Math.max(.15,Math.min(.85,ratio))};
    return path[0]==='a'?{...t,a:setRatio(t.a,path.slice(1),ratio)}:{...t,b:setRatio(t.b,path.slice(1),ratio)};
  }
  function nodeAt(t,path){let n=t;for(const step of path||''){if(!n||n.app)return null;n=n[step];}return n;}
  // The closest tile on that side (l, r, u, d), preferring tiles that share an edge span.
  function neighbor(rects,app,dir){
    const r=rects[app];if(!r)return null;
    let best=null,score=Infinity;
    for(const [id,o] of Object.entries(rects)){
      if(id===app)continue;
      const side=dir==='l'?o.x+o.w<=r.x+1:dir==='r'?o.x>=r.x+r.w-1:dir==='u'?o.y+o.h<=r.y+1:o.y>=r.y+r.h-1;
      if(!side)continue;
      const across=dir==='l'||dir==='r'?Math.min(r.y+r.h,o.y+o.h)-Math.max(r.y,o.y):Math.min(r.x+r.w,o.x+o.w)-Math.max(r.x,o.x);
      const d=Math.abs(o.x+o.w/2-(r.x+r.w/2))+Math.abs(o.y+o.h/2-(r.y+r.h/2))-(across>0?1e5:0);
      if(d<score){score=d;best=id;}
    }
    return best;
  }
  const tile={leaves,layout,insert,remove,swap,setRatio,nodeAt,neighbor};

  // ---- wallpaper: São Paulo at night in pixel art, drawn once at 320×180 and scaled without smoothing ----
  function rng(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
  function paintSkyline(ctx,w=320,h=180){
    const R=rng(23111),px=(x,y,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,1,1);},rect=(x,y,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,ww,hh);};
    const sky=['#050806','#070b08','#0A0F0B','#0c120e','#0D130F','#101812','#131B15','#172117','#1c231f','#232c22'];
    const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
    for(let y=0;y<h;y++){
      const f=Math.min(sky.length-1.001,Math.pow(y/150,1.6)*(sky.length-1)),i=Math.floor(f),frac=f-i;
      for(let x=0;x<w;x++)px(x,y,frac*16>bayer[(y%4)*4+x%4]?sky[i+1]:sky[i]);
    }
    for(let i=0;i<90;i++){const x=Math.floor(R()*w),y=Math.floor(R()*96),k=R();px(x,y,k<.7?'#7f8a7c':k<.9?'#E8E4D4':'#A9CDEA');}
    // full moon over the Paulista towers
    const mx=272,my=28;
    for(let y=-9;y<=9;y++)for(let x=-9;x<=9;x++){const d=x*x+y*y;if(d<=72)px(mx+x,my+y,'#F0CE6A');else if(d<=110&&(x+y)%2===0)px(mx+x,my+y,'#2a2716');}
    for(const [x,y,r] of [[-3,-2,2],[3,2,1],[-1,4,1],[4,-4,1]])for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(i*i+j*j<=r*r)px(mx+x+i,my+y+j,'#D8B24A');
    const lights=[],warm=['#D8B24A','#D8B24A','#D8B24A','#F0CE6A','#8FD3A6','#A9CDEA'];
    const windows=(x,y,ww,hh,density,step=2)=>{for(let j=y+2;j<y+hh-1;j+=step)for(let i=x+1;i<x+ww-1;i+=2)if(R()<density)px(i,j,warm[Math.floor(R()*warm.length)]);};
    // far city
    for(let x=-4;x<w;){const ww=6+Math.floor(R()*14),hh=18+Math.floor(R()*40);rect(x,150-hh,ww,hh+30,'#0D130F');for(let j=150-hh+3;j<150;j+=3)for(let i=x+1;i<x+ww-1;i+=3)if(R()<.18)px(i,j,'#2f4136');x+=ww+1;}
    // Edifício Altino Arantes (Farol Santander): stepped tower and mast
    const ax=58,base='#070a08';
    rect(ax,96,26,90,base);rect(ax+4,84,18,12,base);rect(ax+7,74,12,10,base);rect(ax+9,66,8,8,base);rect(ax+12,50,2,16,base);
    windows(ax,96,26,60,.45);windows(ax+4,84,18,12,.4);lights.push([ax+12,49]);
    // Edifício Itália: the tall slab
    const ix=104;rect(ix,64,24,120,base);rect(ix+3,60,18,4,base);windows(ix,64,24,90,.38);lights.push([ix+3,59],[ix+20,59]);
    // Copan: the long wave, horizontal brise-soleil on every floor
    const cx=140;
    for(let x=0;x<64;x++){const top=104+Math.round(3*Math.sin(x/64*Math.PI*2)),shade=x>20&&x<44?'#0b100c':'#0e1510';rect(cx+x,top,1,80,base);for(let y=top+2;y<150;y+=2)px(cx+x,y,(y+x)%7===0&&R()<.5?warm[Math.floor(R()*3)]:shade);}
    // TV towers on Avenida Paulista: lattice masts with aviation lights
    for(const tx of [226,252]){
      for(let y=38;y<150;y++){const half=Math.max(1,Math.round((y-38)/16));px(tx-half,y,base);px(tx+half,y,base);if(y%4===0)for(let i=-half;i<=half;i++)px(tx+i,y,base);else if(y%4===2)px(tx,y,base);}
      lights.push([tx,37],[tx,80]);
    }
    rect(200,118,20,70,base);windows(200,118,20,40,.3);rect(284,110,28,80,base);windows(284,110,28,40,.34);rect(14,120,30,70,base);windows(14,120,30,40,.3);
    // near city and the street glow
    for(let x=-2;x<w;){const ww=8+Math.floor(R()*16),hh=10+Math.floor(R()*26);rect(x,h-hh,ww,hh,'#050706');windows(x,h-hh,ww,hh,.28);x+=ww+1;}
    for(let x=0;x<w;x++){px(x,h-2,x%3?'#3a2a0c':'#5a4214');if(x%5===0)px(x,h-3,'#2a1f0a');}
    return lights;
  }
  function paintLights(ctx,lights,on){for(const [x,y] of lights||[]){ctx.fillStyle=on?'#E04A3A':'#4a0e0a';ctx.fillRect(x,y,1,1);}}

  // Strong ease-in-out (cubic-bezier(.77,0,.175,1)), solved for x so it can be sampled into keyframes.
  function bezier(x1,y1,x2,y2){
    const at=(a,b,t)=>((1-3*b+3*a)*t+(3*b-6*a))*t*t+3*a*t;
    return x=>{if(x<=0||x>=1)return Math.max(0,Math.min(1,x));let lo=0,hi=1,t=x;for(let i=0;i<24;i++){const v=at(x1,x2,t);if(Math.abs(v-x)<1e-6)break;if(v<x)lo=t;else hi=t;t=(lo+hi)/2;}return at(y1,y2,t);};
  }
  const easeInOut=bezier(.77,0,.175,1);
  function zoomGeometry(canvas,viewport,size,camera={}){
    if(!canvas||!viewport||!size||![canvas.left,canvas.top,canvas.width,canvas.height,viewport.left,viewport.top,viewport.width,viewport.height,size.width,size.height].every(Number.isFinite)||Math.min(canvas.width,canvas.height,viewport.width,viewport.height,size.width,size.height)<=0)return null;
    const sx=canvas.width/size.width,sy=canvas.height/size.height;
    // Monitor glass in the room atlas, in the coordinates used by rmDraw.
    const x=canvas.left-viewport.left+(338-(camera.camX||0))*sx,y=canvas.top-viewport.top+(21-(camera.camY||0))*sy;
    const scale=Math.max(viewport.width/(22*sx),viewport.height/(14*sy))*1.03;
    const margin=viewport.width<=760?6:16,w=Math.min(1800,viewport.width-margin*2),h=viewport.height-margin*2;
    const left=(viewport.width-w)/2,top=margin,screenLeft=x-11*sx,screenTop=y-7*sy,screenWidth=22*sx,screenHeight=14*sy;
    return {x:viewport.width/2-x*scale,y:viewport.height/2-y*scale,scale,left:canvas.left-viewport.left,top:canvas.top-viewport.top,width:canvas.width,height:canvas.height,
      fromX:screenLeft-left,fromY:screenTop-top,fromSX:screenWidth/w,fromSY:screenHeight/h,
      cameraX:left-screenLeft*w/screenWidth,cameraY:top-screenTop*h/screenHeight,cameraSX:w/screenWidth,cameraSY:h/screenHeight,shellLeft:left,shellTop:top};
  }
  // Entering the monitor: the camera scales in log space about its fixed point, so the push-in reads at a steady
  // rate instead of rushing through the first few multiples. The desktop is sampled from the same camera and
  // therefore stays exactly on the glass in every frame until the glass is the whole screen.
  function zoomFrames(z,steps=48){
    if(!z)return null;
    const camera=[],shell=[],fx=z.cameraX/(1-z.cameraSX),fy=z.cameraY/(1-z.cameraSY);
    for(let i=0;i<=steps;i++){
      const offset=i/steps,q=easeInOut(offset),sx=Math.pow(z.cameraSX,q),sy=Math.pow(z.cameraSY,q),tx=fx*(1-sx),ty=fy*(1-sy);
      const gx=tx+sx*(z.shellLeft+z.fromX),gy=ty+sy*(z.shellTop+z.fromY);
      camera.push({offset,transform:"translate("+tx+"px,"+ty+"px) scale("+sx+","+sy+")"});
      shell.push({offset,transform:"translate("+(gx-z.shellLeft)+"px,"+(gy-z.shellTop)+"px) scale("+z.fromSX*sx+","+z.fromSY*sy+")"});
    }
    return {camera,shell};
  }
  // The player: the room's three tracks, the title theme and the language screen's three grooves (copies, so the
  // title and language screens never mistake them for their own music and stop them).
  const playlist=[
    {name:'Press Start',from:'Quarto',room:0},{name:'Bancada',from:'Quarto',room:1},{name:'Madrugada',from:'Quarto',room:2},
    {name:'Tela de título',from:'Tela de título',make:()=>g.PortfolioTitleSound?.titleTrack()},
    {name:'Samba',from:'Tela de idioma · Português',make:()=>g.PortfolioTitleSound?.languageTrack('pt')},
    {name:'Rock',from:'Tela de idioma · English',make:()=>g.PortfolioTitleSound?.languageTrack('en')},
    {name:'Matsuri',from:'Tela de idioma · 日本語',make:()=>g.PortfolioTitleSound?.languageTrack('ja')}
  ];
  const vizBars=24;

  g.PortfolioDesktop={apps,system,profile,notes,playlist,workspaces,tile,command,zoomGeometry,zoomFrames,zoomDuration,paintSkyline,install(C){
    const p=C.prototype;
    const wrap=(name,fn)=>{const prior=p[name];p[name]=function(...args){return fn.call(this,prior.bind(this),...args);};};
    const I=()=>g.PortfolioI18n;
    const label=id=>(apps.find(a=>a[0]===id)||[])[2]||id;
    wrap('data',function(fn){const d=fn();if(!d.desktopEnhanced){d.desktopEnhanced=true;for(const id of ['pc','cadeira']){const o=d.room.find(o=>o.id===id);if(o)o.acts=[['Sentar e usar o computador','pcgame']];}}return d;});

    // ---- entry: sit, push into the glass, lock screen ----
    p.desktopStopBeat=function(){
      for(const node of this._deBeatNodes||[]){try{node.stop();node.disconnect();}catch{}}
      this._deBeatBus?.disconnect();this._deBeatNodes=[];this._deBeatBus=null;
    };
    p.desktopBeat=function(){
      this.desktopStopBeat();if(!this._snd||document.hidden)return;
      try{
        const ac=this.audio();if(!ac||ac.state!=='running'||!this._mix)return;
        const bus=ac.createGain();bus.gain.value=.6;bus.connect(this._mix);this._deBeatBus=bus;
        const note=(f,at,dur,type,volume,end)=>{
          const o=ac.createOscillator(),gain=ac.createGain(),t=ac.currentTime+at;
          o.type=type;o.frequency.setValueAtTime(f,t);if(end)o.frequency.exponentialRampToValueAtTime(end,t+dur);
          gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
          o.connect(gain);gain.connect(bus);o.start(t);o.stop(t+dur+.03);this._deBeatNodes.push(o);
        };
        for(let i=0;i<4;i++){
          const t=i*.54;note(108,t,.2,'sine',.12,38);note([130.81,164.81,196,164.81][i],t+.08,.43,'triangle',.035);
          note(3200,t+.27,.055,'triangle',.014,1900);
          if(i%2)note(170,t+.02,.12,'triangle',.045,90);
        }
      }catch{this.desktopStopBeat();}
    };
    p.desktopClearEntry=function(){clearTimeout(this._deEntryT);this._deEntryT=null;clearTimeout(this._deLockT);this._deLockT=null;for(const t of this._deRestoreT||[])clearTimeout(t);this._deRestoreT=[];this.desktopStopBeat();this.desktopZoomStop();this._deZoom=null;};
    p.desktopZoomStart=function(){
      if(this._deAnims||this.st().dePhase!=="zoom"||this.desktopReduced())return;
      const frames=zoomFrames(this._deZoom),camera=this._deCamera,shell=this._deSurface;
      if(!frames||!camera?.animate||!shell?.animate)return;
      this._deAnims=[camera.animate(frames.camera,{duration:zoomDuration,fill:"both"}),shell.animate(frames.shell,{duration:zoomDuration,fill:"both"})];
    };
    p.desktopZoomStop=function(){for(const a of this._deAnims||[])a.cancel();this._deAnims=null;};
    p.desktopGeometry=function(){return zoomGeometry(this._rmCv?.getBoundingClientRect?.(),this._rootEl?.getBoundingClientRect?.(),this._rmCv,this._rm||{});};
    // Follows the portfolio Movimento setting (pause menu), like the rest of the room.
    p.desktopReduced=function(){return this.calm();};
    p.desktopGeometryStyle=function(){const z=this._deZoom;return z?'--de-from-x:'+z.fromX+'px;--de-from-y:'+z.fromY+'px;--de-from-sx:'+z.fromSX+';--de-from-sy:'+z.fromSY+';--de-camera-x:'+z.cameraX+'px;--de-camera-y:'+z.cameraY+'px;--de-camera-sx:'+z.cameraSX+';--de-camera-sy:'+z.cameraSY:'';};
    p.desktopBegin=function(phase){
      this.desktopClearEntry();this._desktopSession=true;this._deZoom=this.desktopGeometry();this._deFocus='shell';this._deBorn={};
      this.setState({deOpen:true,dePhase:phase,deView:'home',deWindows:[],deOrder:[],deMinimized:[],deTrees:{},deWsOf:{},deSeen:[],deWs:1,deFull:null,deLocked:false,deLockDots:0,deLauncher:false,
        deFiles:{place:'projects',folder:null,sel:'p0'},deResumeLocale:null,rmDlg:false,pcOpen:false,paused:false,palOpen:false});
    };
    wrap('pcSit',function(fn){
      if(this.curPage()!=='quarto'||this._desktopSession)return;
      fn();this.desktopBegin('seated');
    });
    // Keep the live desktop on the glass while the room camera follows the seating hop.
    wrap('rmDraw',function(fn,...args){const r=fn(...args);if(this.st().dePhase==='seated'){
      this._deZoom=this.desktopGeometry();if(this._deSurface)this._deSurface.style.cssText=this.desktopGeometryStyle();
    }return r;});
    // The same mounted desktop surface expands from the monitor after the seating animation.
    p.openPc=function(){
      if(this.curPage()!=='quarto'||(this._desktopSession&&this.st().dePhase!=='seated'))return;
      if(!this._desktopSession)this.desktopBegin('seated');
      this._deZoom=this.desktopGeometry();this.setState({dePhase:'zoom'});
      this.desktopBeat();this.unlock('desktop-login');
      this._deEntryT=setTimeout(()=>this.desktopReady(),this.desktopReduced()?160:zoomDuration);
    };
    // The glass is now the whole screen and shows the lock screen; the password types itself.
    p.desktopReady=function(){
      if(!this._desktopSession||this._dead||this.curPage()!=='quarto'||this.st().dePhase!=='zoom')return;
      this.desktopClearEntry();this._deFocus='lock';this.setState({dePhase:'ready',deLocked:true,deLockDots:0});
      this.desktopLockType();
    };
    p.desktopLockType=function(){
      clearTimeout(this._deLockT);
      const calm=this.desktopReduced(),step=()=>{
        if(!this._desktopSession||!this.st().deLocked)return;
        const n=calm?8:(this.st().deLockDots||0)+1;this.setState({deLockDots:n});
        if(n>=8)this._deLockT=setTimeout(()=>this.desktopUnlock(),calm?260:420);
        else{this.tone?.(1200+n*40,.018,'square',.008);this._deLockT=setTimeout(step,70+Math.round(Math.random()*60));}
      };
      this._deLockT=setTimeout(step,calm?240:820);
    };
    p.desktopLock=function(){
      if(!this._desktopSession||this.st().dePhase!=='ready')return;
      this.desktopEndDrag();this._deFocus='lock';this.setState({deLocked:true,deLockDots:0,deLauncher:false});this.desktopLockType();
    };
    // Unlocking restores the dev workspace one tile at a time (the split is the signature move).
    p.desktopUnlock=function(restore=true){
      const s=this.st();if(!this._desktopSession||s.dePhase!=='ready'||!s.deLocked)return;
      clearTimeout(this._deLockT);this._deLockT=null;
      try{this.tone?.(659,.09,'triangle',.05);this.tone?.(988,.16,'triangle',.04,.08);}catch{}
      this.setState({deLocked:false,deLockDots:8});this._deFocus='dock';
      if(restore&&!(this.st().deWindows||[]).length)this.desktopPopulate(1,true);
    };
    // A first visit opens the area's set, leaving apps the visitor already placed elsewhere where they are.
    // Restoring (all=true) brings the whole set here: closed apps open, minimized ones come back and apps sitting
    // on another area move over, like i3's "move to workspace".
    p.desktopPopulate=function(ws,stagger=false,all=false){
      const seen=[...new Set([...(this.st().deSeen||[]),ws])];this.setState({deSeen:seen});this._dePopAt=Date.now();
      if(all){
        const s=this.st(),trees={...s.deTrees};
        for(const id of workspaces[ws]||[]){const from=s.deWsOf?.[id];if(from&&from!==ws)trees[from]=remove(trees[from],id);}
        this.setState({deTrees:trees,deFull:null});
      }
      const here=leaves(this.desktopTree(ws)),list=(workspaces[ws]||[]).filter(id=>all?!here.includes(id):!(this.st().deWindows||[]).includes(id));
      if(ws===1&&list.includes('terminal')&&!(this.st().deLog||[]).length)this.setState({deLog:[{id:1,cmd:'neofetch',lines:this.desktopRun('neofetch',[],false).lines}],deOutput:help});
      const calm=this.desktopReduced()||!stagger,live=()=>this._desktopSession&&!this.st().deLocked&&this.st().deWs===ws;
      // The first app of the set (the terminal on dev) takes the focus once every tile is in place.
      const steps=[...list.map(id=>()=>{if(live())this.desktopOpen(id,ws,false);}),()=>{if(live()&&list.length)this.desktopRaise(list[0],true);}];
      this._deRestoreT=this._deRestoreT||[];
      steps.forEach((step,i)=>{if(calm)step();else this._deRestoreT.push(setTimeout(step,120+i*170));});
    };
    p.desktopRestore=function(ws=this.st().deWs||1){
      const s=this.st();if(!this._desktopSession||s.dePhase!=='ready'||!workspaces[ws])return;
      if(s.deLocked)this.desktopUnlock(false);
      this.sfx('select');this.setState({deLauncher:false});this.desktopPopulate(ws,true,true);
    };

    // ---- window management ----
    p.desktopSize=function(){const r=this._deWorkspace?.getBoundingClientRect?.();return {width:r?.width||1000,height:r?.height||650};};
    p.desktopArea=function(){
      const {width,height}=this.desktopSize(),narrow=width<NARROW;
      return {narrow,rect:{x:GAP,y:GAP+(narrow?TAB:0),w:Math.max(1,width-2*GAP),h:Math.max(1,height-2*GAP-(narrow?TAB:0))}};
    };
    p.desktopTree=function(ws=this.st().deWs||1){return (this.st().deTrees||{})[ws]||null;};
    p.desktopLayout=function(ws=this.st().deWs||1,tree=this.desktopTree(ws)){const area=this.desktopArea();return {...area,...layout(tree,area.rect)};};
    p.desktopVisible=function(id){const s=this.st();return (s.deWindows||[]).includes(id)&&leaves(this.desktopTree()).includes(id);};
    // Opens or restores an app as a tile of that workspace, splitting the focused tile.
    p.desktopOpen=function(id,ws=this.st().deWs||1,focus=true){
      const s=this.st(),windows=s.deWindows||[],tree=this.desktopTree(ws);
      if(leaves(tree).includes(id))return;
      const {rect,rects}=this.desktopLayout(ws,tree),here=leaves(tree),target=here.includes(s.deView)?s.deView:here.at(-1),box=rects[target]||rect;
      const next=insert(tree,target,id,box);
      this._deBorn=this._deBorn||{};this._deBorn[id]={t:Date.now(),axis:!tree?'':box.w>=box.h?'h':'v'};
      if(id==='game'&&!this._pc)this._pc=this.pcNew();
      const state={deTrees:{...s.deTrees,[ws]:next},deWsOf:{...s.deWsOf,[id]:ws},deWindows:windows.includes(id)?windows:[...windows,id],deMinimized:(s.deMinimized||[]).filter(k=>k!==id),deFull:null};
      if(focus){this.desktopReleaseGame();this._deFocus=id;Object.assign(state,{deView:id,deOrder:[...(s.deOrder||[]).filter(k=>k!==id),id],pcOpen:id==='game'});}
      else state.deOrder=[...(s.deOrder||[]).filter(k=>k!==id),id];
      this.setState(state);
      if(id==='terminal'&&this.st().deOutput===undefined)this.setState({deOutput:help});
      if(id==='resume')this.unlock('desktop-resume');
      this.startLoop();
    };
    p.desktopApp=function(id){
      const s0=this.st();
      if(!this._desktopSession||s0.dePhase!=='ready'||!apps.some(a=>a[0]===id))return;
      if(s0.deLocked)this.desktopUnlock(false);
      this.sfx('select');
      const s=this.st();
      if(s.deView===id&&this.desktopVisible(id)){this.desktopMinimize(id);return;}
      if(s.deLauncher)this.setState({deLauncher:false});
      const ws=s.deWsOf?.[id];
      if((s.deWindows||[]).includes(id)&&!(s.deMinimized||[]).includes(id)&&ws&&leaves(this.desktopTree(ws)).includes(id)){
        if(ws!==s.deWs)this.desktopWorkspace(ws,false);
        this.desktopRaise(id,true);return;
      }
      this.desktopOpen(id);
    };
    p.desktopNextFocus=function(ws,minimized,skip){
      const s=this.st(),here=leaves((s.deTrees||{})[ws]);
      return (s.deOrder||[]).filter(k=>k!==skip&&here.includes(k)&&!minimized.includes(k)).at(-1)||here.find(k=>k!==skip)||'home';
    };
    p.desktopWindowClose=function(id=this.st().deView){
      this.desktopEndDrag();
      const s=this.st(),ws=s.deWsOf?.[id]||s.deWs||1,trees={...s.deTrees,[ws]:remove((s.deTrees||{})[ws],id)},wsOf={...s.deWsOf};delete wsOf[id];
      if(id==='game'){this._pc=null;this._pcCv=null;this._pcWrap=null;this.persistSoon();}
      const order=(s.deOrder||[]).filter(k=>k!==id),minimized=(s.deMinimized||[]).filter(k=>k!==id);
      this.setState({deTrees:trees,deWsOf:wsOf,deWindows:(s.deWindows||[]).filter(k=>k!==id),deOrder:order,deMinimized:minimized,deFull:s.deFull===id?null:s.deFull});
      if(s.deView===id){const view=this.desktopNextFocus(s.deWs||1,minimized,id);this.desktopReleaseGame();this._deFocus=view==='home'?'dock':view;this.setState({deView:view,pcOpen:view==='game'});}
    };
    // Minimized windows leave the mosaic but keep their state, like i3's scratchpad.
    p.desktopMinimize=function(id=this.st().deView){
      const s=this.st();if(!(s.deWindows||[]).includes(id)||(s.deMinimized||[]).includes(id))return;
      this.desktopEndDrag();const ws=s.deWsOf?.[id]||s.deWs||1,minimized=[...(s.deMinimized||[]),id];
      this.setState({deTrees:{...s.deTrees,[ws]:remove((s.deTrees||{})[ws],id)},deMinimized:minimized,deFull:s.deFull===id?null:s.deFull});
      if(s.deView===id){const view=this.desktopNextFocus(s.deWs||1,minimized,id);this.desktopReleaseGame();this._deFocus=view==='home'?'dock':view;this.setState({deView:view,pcOpen:view==='game'});}
    };
    p.desktopRaise=function(id,focus=false){
      const s=this.st();if(!(s.deWindows||[]).includes(id)||s.dePhase!=='ready'||s.deLocked)return;
      if(s.deView===id)return;
      this.desktopReleaseGame();if(focus)this._deFocus=id;
      this.setState({deOrder:[...(s.deOrder||[]).filter(k=>k!==id),id],deView:id,pcOpen:id==='game'});
    };
    p.desktopWorkspace=function(n,populate=true){
      const s=this.st();if(!this._desktopSession||s.dePhase!=='ready'||!workspaces[n])return;
      if(s.deLocked)this.desktopUnlock(false);
      this.desktopEndDrag();
      if(n!==s.deWs){this._deWsDir=n>(s.deWs||1)?1:-1;this.sfx('blip');}
      const minimized=s.deMinimized||[],view=this.desktopNextFocus(n,minimized);
      this.desktopReleaseGame();this._deFocus=view==='home'?'dock':view;
      this.setState({deWs:n,deView:view,deFull:null,deLauncher:false,pcOpen:view==='game'});
      if(populate&&!(this.st().deSeen||[]).includes(n))this.desktopPopulate(n,true);
    };
    p.desktopFull=function(id=this.st().deView){
      const s=this.st();if(!this.desktopVisible(id))return;
      this.desktopRaise(id,true);this.setState({deFull:s.deFull===id?null:id});
    };
    p.desktopFocusDir=function(dir){
      const s=this.st(),{rects}=this.desktopLayout(),id=neighbor(rects,s.deView,dir);
      if(id)this.desktopRaise(id,true);
    };
    p.desktopMove=function(id,dir){
      const s=this.st(),ws=s.deWs||1,{rects}=this.desktopLayout(),other=neighbor(rects,id,dir);
      if(!other)return;
      this._deFocus=id;this.setState({deTrees:{...s.deTrees,[ws]:swap(this.desktopTree(ws),id,other)},deView:id});
    };
    p.desktopSwap=function(a,b){
      const s=this.st(),ws=s.deWs||1,tree=this.desktopTree(ws),here=leaves(tree);
      if(a===b||!here.includes(a)||!here.includes(b))return;
      this.sfx('blip');this.setState({deTrees:{...s.deTrees,[ws]:swap(tree,a,b)}});
    };
    p.desktopRatio=function(path,ratio){
      const s=this.st(),ws=s.deWs||1,tree=this.desktopTree(ws);
      if(!nodeAt(tree,path)||nodeAt(tree,path).app)return;
      this.setState({deTrees:{...s.deTrees,[ws]:setRatio(tree,path,ratio)}});
    };
    p.desktopReleaseGame=function(){if(this._pc){this._pc.keys={};this._pc.duck=false;}this._pcPtr=false;};
    p.desktopFit=function(){this.desktopEndDrag();const {width,height}=this.desktopSize();this.setState({deSize:width+'x'+height});};
    p.desktopSetWorkspace=function(el){
      if(el===this._deWorkspace)return;this._deResize?.disconnect();this._deWorkspace=el;
      if(el&&g.ResizeObserver){this._deResize=new g.ResizeObserver(()=>{if(this.st().dePhase==='ready')this.desktopFit();});this._deResize.observe(el);}
    };
    // Gutter drags paint straight to the DOM and commit once on release, so the whole app does not re-render per move.
    p.desktopPaint=function(tree){
      const root=this._deWorkspace;if(!root?.querySelector)return;
      const {rects,gutters}=layout(tree,this.desktopArea().rect);
      for(const [id,r] of Object.entries(rects)){const node=root.querySelector('.desktop-window[data-app="'+id+'"]');if(node)Object.assign(node.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});}
      for(const gu of gutters){const node=root.querySelector('.desktop-gutter[data-path="'+gu.path+'"]');if(node)Object.assign(node.style,{left:gu.x+'px',top:gu.y+'px',width:gu.w+'px',height:gu.h+'px'});}
    };
    p.desktopGutterStart=function(path,e){
      const s=this.st();if(s.dePhase!=='ready'||(e.button!==undefined&&e.button!==0))return;
      const gu=this.desktopLayout().gutters.find(x=>x.path===path);if(!gu)return;
      e.preventDefault();this.desktopEndDrag();const el=e.currentTarget;
      this._deDrag={path,pointer:e.pointerId,el,gutter:gu,tree:this.desktopTree(),next:this.desktopTree()};
      this._deWorkspace?.setAttribute?.('data-dragging','true');el?.setPointerCapture?.(e.pointerId);
    };
    p.desktopGutterMove=function(e){
      const d=this._deDrag;if(!d||!d.gutter||e.pointerId!==d.pointer)return;
      e.preventDefault();const gu=d.gutter,root=this._deWorkspace?.getBoundingClientRect?.()||{left:0,top:0};
      const at=(gu.split==='h'?e.clientX-root.left:e.clientY-root.top)-gu.start;
      d.next=setRatio(d.tree,d.path,at/Math.max(1,gu.span-GAP));this.desktopPaint(d.next);
    };
    p.desktopTitleStart=function(id,e){
      if(this.st().dePhase!=='ready'||(e.button!==undefined&&e.button!==0)||e.target?.closest?.('button,input,a'))return;
      this.desktopEndDrag();this.desktopRaise(id);const el=e.currentTarget;
      this._deDrag={swap:id,pointer:e.pointerId,el,node:el?.closest?.('.desktop-window'),startX:e.clientX,startY:e.clientY,moved:false,target:null};
      el?.setPointerCapture?.(e.pointerId);
    };
    p.desktopTitleMove=function(e){
      const d=this._deDrag;if(!d||!d.swap||e.pointerId!==d.pointer)return;
      if(!d.moved&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<6)return;
      if(!d.moved){d.moved=true;d.node?.setAttribute?.('data-lifted','true');this._deWorkspace?.setAttribute?.('data-dragging','swap');}
      const over=g.document?.elementFromPoint?.(e.clientX,e.clientY)?.closest?.('.desktop-window'),id=over?.getAttribute?.('data-app');
      const target=id&&id!==d.swap?id:null;
      if(target!==d.target){d.targetNode?.removeAttribute?.('data-drop');d.target=target;d.targetNode=target?over:null;d.targetNode?.setAttribute?.('data-drop','true');}
    };
    p.desktopEndDrag=function(e){
      const d=this._deDrag;if(!d||(e&&e.pointerId!==d.pointer))return;
      this._deDrag=null;this._deWorkspace?.removeAttribute?.('data-dragging');
      if(d.el?.hasPointerCapture?.(d.pointer))d.el.releasePointerCapture(d.pointer);
      d.node?.removeAttribute?.('data-lifted');d.targetNode?.removeAttribute?.('data-drop');
      if(this._dead||!e)return;
      if(d.gutter&&d.next!==d.tree){const s=this.st();this.setState({deTrees:{...s.deTrees,[s.deWs||1]:d.next}});}
      if(d.swap&&d.moved&&d.target)this.desktopSwap(d.swap,d.target);
    };
    p.desktopGutterKey=function(path,e){
      const step={ArrowLeft:-.05,ArrowUp:-.05,ArrowRight:.05,ArrowDown:.05}[e.key];if(!step)return;
      const n=nodeAt(this.desktopTree(),path);if(!n||n.app)return;
      e.preventDefault();e.stopPropagation?.();this.desktopRatio(path,n.ratio+step);
    };
    p.desktopTitleKey=function(id,e){
      const dir={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d'}[e.key];
      if(dir){e.preventDefault();e.stopPropagation?.();this.desktopMove(id,dir);return;}
      if(e.key==='Enter'&&e.target===e.currentTarget){e.preventDefault();this.desktopFull(id);}
    };
    // i3-style bindings on Alt (the Super key belongs to the visitor's own system).
    p.desktopShortcut=function(e){
      const s=this.st();
      if(!s.deOpen||s.dePhase!=='ready'||!e.altKey||e.ctrlKey||e.metaKey)return false;
      const code=e.code||'',key=(e.key||'').toLowerCase(),dir={KeyH:'l',KeyJ:'d',KeyK:'u',KeyL:'r'}[code];
      let done=true;
      if(code==='Enter'||key==='enter')this.desktopApp('terminal');
      else if(/^Digit[1-4]$/.test(code))this.desktopWorkspace(Number(code.slice(5)));
      else if(code==='KeyP')this.desktopLauncher(!s.deLauncher);
      else if(code==='KeyM')this.desktopFull();
      else if(code==='KeyQ'&&e.shiftKey)this.desktopWindowClose();
      else if(dir&&e.shiftKey)this.desktopMove(s.deView,dir);
      else if(dir)this.desktopFocusDir(dir);
      else done=false;
      if(done){e.preventDefault?.();e.stopPropagation?.();}
      return done;
    };
    p.desktopLauncher=function(open=true){
      const s=this.st();if(!this._desktopSession||s.dePhase!=='ready')return;
      if(s.deLocked)this.desktopUnlock(false);
      if(open){this.sfx('blip');this._deFocus='launcher';}else this._deFocus=s.deView&&s.deView!=='home'?s.deView:'dock';
      this.setState({deLauncher:open,deLaunchQ:'',deLaunchSel:0});
    };
    p.desktopLaunchItems=function(){
      const q=slug(this.st().deLaunchQ||''),t=I().t,items=[
        ...apps.map(([id,desc,name])=>({id,name,desc,icon:icons[id],run:()=>this.desktopApp(id)})),
        {id:'lock',name:'Bloquear a tela',desc:'A senha se digita sozinha',icon:glyphs.lock,run:()=>this.desktopLock()},
        {id:'power',name:'Desligar o computador',desc:'Levantar da cadeira',icon:glyphs.power,run:()=>this.desktopClose()}
      ];
      // Names that start with the query come first, then names that contain it, then descriptions.
      const rank=x=>{const name=slug(t(x.name));return name.startsWith(q)||x.id.startsWith(q)?0:name.includes(q)?1:2;};
      return q?items.filter(x=>slug(t(x.name)+' '+t(x.desc)+' '+x.id).includes(q)).map((x,i)=>({x,i,r:rank(x)})).sort((a,b)=>a.r-b.r||a.i-b.i).map(o=>o.x):items;
    };
    p.desktopLaunch=function(index=this.st().deLaunchSel||0){
      const item=this.desktopLaunchItems()[index];if(!item)return;
      this.setState({deLauncher:false});item.run();
    };

    // ---- terminal ----
    p.desktopRun=function(name,args,typed=true){
      const t=I().t,s=this.st(),out=[];const line=(x)=>out.push(x);
      const id=aliases[name]||name;
      if(id==='help')helpLines.forEach(([c,v])=>line({cmd:c,v}));
      else if(id==='neofetch'){
        const now=Date.now(),born=g.performance?.timeOrigin||now;
        line({fetch:true,info:[{head:'okaru@okaru-pc'},{rule:'──────────────'},...system.map(t=>({t})),
          {k:'Resolução',v:Math.round(g.innerWidth||0)+'×'+Math.round(g.innerHeight||0)},{k:'Tempo ligado',v:clock(now-born)},{k:'Núcleos',v:String(g.navigator?.hardwareConcurrency||'—')},{swatches:true}]});
        if(typed)this.unlock('fetch-yourself');
      }
      else if(id==='whoami')profile.forEach(t=>line({t}));
      else if(id==='ls'){
        const dir=(args[0]||'').replace(/\/$/,'');
        if(!dir||dir==='~'||dir==='.')line({files:['projects/','resumes/','README.md','notes.txt']});
        else if(dir==='projects'||dir==='projetos')line({files:this.data().projects.map(p=>slug(p.title)+'/')});
        else if(dir==='resumes')line({files:['hikaru-pt.pdf','hikaru-en.pdf','hikaru-ja.pdf']});
        else line({t:'Pasta não encontrada:',raw:dir});
      }
      else if(id==='cat'){
        const file=(args[0]||'').toLowerCase();
        if(file==='readme.md'){line({t:'Hikaru Ogasawara · 小笠原 光'});line({t:'Estudo Engenharia da Computação no Ibmec e já entreguei projetos para a Invivio Tecnologia, a CPTM e o próprio Ibmec, do firmware ao dashboard.'});}
        else if(file==='notes.txt')notes.forEach(n=>line({t:n.t}));
        else line({t:'Arquivo não encontrado:',raw:args[0]||''});
      }
      else if(id==='projects')this.data().projects.forEach(p=>line({k:p.title,v:p.line}));
      else if(id==='contact')links.forEach(([k,v])=>line({k,v}));
      else if(id==='open'){
        const want=slug(args.join(' ')),hit=apps.find(([key,,name])=>[key,name,I().tIn(name,'en'),I().tIn(name,'ja')].some(x=>slug(x)===want));
        if(hit){line({t:'Abrindo',app:hit[2]});this._deAfter=()=>this.desktopApp(hit[0]);}
        else line({t:'Aplicativo não encontrado:',raw:args.join(' ')});
      }
      else if(id==='btop'){line({t:'Monitor de processos'});this._deAfter=()=>this.desktopApp('monitor');}
      else if(id==='date')line({raw:new Date(s.now||Date.now()).toLocaleString({pt:'pt-BR',en:'en-US',ja:'ja-JP'}[I().locale])});
      else if(id==='lang'){
        const to=(args[0]||'').toLowerCase();
        if(['pt','en','ja'].includes(to)){line({t:{pt:'Idioma: Português',en:'Idioma: English',ja:'Idioma: 日本語'}[to]});this._deAfter=()=>this.chooseLanguage?.(to,false);}
        else line({t:'Use: lang pt, lang en ou lang ja'});
      }
      else if(id==='echo')line({raw:args.join(' ')});
      else if(id==='history')(s.deHistory||[]).forEach((c,i)=>line({raw:String(i+1).padStart(3)+'  '+c}));
      else if(id==='sudo')line({t:'okaru não está no arquivo sudoers. Este incidente será reportado.'});
      else line({t:'Comando não encontrado. Digite help.'});
      return {id,lines:out};
    };
    p.desktopCommand=function(){
      const input=command(this.st().deInput);
      if(!input.raw)return;
      const [name,...args]=input.raw.split(/\s+/),lower=name.toLowerCase(),id=aliases[lower]||lower,s=this.st();
      const history=[...(s.deHistory||[]),input.raw].slice(-50);
      if(id==='clear'){this.setState({deOutput:'',deInput:'',deLog:[],deHistory:history,deHistoryAt:null,deMonitor:false});return;}
      if(id==='exit'){this.setState({deInput:'',deHistory:history,deHistoryAt:null});this.desktopWindowClose('terminal');return;}
      this._deAfter=null;
      const result=commands.includes(id)||lower==='sudo'?this.desktopRun(lower==='sudo'?'sudo':lower,args):this.desktopRun('?',[]);
      const plain=l=>[l.head,l.cmd,l.t,l.k,l.v,l.raw,l.app,...(l.files||[])].filter(Boolean).join(' ');
      const text=result.lines.flatMap(l=>l.fetch?l.info.map(plain):[plain(l)]).filter(Boolean).join('\n');
      const log=[...(s.deLog||[]),{id:(s.deLog?.at(-1)?.id||0)+1,cmd:input.raw,lines:result.lines}].slice(-40);
      this.setState({deInput:'',deOutput:text,deLog:log,deHistory:history,deHistoryAt:null,deMonitor:id==='btop',deLastCommand:lower});
      const after=this._deAfter;this._deAfter=null;after?.();
    };
    p.desktopHistory=function(step){
      const s=this.st(),list=s.deHistory||[];if(!list.length)return;
      const at=Math.max(0,Math.min(list.length,(s.deHistoryAt??list.length)+step));
      this.setState({deHistoryAt:at,deInput:list[at]||''});
    };
    p.desktopComplete=function(){
      const value=(this.st().deInput||'').trim().toLowerCase();if(!value||/\s/.test(value))return;
      const pool=[...commands,...Object.keys(aliases)],hits=pool.filter(c=>c.startsWith(value));
      if(hits.length===1)this.setState({deInput:hits[0]+' '});
    };

    // ---- music ----
    p.desktopTrackObj=function(i){
      const item=playlist[i];if(!item)return null;
      if(item.room!==undefined)return this.tracks?.()[item.room]||null;
      this._deTracks=this._deTracks||{};
      if(!this._deTracks[i]){const tr=item.make?.();if(tr){const copy={...tr};delete copy.language;this._deTracks[i]=copy;}}
      return this._deTracks[i]||null;
    };
    p.desktopPlaying=function(){const i=this.st().deTrack;return Number.isInteger(i)&&!!this._mus&&!!this._mTrack&&this._mTrack===this.desktopTrackObj(i);};
    p.desktopPlay=function(i=this.st().deTrack??0){
      const item=playlist[i];if(!item)return;
      if(item.room!==undefined)this.setTrack(item.room);
      else{
        if(!this._snd){this._snd=true;this.setState({snd:true});}
        this.stopMusic();const ac=this.audio(),tr=this.desktopTrackObj(i);
        if(ac&&this._mix&&tr){
          try{const bus=ac.createGain();bus.gain.setValueAtTime(.0001,ac.currentTime);bus.gain.exponentialRampToValueAtTime(.8,ac.currentTime+.5);bus.connect(this._mix);
            this._mus=bus;this._mTrack=tr;this._mNext=ac.currentTime+.08;this._mStep=0;}catch{this._mus=null;this._mTrack=null;}
        }
        this._track=-1;this.setState({track:-1});this.startLoop();
      }
      this._deVizStep=-1;this.setState({deTrack:i});
    };
    p.desktopPause=function(){if(this.desktopPlaying()){this.setTrack(-1);this.setState({deTrack:this.st().deTrack});}};
    p.desktopSkip=function(step){const i=((this.st().deTrack??0)+step+playlist.length)%playlist.length;this.desktopPlay(i);};
    // The equalizer follows the sixteenth that is sounding now, like the language screen's.
    p.desktopVizFrame=function(){
      const el=this._deViz,tr=this._mTrack,ac=this._ac,live=!!(el?.isConnected&&tr&&this._mus&&ac&&this.desktopPlaying()&&!this.calm?.());
      if(el&&el.dataset.live!==(live?'1':'0'))el.dataset.live=live?'1':'0';
      if(!live)return;
      const now=g.performance?.now?.()??Date.now(),dt=Math.min(64,now-(this._deVizAt||now));this._deVizAt=now;
      const spb=60/tr.bpm/4,cur=((this._mStep-Math.ceil((this._mNext-ac.currentTime)/spb))%tr.len+tr.len)%tr.len;
      const bars=this._deVizBars||(this._deVizBars=[...el.querySelectorAll('.de-eq i')]),n=bars.length,lv=this._deVizLv||(this._deVizLv=new Array(n).fill(0));
      if(cur!==this._deVizStep){
        this._deVizStep=cur;
        const bump=(i,v)=>{for(let d=-2;d<=2;d++){const j=i+d;if(j>=0&&j<n)lv[j]=Math.min(1,Math.max(lv[j],v*(1-Math.abs(d)*.3)));}};
        for(const ev of tr.ev[cur]){
          if(ev.drum==='kick')bump(1,.95);else if(ev.drum==='snare')bump(Math.round(n*.45),.75);else if(ev.drum)bump(n-3,.4);
          else bump(Math.round(Math.max(0,Math.min(1,(ev.m-36)/48))*(n-1)),ev.vol>.03?1:.6);
        }
        const cells=this._deVizCells||(this._deVizCells=[...el.querySelectorAll('.de-step')]);
        cells.forEach((c,i)=>{const on=i===cur%16?'1':'0';if(c.dataset.on!==on)c.dataset.on=on;});
      }
      const fall=Math.exp(-dt/160);
      bars.forEach((bar,i)=>{lv[i]*=fall;const q=Math.round(lv[i]*8)/8;if(bar._q!==q){bar._q=q;bar.style.setProperty('--lv',String(q));}});
    };
    wrap('loopMusic',function(fn,...args){const r=fn(...args);if(this._desktopSession)this.desktopVizFrame();return r;});

    // ---- wallpaper ----
    p.desktopWall=function(el){
      if(el===this._deWallEl)return;this._deWallEl=el;
      const ctx=el?.getContext?.('2d');if(!ctx)return;
      el.width=320;el.height=180;ctx.imageSmoothingEnabled=false;this._deLights=paintSkyline(ctx);this._deWallCtx=ctx;paintLights(ctx,this._deLights,true);
    };
    p.desktopWallTick=function(){if(this._deWallCtx&&!this.calm())paintLights(this._deWallCtx,this._deLights,Math.floor(Date.now()/1000)%2===0);};

    p.desktopFocus=function(){
      if(!this._deFocus||!this._deShell)return;
      const id=this._deFocus;this._deFocus=null;
      const q=sel=>this._deShell.querySelector(sel);
      const target=id==='shell'?this._deShell:id==='lock'?q('.desktop-lock-go'):id==='dock'?q('.desktop-dock button'):id==='launcher'?q('.desktop-launcher input'):id==='terminal'?q('#desktop-command'):id==='game'?this._pcWrap:q('.desktop-window[data-app="'+id+'"] .desktop-title');
      target?.focus?.({preventScroll:true});
    };
    p.desktopDispose=function(){
      this.desktopEndDrag();this._deResize?.disconnect();this._deWorkspace=null;
      if(Number.isInteger(this.st().deTrack)&&playlist[this.st().deTrack]?.room===undefined&&this.desktopPlaying())this.stopMusic();
      this.desktopClearEntry();this._desktopSession=false;this._pc=null;this._pcCv=null;this._pcWrap=null;this._deFocus=null;
      clearTimeout(this._pcT);this.setState({deOpen:false,dePhase:'closed',deWindows:[],deOrder:[],deMinimized:[],deTrees:{},deWsOf:{},deSeen:[],deWs:1,deFull:null,deView:'home',deLocked:false,deLauncher:false,pcOpen:false});
    };
    p.desktopClose=function(){this.desktopDispose();this.pcStand(false);this.focusRoot();this.persistSoon();};
    p.desktopGameButton=function(e,key,down){
      if(!['Enter',' '].includes(e.key))return;
      e.preventDefault();e.stopPropagation();if(!down||!e.repeat)this.pcPress(key,down);
    };
    p.desktopNote=function(text){const value=String(text||'').slice(0,600);try{g.localStorage.setItem('okaru-os-note',value);}catch{/* Kept for this visit only. */}this.setState({deNote:value});};
    p.desktopNoteText=function(){const s=this.st();if(typeof s.deNote==='string')return s.deNote;try{return g.localStorage.getItem('okaru-os-note')||'';}catch{return '';}};

    wrap('componentDidUpdate',function(fn,...args){
      fn(...args);this.desktopZoomStart();this.desktopFocus();
      const s=this.st();
      if(s.deOpen&&s.now!==this._deNow){this._deNow=s.now;this.desktopWallTick();}
      if(s.deOpen&&s.deWs!==this._deWsPrev){
        const dir=this._deWsDir||0;this._deWsPrev=s.deWs;this._deWsDir=0;
        if(dir&&this._deTiles?.animate&&!this.calm())this._deTiles.animate([{transform:'translateX('+dir*40+'px)',opacity:0},{transform:'none',opacity:1}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)'});
      }
      const log=this._deLogEl,count=(s.deLog||[]).length;
      if(log&&count!==this._deLogCount){this._deLogCount=count;log.scrollTop=log.scrollHeight;}
    });
    wrap('componentDidMount',function(fn){
      fn();this._deBlur=()=>{this.desktopEndDrag();if(this._desktopSession){this.desktopStopBeat();this.desktopReleaseGame();if(this._pc)this._pc.paused=true;}};
      this._deVisibility=()=>{if(document.hidden)this._deBlur();};
      g.addEventListener?.('blur',this._deBlur);document.addEventListener('visibilitychange',this._deVisibility);
    });
    wrap('componentWillUnmount',function(fn){this.desktopEndDrag();this._deResize?.disconnect();this.desktopClearEntry();g.removeEventListener?.('blur',this._deBlur);document.removeEventListener('visibilitychange',this._deVisibility);this._deShell=null;this._desktopSession=false;return fn();});
    wrap('toggleSnd',function(fn){const r=fn();if(!this._snd)this.desktopStopBeat();return r;});
    wrap('closePc',function(fn){if(this._desktopSession){this.desktopWindowClose('game');return;}return fn();});
    // The game only runs while its tile has the focus: the keyboard belongs to whichever tile is focused.
    wrap('loopPc',function(fn,dt){if(this._desktopSession&&(!this.st().deOpen||this.st().deView!=='game'||!this.desktopVisible('game')||this.st().deLocked||document.hidden))return;return fn(dt);});
    wrap('go',function(fn,to,...rest){if(to!==this.curPage()&&this._desktopSession){this.desktopDispose();this.pcStand(true);}return fn(to,...rest);});
    wrap('reboot',function(fn,...args){if(this._desktopSession){this.desktopDispose();this.pcStand(true);}return fn(...args);});
    wrap('wipeProgress',function(fn,...args){this.desktopDispose();return fn(...args);});
    wrap('chooseLanguage',function(fn,...args){fn(...args);if(this._desktopSession)this.setState({deMonitor:false});});
    wrap('rootKey',function(fn,e){
      const s=this.st();
      if(!s.deOpen)return fn(e);
      if(e.key==='Escape'&&this._deDrag){e.preventDefault();e.stopPropagation?.();this.desktopEndDrag();return;}
      if(s.dePhase==='ready'&&s.deLocked&&!s.languageOpen){
        if(e.key==='Escape'){e.preventDefault();e.stopPropagation?.();this.desktopClose();return;}
        if(!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.key==='Enter'||(e.key||'').length===1)&&!e.target?.closest?.('button')){e.preventDefault();this.desktopUnlock();}
        return;
      }
      if(this.desktopShortcut(e))return;
      if(e.key==='Escape'&&!s.languageOpen){
        e.preventDefault();e.stopPropagation?.();
        if(s.deLauncher)this.desktopLauncher(false);
        else if(s.deFull)this.setState({deFull:null});
        else if(s.deView!=='home')this.desktopWindowClose();
        else this.desktopClose();
      }
    });

    wrap('renderVals',function(fn){
      const r=fn(),s=this.st(),i18n=I(),t=i18n.t,locale={pt:'pt-BR',en:'en-US',ja:'ja-JP'}[i18n.locale],zoom=this._deZoom;
      const view=s.deView||'home',windows=s.deWindows||[],minimized=s.deMinimized||[],ws=s.deWs||1,now=s.now||Date.now();
      const {narrow,rect,rects,gutters}=this.desktopLayout(ws),here=leaves(this.desktopTree(ws));
      const focus=here.includes(view)?view:here[0],full=s.deFull&&here.includes(s.deFull)?s.deFull:null,solo=narrow?focus:full;
      const locked=s.dePhase!=='ready'||!!s.deLocked,dragging=this._deDrag;
      const fmt=(opts,zone)=>{try{return new Date(now).toLocaleTimeString(locale,{...opts,...(zone?{timeZone:zone}:{})});}catch{return new Date(now).toLocaleTimeString(locale,opts);}};
      const playing=this.desktopPlaying(),track=Number.isInteger(s.deTrack)?s.deTrack:null;
      const projects=this.data().projects,files=s.deFiles||{place:'projects',folder:null,sel:'p0'};
      const setFiles=next=>this.setState({deFiles:{...files,...next}});

      // Files: places, folders and a preview of the selected entry.
      let items=[],path='~/'+files.place,preview={};
      if(files.place==='projects'&&files.folder===null){
        items=projects.map((pr,i)=>({key:'p'+i,kind:'folder',name:pr.title,meta:pr.tags,open:()=>setFiles({folder:i,sel:'readme'})}));
        const pr=projects[Number((files.sel||'p0').slice(1))]||projects[0];
        preview={folder:true,title:pr.title,sub:pr.sub,period:pr.period,status:pr.status,line:pr.line,open:()=>setFiles({folder:projects.indexOf(pr),sel:'readme'})};
      }else if(files.place==='projects'){
        const pr=projects[files.folder]||projects[0],gallery=pr.gallery||[];path+='/'+slug(pr.title);
        items=[{key:'readme',kind:'doc',name:'README.md',meta:'markdown'},{key:'stack',kind:'doc',name:'stack.txt',meta:pr.stack.length+' '+t('itens')},
          ...gallery.map((im,j)=>({key:'img'+j,kind:'image',name:(im.src||'').split('/').pop(),meta:im.caption})),
          ...(pr.repositoryUrl?[{key:'repo',kind:'link',name:'repository.url',meta:'GitHub'}]:[])];
        const sel=files.sel||'readme';
        if(sel==='readme')preview={readme:true,title:pr.title,sub:pr.sub,period:pr.period,summary:pr.summary,points:pr.points.map(x=>({t:x})),credit:pr.credit};
        else if(sel==='stack')preview={stack:true,title:'stack.txt',chips:pr.stack.map(x=>({t:x}))};
        else if(sel==='repo')preview={repo:true,title:'repository.url',url:pr.repositoryUrl};
        else{const im=gallery[Number(sel.slice(3))]||gallery[0];preview=im?{image:true,title:(im.src||'').split('/').pop(),src:im.localized?.[i18n.locale]||im.src,alt:im.alt||im.caption,caption:im.caption}:{};}
      }else{
        items=['pt','en','ja'].map(l=>({key:l,kind:'pdf',name:'hikaru-'+l+'.pdf',meta:{pt:'Português',en:'English',ja:'日本語'}[l]}));
        const l=['pt','en','ja'].includes(files.sel)?files.sel:'pt';
        preview={pdf:true,title:'hikaru-'+l+'.pdf',href:'./resume/hikaru-'+l+'.pdf',view:()=>{this.setState({deResumeLocale:l});this.desktopApp('resume');}};
      }
      const fileItems=items.map(it=>({...it,cls:'is-'+it.kind+(files.sel===it.key?' is-sel':''),sel:files.sel===it.key,folder:it.kind==='folder',doc:it.kind==='doc',image:it.kind==='image',link:it.kind==='link',pdf:it.kind==='pdf',
        pick:()=>{if(files.sel===it.key&&it.open)it.open();else setFiles({sel:it.key});},dbl:()=>it.open?.()}));
      const pdfLocale=s.deResumeLocale||i18n.locale;

      // Monitor
      // The monitor only reports what this page measures: the last frames' times (the room loop keeps 90), and JS memory where exposed.
      const fps=this._fps||0,ft=this._ft||[],hist=ft.slice(-60).map(dt=>Math.round(Math.min(120,1000/Math.max(1,dt)))),frame=ft.length?ft.reduce((a,b)=>a+b,0)/ft.length:0,mem=g.performance?.memory;
      const level=v=>v>=50?'is-ok':v>=28?'is-mid':'is-low';
      const top=Math.max(60,...hist),bars=Array.from({length:60},(_,i)=>{const v=hist[hist.length-60+i];return {style:'--h:'+(v===undefined?0:Math.max(1,Math.ceil(v/top*8))/8),cls:v===undefined?'':level(v)};});
      const heap=mem?.usedJSHeapSize&&mem?.totalJSHeapSize?mem.usedJSHeapSize/mem.totalJSHeapSize:null,net=g.navigator?.onLine!==false;
      const procs=[{name:'okwm',ws:'—',state:'ativo'},...windows.map(id=>({name:label(id),ws:String(s.deWsOf?.[id]||'—'),state:minimized.includes(id)?'minimizado':id===view?'focado':id==='game'?'suspenso':'visível'}))];
      if(playing)procs.push({name:t('Música')+' · '+t(playlist[track].name),ws:'—',state:'tocando'});

      const born=this._deBorn||{},nowMs=Date.now();
      return {...r,
        // An emptied area says so; an area still being restored tile by tile does not flash that message.
        deOpen:!!s.deOpen,deReady:s.dePhase==='ready',deEntering:s.dePhase==='zoom',deHome:!here.length&&!locked&&nowMs-(this._dePopAt||0)>1500,deAscii:ascii,
        dePhaseClass:'is-'+(s.dePhase||'closed')+(this.desktopReduced()?' is-calm':'')+(locked?' is-locked':'')+(narrow?' is-narrow':'')+(here.length?'':' is-empty'),setDeCamera:this._deCameraRef||(this._deCameraRef=el=>{this._deCamera=el;}),deSurfaceInert:s.dePhase==='ready'?undefined:'',deCameraStyle:this.desktopGeometryStyle(),deHasCamera:!!zoom,
        deSnapshotStyle:zoom?'left:'+zoom.left+'px;top:'+zoom.top+'px;width:'+zoom.width+'px;height:'+zoom.height+'px':'',
        // A stable ref: the room is copied once when the zoom starts, not again on every per-second render.
        setDeSnapshot:this._deSnapshotRef||(this._deSnapshotRef=el=>{if(el&&this._rmCv){el.width=this._rmCv.width;el.height=this._rmCv.height;el.getContext('2d')?.drawImage(this._rmCv,0,0);}}),
        setDeShell:this._deShellRef||(this._deShellRef=el=>{this._deShell=el;}),setDeSurface:this._deSurfaceRef||(this._deSurfaceRef=el=>{this._deSurface=el;}),setDeWorkspace:this._deWorkspaceRef||(this._deWorkspaceRef=el=>this.desktopSetWorkspace(el)),
        setDeWall:this._deWallRef||(this._deWallRef=el=>this.desktopWall(el)),setDeTiles:this._deTilesRef||(this._deTilesRef=el=>{this._deTiles=el;}),setDeLog:this._deLogRef||(this._deLogRef=el=>{this._deLogEl=el;}),setDeViz:this._deVizRef||(this._deVizRef=el=>{this._deViz=el;this._deVizBars=this._deVizLv=this._deVizCells=null;}),
        deClose:()=>this.desktopClose(),deMinimize:()=>this.desktopMinimize(),deCloseLabel:'Desligar o computador',

        // lock screen
        deLocked:locked,deWorkInert:locked?'':undefined,deLockTime:fmt({hour:'2-digit',minute:'2-digit'}),deLockDate:new Date(now).toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long'}),
        deLockDots:Array.from({length:8},(_,i)=>({cls:i<(s.deLockDots||0)?'is-on':''})),deLockTyping:(s.deLockDots||0)>0&&(s.deLockDots||0)<8?'true':'false',
        deUnlock:()=>this.desktopUnlock(),deLockClick:e=>{if(!e.target?.closest?.('button'))this.desktopUnlock();},deLockPower:e=>{e.stopPropagation?.();this.desktopClose();},

        // top bar
        deWorkspaces:[1,2,3,4].map(n=>{const busy=leaves((s.deTrees||{})[n]).length>0,name=(wsNames[i18n.locale]||wsNames.pt)[n-1];
          return {n:String(n),name:i18n.nativeText(name,{pt:'pt-BR',en:'en',ja:'ja'}[i18n.locale]),cls:(n===ws?'is-on':'')+(busy?' is-busy':''),current:n===ws?'true':'false',go:()=>this.desktopWorkspace(n),aria:t('Área')+' '+n};}),
        deTitle:focus?label(focus):'',deTitleIcon:focus?icons[focus]:'',deHasTitle:!!focus,
        deNowPlaying:playing?t(playlist[track].name):'',deHasNowPlaying:playing,deNowGo:()=>this.desktopApp('music'),deNoteIcon:icons.music,
        deLang:{pt:'PT',en:'EN',ja:'日本語'}[i18n.locale],deLangGo:()=>this.desktopApp('settings'),deGlobe:glyphs.globe,
        deSoundIcon:this._snd?glyphs.soundOn:glyphs.soundOff,deSoundLabel:this._snd?'Desligar o som':'Ligar o som',deSoundPressed:this._snd?'true':'false',deSound:()=>this.toggleSnd(),
        deNetIcon:net?glyphs.net:glyphs.netOff,deNetLabel:net?'Conectado':'Sem conexão',
        deTime:new Date(now).toLocaleTimeString(locale),deClock:fmt({hour:'2-digit',minute:'2-digit'}),deDate:new Date(now).toLocaleDateString(locale,{weekday:'long',year:'numeric',month:'long',day:'numeric'}),deShortDate:new Date(now).toLocaleDateString(locale,{weekday:'short',day:'numeric',month:'short'}),
        dePowerIcon:glyphs.power,deLauncherOpen:()=>this.desktopLauncher(!s.deLauncher),deLauncherExpanded:s.deLauncher?'true':'false',

        // launcher
        deLauncher:!!s.deLauncher&&!locked,deLaunchQ:s.deLaunchQ||'',
        deLaunchItems:this.desktopLaunchItems().map((it,i)=>({...it,cls:i===(s.deLaunchSel||0)?'is-sel':'',state:windows.includes(it.id)?(minimized.includes(it.id)?'minimizado':t('Área')+' '+(s.deWsOf?.[it.id]||'')):'',go:()=>{this.setState({deLauncher:false});it.run();},point:()=>{if((s.deLaunchSel||0)!==i)this.setState({deLaunchSel:i});}})),
        deLaunchInput:e=>this.setState({deLaunchQ:e.target.value.slice(0,40),deLaunchSel:0}),
        deLaunchKey:e=>{const n=this.desktopLaunchItems().length,at=this.st().deLaunchSel||0;e.stopPropagation?.();
          if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();this.setState({deLaunchSel:(at+(e.key==='ArrowDown'?1:-1)+n)%Math.max(1,n)});}
          else if(e.key==='Enter'){e.preventDefault();this.desktopLaunch(at);}
          else if(e.key==='Escape'){e.preventDefault();this.desktopLauncher(false);}
          else if(e.altKey)this.desktopShortcut(e);},
        deLaunchClose:e=>{if(e.target===e.currentTarget)this.desktopLauncher(false);},
        deContext:e=>{if(e.target===e.currentTarget||e.target?.classList?.contains?.('desktop-empty')){e.preventDefault();this.desktopLauncher(true);}},

        // dock: every app, with its state
        deApps:apps.map(([id,desc,name])=>({id,icon:icons[id],label:name,desc,active:view===id&&here.includes(id),cls:view===id&&here.includes(id)?'is-active':windows.includes(id)?'is-open':'',open:()=>this.desktopApp(id)})),
        deHints:[['Alt+Enter','terminal'],['Alt+P','lançador'],['Alt+1–4','áreas'],['Alt+H J K L','foco'],['Alt+M','tela cheia']].map(([k,v])=>({k,v})),

        // tiles
        // The template runtime keys loops by index. Fixed slots preserve other apps' DOM, scroll and PDF state on close.
        deWindows:apps.map(([id,,title])=>{
          const on=here.includes(id),box=solo?rect:rects[id]||rect,b=born[id],fresh=b&&nowMs-b.t<900?(b.axis||'in'):'';
          return {id,title,icon:icons[id],opened:windows.includes(id),hidden:!on||(!!solo&&id!==solo),active:focus===id&&on,full:full===id,
            style:'left:'+box.x+'px;top:'+box.y+'px;width:'+box.w+'px;height:'+box.h+'px',born:fresh,
            fullIcon:full===id?glyphs.unfull:glyphs.full,fullLabel:full===id?'Sair da tela cheia':'Tela cheia',minIcon:glyphs.min,closeIcon:glyphs.close,
            terminal:id==='terminal',files:id==='files',monitor:id==='monitor',music:id==='music',notes:id==='notes',profile:id==='profile',skills:id==='skills',resume:id==='resume',lab:id==='lab',settings:id==='settings',clock:id==='clock',game:id==='game',
            gameIdle:id==='game'&&focus!=='game',
            close:()=>this.desktopWindowClose(id),minimize:()=>this.desktopMinimize(id),toggleFull:()=>this.desktopFull(id),raise:()=>this.desktopRaise(id),
            drag:e=>this.desktopTitleStart(id,e),move:e=>this.desktopTitleMove(e),end:e=>this.desktopEndDrag(e),dbl:e=>{if(!e.target?.closest?.('button'))this.desktopFull(id);},
            key:e=>{if(e.target===e.currentTarget)this.desktopTitleKey(id,e);}};}),
        deGutters:solo?[]:gutters.map(gu=>({path:gu.path,cls:'is-'+gu.split,orient:gu.split==='h'?'vertical':'horizontal',value:String(Math.round(gu.ratio*100)),
          style:'left:'+gu.x+'px;top:'+gu.y+'px;width:'+gu.w+'px;height:'+gu.h+'px',
          down:e=>this.desktopGutterStart(gu.path,e),move:e=>this.desktopGutterMove(e),end:e=>this.desktopEndDrag(e),key:e=>this.desktopGutterKey(gu.path,e)})),
        deTabs:narrow?here.map(id=>({id,label:label(id),icon:icons[id],cls:id===focus?'is-on':'',current:id===focus?'true':'false',go:()=>this.desktopRaise(id,true)})):[],deNarrow:narrow&&here.length>0,
        deEmptyName:i18n.nativeText((wsNames[i18n.locale]||wsNames.pt)[ws-1],{pt:'pt-BR',en:'en',ja:'ja'}[i18n.locale]),deEmptyNum:String(ws),deRestore:()=>this.desktopRestore(ws),deEmptySet:(workspaces[ws]||[]).map(id=>({id,label:label(id),icon:icons[id]})),deLaunchGo:()=>this.desktopLauncher(true),
        deDragging:dragging?'true':undefined,

        // terminal
        deLog:(s.deLog||[]).map(entry=>({id:entry.id,cmd:i18n.nativeText(entry.cmd,'zxx'),lines:entry.lines.map(function shape(l){
          let k=l.k,v=l.v,text=l.t;
          // "OS: Arch Linux" style lines split after translation, so the key keeps its colour in every language.
          if(text&&!l.raw&&!l.app&&/^[^:：]{1,24}[:：]\s?\S/.test(t(text))){const tr=t(text),at=tr.search(/[:：]/);k=tr.slice(0,at);v=tr.slice(at+1).trim();text='';}
          // Only the parts a line has become spans, so empty parts never leave gaps or stray colons.
          const segs=[['de-head',l.head],['de-rule',l.rule],['de-k de-c',l.cmd&&i18n.nativeText(i18n.locale==='pt'?(localCmd[l.cmd]||l.cmd):l.cmd,'zxx')],['de-k',k&&t(k)+':'],['de-v',v],['de-t',text],['de-raw',l.raw&&i18n.nativeText(l.raw,'zxx')],['de-v',l.app]]
            .filter(([,x])=>x).map(([cls,x])=>({cls,x}));
          return {fetch:!!l.fetch,info:(l.info||[]).map(shape),logo:l.fetch?logo:[],segs,files:(l.files||[]).map(f=>({f,dir:f.endsWith('/')})),hasFiles:!!l.files,
            swatches:l.swatches?swatches.map(c=>({style:'background:'+c})):[],hasSwatches:!!l.swatches,plain:!l.fetch};
        })})),
        deInput:s.deInput||'',deOutput:s.deOutput??help,deMonitor:!!s.deMonitor,deLogEmpty:!(s.deLog||[]).length,
        deInputChange:e=>this.setState({deInput:e.target.value.slice(0,128)}),
        deInputKey:e=>{
          e.stopPropagation();
          if(e.altKey&&this.desktopShortcut(e))return;
          if(e.key==='Escape'){e.preventDefault();this.desktopWindowClose('terminal');}
          else if(e.key==='Enter'){e.preventDefault();this.desktopCommand();}
          else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();this.desktopHistory(e.key==='ArrowUp'?-1:1);}
          else if(e.key==='Tab'&&(this.st().deInput||'').trim()&&!/\s/.test((this.st().deInput||'').trim())){e.preventDefault();this.desktopComplete();}
          else if(e.key==='l'&&e.ctrlKey){e.preventDefault();this.setState({deLog:[],deOutput:''});}
        },
        deSubmit:()=>this.desktopCommand(),deTermFocus:e=>{if(!g.getSelection?.()?.toString?.())e.currentTarget?.querySelector?.('#desktop-command')?.focus?.({preventScroll:true});},

        // files
        dePlaces:[['projects','Projetos',projects.length],['resumes','Currículos',3]].map(([key,name,n])=>({key,name,n:String(n),cls:files.place===key?'is-on':'',go:()=>setFiles({place:key,folder:null,sel:key==='projects'?'p0':'pt'})})),
        dePath:i18n.nativeText(path,'zxx'),deFolderOpen:files.folder!==null,deFilesBack:()=>setFiles({folder:null,sel:'p'+(files.folder||0)}),deBackIcon:glyphs.back,deOutIcon:glyphs.out,
        deFileItems:fileItems,deFileCount:items.length+' '+t('itens'),dePreview:preview,dePreviewFolder:!!preview.folder,dePreviewReadme:!!preview.readme,dePreviewStack:!!preview.stack,dePreviewRepo:!!preview.repo,dePreviewImage:!!preview.image,dePreviewPdf:!!preview.pdf,
        deFolderIcon:'M2 5h7l2 2h11v13H2z',

        // monitor
        deFps:String(fps),deFpsCls:level(fps),deFrameMs:frame?frame.toFixed(1)+' ms':'—',deFpsBars:bars,
        deHeap:heap===null?'':Math.round(mem.usedJSHeapSize/1048576)+' / '+Math.round(mem.totalJSHeapSize/1048576)+' MB',deHeapLimit:heap===null?'':Math.round(mem.jsHeapSizeLimit/1048576)+' MB',deHeapStyle:'--v:'+(heap||0),deHasHeap:heap!==null,deNoHeap:heap===null,
        deStats:[['Tempo nesta página',clock(Date.now()-(g.performance?.timeOrigin||Date.now()))],['Janela do navegador',Math.round(g.innerWidth||0)+'×'+Math.round(g.innerHeight||0)],['Densidade de pixels',String(Math.round((g.devicePixelRatio||1)*100)/100)+'×'],
          ['Núcleos lógicos',String(g.navigator?.hardwareConcurrency||'—')],['Rede',net?'Conectado':'Sem conexão'],['Conquistas',(r.gotCount??'—')+' / '+(r.trophyTotal??'—')]].map(([k,v])=>({k,v})),
        deProcs:procs.map((pr,i)=>({...pr,id:String(i+1).padStart(2,'0'),cls:pr.state==='focado'||pr.state==='tocando'?'is-hot':pr.state==='minimizado'?'is-dim':''})),

        // music
        dePlaylist:playlist.map((it,i)=>({n:String(i+1).padStart(2,'0'),name:it.name,from:it.from,bpm:(this.desktopTrackObj(i)?.bpm||'')+' bpm',cls:(i===track?'is-cur':'')+(i===track&&playing?' is-playing':''),current:i===track?'true':'false',play:()=>i===track&&playing?this.desktopPause():this.desktopPlay(i)})),
        deTrackName:track===null?'Nada tocando':playlist[track].name,deTrackMeta:track===null?'Escolha uma faixa':t(playlist[track].from)+' · '+(this.desktopTrackObj(track)?.bpm||'')+' bpm',
        dePlayIcon:playing?glyphs.pause:glyphs.play,dePlayLabel:playing?'Pausar':this._snd?'Tocar':'Ligar o som e tocar',dePrevIcon:glyphs.prev,deNextIcon:glyphs.next,
        dePlayToggle:()=>playing?this.desktopPause():this.desktopPlay(track??0),dePrev:()=>this.desktopSkip(-1),deNext:()=>this.desktopSkip(1),
        deEq:Array.from({length:vizBars},(_,i)=>({style:'--idle:'+((Math.sin(i/2.2)+Math.sin(i/5.1)+2)/4).toFixed(2)})),deSteps:Array.from({length:16},(_,i)=>({cls:i%4?'':'is-beat'})),

        // notes
        deNotes:notes.map(n=>{const [user,domain]=(n.link?.[1]||'').split('@');return {t:n.t,cls:'is-'+n.tone,hasLink:!!n.link,href:n.link?.[2]||'',linkUser:user||'',linkDomain:domain?'@'+domain:''};}),
        deNoteText:this.desktopNoteText(),deNoteInput:e=>this.desktopNote(e.target.value),

        // profile, skills, résumé, settings, clock, game
        deSkillGroups:this.data().skills.branches.map(b=>({name:b.name,nodes:b.nodes.map(n=>({label:n.full,active:s.skSel===n.k,pick:()=>this.skPick(n.k)}))})),
        deProfileLines:profile.slice(1,-1).map(line=>{const tr=t(line),at=tr.search(/[:：]/);return {k:at>0?tr.slice(0,at):'',v:at>0?tr.slice(at+1).trim():tr};}),
        deLinks:links.map(([k,v,href])=>({k,v,href,out:href.startsWith('http')})),
        dePdf:'./resume/hikaru-'+pdfLocale+'.pdf',dePdfLocales:['pt','en','ja'].map(l=>({l:l.toUpperCase(),cls:l===pdfLocale?'is-on':'',current:l===pdfLocale?'true':'false',go:()=>this.setState({deResumeLocale:l})})),
        deZones:zones.map(([name,zone])=>({name,time:zone==='local'?fmt({hour:'2-digit',minute:'2-digit',second:'2-digit'}):fmt({hour:'2-digit',minute:'2-digit',second:'2-digit'},zone),cls:zone==='local'?'is-here':''})),
        deSoundState:this._snd?'Ligado':'Desligado',deMotionState:this.calm()?'Reduzido':'Completo',deMotion:()=>this.toggleMotion?.(),
        pcOpen:!!s.pcOpen&&!this._desktopSession,pcCloseLabel:this._desktopSession?'Voltar ao desktop':'Levantar da cadeira',
        deGamePause:()=>this.pcKey({key:'p',preventDefault(){}}),deGameRestart:()=>this.pcStart(),
        deGameKey:e=>{if(['Enter',' '].includes(e.key)&&e.target?.closest?.('button'))return;this.pcKey(e);},
        deJumpKeyDown:e=>this.desktopGameButton(e,'j',true),deJumpKeyUp:e=>this.desktopGameButton(e,'j',false),deDuckKeyDown:e=>this.desktopGameButton(e,'d',true),deDuckKeyUp:e=>this.desktopGameButton(e,'d',false),
        setPcWrap:this._desktopSession?el=>{this._pcWrap=el;}:r.setPcWrap
      };
    });
  }};
})(window);
