/* Local desktop: windows keep their state; terminal commands are explicitly allowlisted. */
(function(g){
  const apps=[['terminal','>_','Terminal'],['profile','光','Perfil'],['game','▣','Jogar'],['skills','⌘','Habilidades'],['resume','▤','Currículo'],['lab','⚙','Lab'],['settings','文','Idioma'],['clock','◷','Relógio']];
  const icons={terminal:'M3 5h18v14H3z M6 9l3 3-3 3 M12 15h5',profile:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 21v-2a8 6 0 0 1 16 0v2',game:'M7 7h10l4 9-2 3-5-4h-4l-5 4-2-3z M6 11h5 M8.5 8.5v5 M16 10h.1 M18 13h.1',skills:'M10 3h4v4h-4z M3 17h4v4H3z M17 17h4v4h-4z M12 7v5 M5 17v-5h14v5',resume:'M5 2h10l4 4v16H5z M14 2v6h5 M8 12h8 M8 16h8',lab:'M8 3h8 M10 3v7L4 20h16l-6-10V3 M7 15h10',settings:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M3 12h18 M12 3c-6 4-6 14 0 18 M12 3c6 4 6 14 0 18',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 6v7h5'};
  const ascii=['       /\\','      /  \\','     / /\\ \\','    / /  \\ \\','   / /____\\ \\','  /_/      \\_\\'].join('\n');
  const system=['OS: Arch Linux','Host: Okaru Workstation','Kernel: portfolio 1.0','DE: Okaru Desktop','CPU: 8 núcleos','Memória: 4,2 / 16 GB'];
  const profile=['Hikaru Ogasawara · 小笠原 光','OS: humano','Uptime: 21 anos','Modelo: Engenharia da Computação','Local: São Paulo, Brasil','Formação: Ibmec · 2023–2027 (previsto)','Foco: hardware, infraestrutura e segurança','Guilda: Ycare · vice-presidente','Contato: hogasawara2311@outlook.com'];
  const help='Comandos: help, neofetch, whoami, htop, date, clear. Use os ícones para abrir os aplicativos.';
  const zoomDuration=2300;
  function command(raw){const value=String(raw||'').trim().slice(0,128);return {raw:value,name:value.toLowerCase()};}
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
  function boundedFrame(frame,size){
    const width=Math.max(1,size.width),height=Math.max(1,size.height),w=Math.min(width,Math.max(Math.min(300,width),frame.w)),h=Math.min(height,Math.max(Math.min(200,height),frame.h));
    return {x:Math.max(0,Math.min(width-w,frame.x)),y:Math.max(0,Math.min(height-h,frame.y)),w,h};
  }
  function initialFrame(id,size,index=0){
    const small=['clock','settings'].includes(id),w=Math.min(small?480:800,size.width*(size.width<700?.94:.7)),h=Math.min(small?380:650,size.height*.88),offset=index%5*24;
    return boundedFrame({x:(size.width-w)/2+offset,y:(size.height-h)/2+offset,w,h},size);
  }
  // Strong ease-in-out (cubic-bezier(.77,0,.175,1)), solved for x so it can be sampled into keyframes.
  function bezier(x1,y1,x2,y2){
    const at=(a,b,t)=>((1-3*b+3*a)*t+(3*b-6*a))*t*t+3*a*t;
    return x=>{if(x<=0||x>=1)return Math.max(0,Math.min(1,x));let lo=0,hi=1,t=x;for(let i=0;i<24;i++){const v=at(x1,x2,t);if(Math.abs(v-x)<1e-6)break;if(v<x)lo=t;else hi=t;t=(lo+hi)/2;}return at(y1,y2,t);};
  }
  const easeInOut=bezier(.77,0,.175,1);
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
  g.PortfolioDesktop={apps,system,profile,command,zoomGeometry,zoomFrames,zoomDuration,boundedFrame,initialFrame,install(C){
    const p=C.prototype;
    const wrap=(name,fn)=>{const prior=p[name];p[name]=function(...args){return fn.call(this,prior.bind(this),...args);};};
    wrap('data',function(fn){const d=fn();if(!d.desktopEnhanced){d.desktopEnhanced=true;for(const id of ['pc','cadeira']){const o=d.room.find(o=>o.id===id);if(o)o.acts=[['Sentar e usar o computador','pcgame']];}}return d;});
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
    p.desktopClearEntry=function(){clearTimeout(this._deEntryT);this._deEntryT=null;this.desktopStopBeat();this.desktopZoomStop();this._deZoom=null;};
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
      this.desktopClearEntry();this._desktopSession=true;this._deZoom=this.desktopGeometry();this._deFocus='shell';
      this.setState({deOpen:true,dePhase:phase,deView:'home',deWindows:[],deOrder:[],deMinimized:[],deFrames:{},rmDlg:false,pcOpen:false,paused:false,palOpen:false});
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
    p.desktopReady=function(){
      if(!this._desktopSession||this._dead||this.curPage()!=='quarto'||this.st().dePhase!=='zoom')return;
      this.desktopClearEntry();this._deFocus='dock';this.setState({dePhase:'ready'});
    };
    p.desktopDispose=function(){
      this.desktopEndDrag();this._deResize?.disconnect();this._deWorkspace=null;
      this.desktopClearEntry();this._desktopSession=false;this._pc=null;this._pcCv=null;this._pcWrap=null;this._deFocus=null;
      clearTimeout(this._pcT);this.setState({deOpen:false,dePhase:'closed',deWindows:[],deOrder:[],deMinimized:[],deFrames:{},deView:'home',pcOpen:false});
    };
    p.desktopClose=function(){this.desktopDispose();this.pcStand(false);this.focusRoot();this.persistSoon();};
    p.desktopReleaseGame=function(){if(this._pc){this._pc.keys={};this._pc.duck=false;}this._pcPtr=false;};
    p.desktopApp=function(id){
      if(!this._desktopSession||this.st().dePhase!=='ready'||!apps.some(a=>a[0]===id))return;
      this.sfx('select');
      if(this.st().deView===id){this.desktopMinimize(id);return;}
      const s=this.st(),windows=s.deWindows||[];
      if(id==='game'&&!this._pc)this._pc=this.pcNew();
      this.desktopReleaseGame();this._deFocus=id;
      this.setState({deWindows:windows.includes(id)?windows:[...windows,id],deFrames:windows.includes(id)?s.deFrames:{...s.deFrames,[id]:initialFrame(id,this.desktopSize(),windows.length)},
        deOrder:[...(s.deOrder||[]).filter(k=>k!==id),id],deMinimized:(s.deMinimized||[]).filter(k=>k!==id),deView:id,pcOpen:id==='game'});
      if(id==='terminal'&&this.st().deOutput===undefined)this.setState({deOutput:help});
      if(id==='resume')this.unlock('desktop-resume');this.startLoop();
    };
    p.desktopWindowClose=function(id=this.st().deView){
      this.desktopEndDrag();
      const windows=(this.st().deWindows||[]).filter(k=>k!==id);
      if(id==='game'){this._pc=null;this._pcCv=null;this._pcWrap=null;this.persistSoon();}
      const s=this.st(),order=(s.deOrder||[]).filter(k=>k!==id),minimized=(s.deMinimized||[]).filter(k=>k!==id),frames={...s.deFrames};delete frames[id];
      const view=s.deView===id?order.filter(k=>!minimized.includes(k)).at(-1)||'home':s.deView;
      if(view!==s.deView){this.desktopReleaseGame();this._deFocus=view==='home'?'dock':view;}
      this.setState({deWindows:windows,deOrder:order,deMinimized:minimized,deFrames:frames,deView:view,pcOpen:view==='game'});
    };
    p.desktopMinimize=function(id=this.st().deView){
      if(!(this.st().deWindows||[]).includes(id))return;
      this.desktopEndDrag();const s=this.st(),minimized=[...new Set([...(s.deMinimized||[]),id])];
      const view=s.deView===id?(s.deOrder||[]).filter(k=>!minimized.includes(k)).at(-1)||'home':s.deView;
      if(view!==s.deView){this.desktopReleaseGame();this._deFocus=view==='home'?'dock':view;}
      this.setState({deMinimized:minimized,deView:view,pcOpen:view==='game'});
    };
    p.desktopRaise=function(id,focus=false){
      const s=this.st();if(!(s.deWindows||[]).includes(id)||s.dePhase!=='ready')return;
      if(s.deView===id)return;
      this.desktopReleaseGame();if(focus)this._deFocus=id;
      this.setState({deOrder:[...(s.deOrder||[]).filter(k=>k!==id),id],deMinimized:(s.deMinimized||[]).filter(k=>k!==id),deView:id,pcOpen:id==='game'});
    };
    p.desktopSize=function(){const r=this._deWorkspace?.getBoundingClientRect?.();return {width:r?.width||1000,height:r?.height||650};};
    p.desktopFit=function(){
      this.desktopEndDrag();const frames={};for(const [id,frame] of Object.entries(this.st().deFrames||{}))frames[id]=boundedFrame(frame,this.desktopSize());
      this.setState({deFrames:frames});
    };
    p.desktopSetWorkspace=function(el){
      if(el===this._deWorkspace)return;this._deResize?.disconnect();this._deWorkspace=el;
      if(el&&g.ResizeObserver){this._deResize=new g.ResizeObserver(()=>{if(this.st().dePhase==='ready')this.desktopFit();});this._deResize.observe(el);}
    };
    p.desktopDragStart=function(id,e,resize=false){
      if(this.st().dePhase!=='ready'||(e.button!==undefined&&e.button!==0)||(!resize&&e.target?.closest?.('button,input,a')))return;
      const frame=this.st().deFrames?.[id];if(!frame)return;
      e.preventDefault();this.desktopEndDrag();this.desktopRaise(id);const el=e.currentTarget;
      this._deDrag={id,pointer:e.pointerId,el,node:el.closest?.('.desktop-window'),resize,startX:e.clientX,startY:e.clientY,frame:{...frame},next:{...frame}};
      this._deWorkspace?.setAttribute('data-dragging','true');el.setPointerCapture?.(e.pointerId);
    };
    p.desktopDragMove=function(e){
      const d=this._deDrag;if(!d||e.pointerId!==d.pointer)return;
      e.preventDefault();const dx=e.clientX-d.startX,dy=e.clientY-d.startY;
      const next=boundedFrame(d.resize?{...d.frame,w:d.frame.w+dx,h:d.frame.h+dy}:{...d.frame,x:d.frame.x+dx,y:d.frame.y+dy},this.desktopSize());
      // Resizing stays anchored to the upper left corner.
      if(d.resize){next.x=d.frame.x;next.y=d.frame.y;const size=this.desktopSize();next.w=Math.min(next.w,size.width-next.x);next.h=Math.min(next.h,size.height-next.y);}
      d.next=next;if(d.node)Object.assign(d.node.style,{left:next.x+'px',top:next.y+'px',width:next.w+'px',height:next.h+'px'});
    };
    p.desktopEndDrag=function(e){
      const d=this._deDrag;if(!d||(e&&e.pointerId!==d.pointer))return;
      this._deDrag=null;this._deWorkspace?.removeAttribute('data-dragging');
      if(d.el.hasPointerCapture?.(d.pointer))d.el.releasePointerCapture(d.pointer);
      if(!this._dead)this.setState({deFrames:{...this.st().deFrames,[d.id]:boundedFrame(d.next,this.desktopSize())}});
    };
    p.desktopWindowKey=function(id,e,resize=false){
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
      const f=this.st().deFrames?.[id];if(!f)return;e.preventDefault();e.stopPropagation();this.desktopRaise(id);
      const dx=e.key==='ArrowLeft'?-20:e.key==='ArrowRight'?20:0,dy=e.key==='ArrowUp'?-20:e.key==='ArrowDown'?20:0;
      const frame=boundedFrame(resize||e.shiftKey?{...f,w:f.w+dx,h:f.h+dy}:{...f,x:f.x+dx,y:f.y+dy},this.desktopSize());
      this.setState({deFrames:{...this.st().deFrames,[id]:frame}});
    };
    p.desktopGameButton=function(e,key,down){
      if(!['Enter',' '].includes(e.key))return;
      e.preventDefault();e.stopPropagation();if(!down||!e.repeat)this.pcPress(key,down);
    };
    p.desktopFocus=function(){
      if(!this._deFocus||!this._deShell)return;
      const id=this._deFocus;this._deFocus=null;
      const target=id==='shell'?this._deShell:id==='dock'?this._deShell.querySelector('.desktop-dock button'):id==='terminal'?this._deShell.querySelector('#desktop-command'):id==='game'?this._pcWrap:this._deShell.querySelector('.desktop-window[data-app="'+id+'"] .desktop-title button');
      target?.focus?.({preventScroll:true});
    };
    wrap('componentDidUpdate',function(fn,...args){fn(...args);this.desktopZoomStart();this.desktopFocus();});
    wrap('componentDidMount',function(fn){
      fn();this._deBlur=()=>{this.desktopEndDrag();if(this._desktopSession){this.desktopStopBeat();this.desktopReleaseGame();if(this._pc)this._pc.paused=true;}};
      this._deVisibility=()=>{if(document.hidden)this._deBlur();};
      g.addEventListener?.('blur',this._deBlur);document.addEventListener('visibilitychange',this._deVisibility);
    });
    wrap('componentWillUnmount',function(fn){this.desktopEndDrag();this._deResize?.disconnect();this.desktopClearEntry();g.removeEventListener?.('blur',this._deBlur);document.removeEventListener('visibilitychange',this._deVisibility);this._deShell=null;this._desktopSession=false;return fn();});
    wrap('toggleSnd',function(fn){const r=fn();if(!this._snd)this.desktopStopBeat();return r;});
    wrap('closePc',function(fn){if(this._desktopSession){this.desktopWindowClose('game');return;}return fn();});
    wrap('loopPc',function(fn,dt){if(this._desktopSession&&(!this.st().deOpen||this.st().deView!=='game'||document.hidden))return;return fn(dt);});
    wrap('go',function(fn,to,...rest){if(to!==this.curPage()&&this._desktopSession){this.desktopDispose();this.pcStand(true);}return fn(to,...rest);});
    wrap('reboot',function(fn,...args){if(this._desktopSession){this.desktopDispose();this.pcStand(true);}return fn(...args);});
    wrap('wipeProgress',function(fn,...args){this.desktopDispose();return fn(...args);});
    p.desktopCommand=function(){
      const input=command(this.st().deInput),I=g.PortfolioI18n;let output;
      if(!input.raw)return;
      if(input.name==='clear'){this.setState({deOutput:'',deInput:'',deMonitor:false});return;}
      if(input.name==='help')output=help;
      else if(input.name==='neofetch'){output=ascii+'\n\n'+system.map(I.t).join('\n');this.unlock('fetch-yourself');}
      else if(input.name==='whoami')output=profile.map(I.t).join('\n');
      else if(input.name==='htop')output='Monitor de processos';
      else if(input.name==='date')output=new Date(this.st().now||Date.now()).toLocaleString({pt:'pt-BR',en:'en-US',ja:'ja-JP'}[I.locale]);
      else output='Comando não encontrado. Digite help.';
      this.setState({deInput:'',deOutput:output,deMonitor:input.name==='htop',deLastCommand:input.name});
    };
    wrap('chooseLanguage',function(fn,...args){fn(...args);if(this._desktopSession)this.setState({deOutput:help,deMonitor:false});});
    wrap('rootKey',function(fn,e){
      if(!this.st().deOpen)return fn(e);
      if(e.key==='Escape'&&this._deDrag){e.preventDefault();e.stopPropagation?.();this.desktopEndDrag();return;}
      if(e.key==='Escape'&&!this.st().languageOpen){e.preventDefault();e.stopPropagation?.();if(this.st().deView!=='home')this.desktopWindowClose();else this.desktopClose();}
    });
    wrap('renderVals',function(fn){
      const r=fn(),s=this.st(),view=s.deView||'home',windows=s.deWindows||[],minimized=s.deMinimized||[],order=s.deOrder||[],I=g.PortfolioI18n,locale={pt:'pt-BR',en:'en-US',ja:'ja-JP'}[I.locale],zoom=this._deZoom;
      return {...r,
        deOpen:!!s.deOpen,deReady:s.dePhase==='ready',deEntering:s.dePhase==='zoom',deHome:view==='home',deAscii:ascii,
        dePhaseClass:'is-'+(s.dePhase||'closed')+(this.desktopReduced()?' is-calm':''),setDeCamera:this._deCameraRef||(this._deCameraRef=el=>{this._deCamera=el;}),deSurfaceInert:s.dePhase==='ready'?undefined:'',deCameraStyle:this.desktopGeometryStyle(),deHasCamera:!!zoom,
        deSnapshotStyle:zoom?'left:'+zoom.left+'px;top:'+zoom.top+'px;width:'+zoom.width+'px;height:'+zoom.height+'px':'',
        // A stable ref: the room is copied once when the zoom starts, not again on every per-second render.
        setDeSnapshot:this._deSnapshotRef||(this._deSnapshotRef=el=>{if(el&&this._rmCv){el.width=this._rmCv.width;el.height=this._rmCv.height;el.getContext('2d')?.drawImage(this._rmCv,0,0);}}),
        setDeShell:this._deShellRef||(this._deShellRef=el=>{this._deShell=el;}),setDeSurface:this._deSurfaceRef||(this._deSurfaceRef=el=>{this._deSurface=el;}),setDeWorkspace:this._deWorkspaceRef||(this._deWorkspaceRef=el=>this.desktopSetWorkspace(el)),deClose:()=>this.desktopClose(),deMinimize:()=>this.desktopMinimize(),
        deApps:apps.map(([id,icon,label])=>({id,icon:icons[id],label,active:view===id,cls:view===id?'is-active':windows.includes(id)?'is-open':'',open:()=>this.desktopApp(id)})),
        // The template runtime keys loops by index. Fixed slots preserve other apps' DOM, scroll and PDF state on close.
        deWindows:apps.map(([id,,title])=>{const f=(this._deDrag?.id===id?this._deDrag.next:s.deFrames?.[id])||initialFrame(id,this.desktopSize());return {id,title,icon:icons[id],opened:windows.includes(id),hidden:!windows.includes(id)||minimized.includes(id),active:view===id,
          style:'left:'+f.x+'px;top:'+f.y+'px;width:'+f.w+'px;height:'+f.h+'px;z-index:'+(order.indexOf(id)+1),
          terminal:id==='terminal',profile:id==='profile',skills:id==='skills',resume:id==='resume',lab:id==='lab',settings:id==='settings',clock:id==='clock',game:id==='game',
          close:()=>this.desktopWindowClose(id),minimize:()=>this.desktopMinimize(id),raise:()=>this.desktopRaise(id),
          drag:e=>this.desktopDragStart(id,e),resize:e=>this.desktopDragStart(id,e,true),move:e=>this.desktopDragMove(e),end:e=>this.desktopEndDrag(e),
          key:e=>{if(e.target===e.currentTarget)this.desktopWindowKey(id,e);},resizeKey:e=>this.desktopWindowKey(id,e,true)};}),
        deSkillGroups:this.data().skills.branches.map(b=>({name:b.name,nodes:b.nodes.map(n=>({label:n.full,active:s.skSel===n.k,pick:()=>this.skPick(n.k)}))})),
        deProfileLines:profile.map(t=>({t})),deInput:s.deInput||'',deOutput:s.deOutput??help,
        deInputChange:e=>this.setState({deInput:e.target.value.slice(0,128)}),deInputKey:e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();this.desktopWindowClose('terminal');}if(e.key==='Enter'){e.preventDefault();this.desktopCommand();}},deSubmit:()=>this.desktopCommand(),deMonitor:!!s.deMonitor,
        deProcesses:['portfolio','pixel-renderer','sound-server','recruiter-service'].map((name,i)=>({name,pid:101+i,cpu:(2+Math.abs(Math.sin((s.now||0)/1800+i))*8).toFixed(1)+'%',ram:[128,64,32,16][i]+' MB'})),
        deTime:new Date(s.now||Date.now()).toLocaleTimeString(locale),deDate:new Date(s.now||Date.now()).toLocaleDateString(locale,{weekday:'long',year:'numeric',month:'long',day:'numeric'}),dePdf:'./resume/hikaru-'+I.locale+'.pdf',
        pcOpen:!!s.pcOpen&&!this._desktopSession,pcCloseLabel:this._desktopSession?'Voltar ao desktop':'Levantar da cadeira',
        deGamePause:()=>this.pcKey({key:'p',preventDefault(){}}),deGameRestart:()=>this.pcStart(),
        deGameKey:e=>{if(['Enter',' '].includes(e.key)&&e.target?.closest?.('button'))return;this.pcKey(e);},
        deJumpKeyDown:e=>this.desktopGameButton(e,'j',true),deJumpKeyUp:e=>this.desktopGameButton(e,'j',false),deDuckKeyDown:e=>this.desktopGameButton(e,'d',true),deDuckKeyUp:e=>this.desktopGameButton(e,'d',false),
        setPcWrap:this._desktopSession?el=>{this._pcWrap=el;}:r.setPcWrap
      };
    });
  }};
})(window);
