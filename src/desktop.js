/* A local, fictional desktop. Its terminal only dispatches explicitly listed commands. */
(function(g){
  const apps=[['terminal','>_','Terminal'],['profile','光','Perfil'],['game','▣','Jogar'],['skills','⌘','Habilidades'],['resume','▤','Currículo'],['lab','⚙','Lab'],['settings','文','Idioma'],['clock','◷','Relógio']];
  const ascii=['       /\\','      /  \\','     / /\\ \\','    / /  \\ \\','   / /____\\ \\','  /_/      \\_\\'].join('\n');
  const system=['OS: Arch Linux · demonstração','Host: Okaru Workstation','Kernel: portfolio 1.0','DE: Okaru Desktop','CPU: 8 núcleos fictícios','Memória: 4,2 / 16 GB fictícios','Todos os recursos desta máquina são simulados.'];
  const profile=['Hikaru Ogasawara · 小笠原 光','OS: humano','Uptime: 21 anos','Modelo: Engenharia da Computação','Local: São Paulo, Brasil','Formação: Ibmec · 2023–2027 (previsto)','Foco: hardware, infraestrutura e segurança','Guilda: Ycare · vice-presidente','Contato: hogasawara2311@outlook.com'];
  const help='Comandos: help, neofetch, whoami, htop, date, clear. Use os ícones para abrir os aplicativos.';
  function command(raw){const value=String(raw||'').trim().slice(0,128);return {raw:value,name:value.toLowerCase()};}
  g.PortfolioDesktop={apps,system,profile,command,install(C){
    const p=C.prototype,base={};
    const wrap=(name,fn)=>{base[name]=p[name];p[name]=function(...args){return fn.call(this,base[name].bind(this),...args);};};
    wrap('data',function(fn){const d=fn();if(!d.desktopEnhanced){d.desktopEnhanced=true;for(const id of ['pc','cadeira']){const o=d.room.find(o=>o.id===id);if(o)o.acts=[['Sentar e usar o computador','pcgame']];}}return d;});
    // The original sitting animation calls openPc after 480 ms.
    p.openPc=function(){if(this.curPage()!=='quarto')return;this._desktopSession=true;this.setState({deOpen:true,deView:'home',rmDlg:false,pcOpen:false,paused:false,palOpen:false});this.unlock('desktop-login');};
    p.desktopClose=function(){this._desktopSession=false;this.setState({deOpen:false,deView:'home',pcOpen:false});this.pcStand(false);this.focusRoot();};
    p.desktopApp=function(id){
      if(!apps.some(a=>a[0]===id))return;
      this.sfx('select');
      if(id==='game'){this.setState({deOpen:false});this._pcWrap=null;this._pc=this.pcNew();this.setState({pcOpen:true});this.startLoop();return;}
      this.setState({deView:id});if(id==='terminal'&&!this.st().deOutput)this.setState({deOutput:help});if(id==='resume')this.unlock('desktop-resume');
    };
    wrap('closePc',function(fn){if(this._desktopSession&&this.curPage()==='quarto'){this._pc=null;this._pcCv=null;this.setState({pcOpen:false,deOpen:true,deView:'home'});return;}return fn();});
    wrap('go',function(fn,to,...rest){if(to!==this.curPage()&&this._desktopSession){this._desktopSession=false;this.setState({deOpen:false});this.pcStand(true);}return fn(to,...rest);});
    p.desktopCommand=function(){
      const input=command(this.st().deInput),I=g.PortfolioI18n;let output;
      if(!input.raw)return;
      if(input.name==='clear'){this.setState({deOutput:'',deInput:'',deMonitor:false});return;}
      if(input.name==='help')output=help;
      else if(input.name==='neofetch'){output=ascii+'\n\n'+system.map(I.t).join('\n');this.unlock('fetch-yourself');}
      else if(input.name==='whoami')output=profile.map(I.t).join('\n');
      else if(input.name==='htop')output='Monitor de processos fictícios';
      else if(input.name==='date')output=new Date(this.st().now||Date.now()).toLocaleString({pt:'pt-BR',en:'en-US',ja:'ja-JP'}[I.locale]);
      else output='Comando não encontrado. Digite help.';
      this.setState({deInput:'',deOutput:output,deMonitor:input.name==='htop',deLastCommand:input.name});
    };
    wrap('chooseLanguage',function(fn,...args){fn(...args);if(this._desktopSession&&this.st().deView==='terminal')this.setState({deOutput:help,deMonitor:false});});
    wrap('rootKey',function(fn,e){if(!this.st().deOpen)return fn(e);if(e.key==='Escape'&&!this.st().languageOpen){e.preventDefault();if(this.st().deView!=='home')this.setState({deView:'home'});else this.desktopClose();}});
    wrap('renderVals',function(fn){
      const r=fn(),s=this.st(),view=s.deView||'home',I=g.PortfolioI18n,locale={pt:'pt-BR',en:'en-US',ja:'ja-JP'}[I.locale];
      return {...r,deOpen:!!s.deOpen,deHome:view==='home',deTitle:apps.find(a=>a[0]===view)?.[2]||'Okaru Desktop',deClose:()=>this.desktopClose(),deBack:()=>this.setState({deView:'home'}),deApps:apps.map(([id,icon,label])=>({id,icon,label,open:()=>this.desktopApp(id)})),deTerminal:view==='terminal',deProfile:view==='profile',deSkills:view==='skills',deResume:view==='resume',deLab:view==='lab',deSettings:view==='settings',deClock:view==='clock',deAscii:ascii,deSystem:system.map(t=>({t})),deProfileLines:profile.map(t=>({t})),deInput:s.deInput||'',deOutput:s.deOutput??help,deInputChange:e=>this.setState({deInput:e.target.value.slice(0,128)}),deInputKey:e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();this.setState({deView:'home'});}if(e.key==='Enter'){e.preventDefault();this.desktopCommand();}},deSubmit:()=>this.desktopCommand(),deMonitor:!!s.deMonitor,deProcesses:['portfolio','pixel-renderer','sound-server','recruiter-service'].map((name,i)=>({name,pid:101+i,cpu:(2+Math.abs(Math.sin((s.now||0)/1800+i))*8).toFixed(1)+'%',ram:[128,64,32,16][i]+' MB'})),deTime:new Date(s.now||Date.now()).toLocaleTimeString(locale),deDate:new Date(s.now||Date.now()).toLocaleDateString(locale,{weekday:'long',year:'numeric',month:'long',day:'numeric'}),dePdf:'./resume/hikaru-'+I.locale+'.pdf',pcCloseLabel:this._desktopSession?'Voltar ao desktop':'Levantar da cadeira'};
    });
  }};
})(window);
