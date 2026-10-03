/* Fictional system failures, isolated from actual errors and persisted visitor progress. */
(function(g){
  const failureChance=1/10,visitKey='okaru-boot-seen',rebootPromptDelay=8000;
  const errors=[
    'INITRAMFS · imagem de inicialização não encontrada',
    'ENOENT · arquivo ou diretório inexistente',
    'VFS · não foi possível montar o volume raiz',
    'EIO · erro de entrada e saída no volume simulado',
    'OUT OF BOUNDS · índice fora dos limites do buffer',
    'SEGFAULT · acesso inválido à memória simulada',
    'OOM · memória virtual de faz de conta esgotada',
    'WATCHDOG · serviço parou de responder',
    'SYSTEMD · dependência obrigatória indisponível',
    'TIMEOUT · tempo limite ao iniciar o serviço',
    'MODPROBE · módulo de cenário não encontrado',
    'EBUSY · recurso virtual ocupado',
    'IRQ · interrupção inesperada no barramento simulado',
    'ENODEV · dispositivo virtual não encontrado',
    'EROFS · tentativa de escrita em volume de leitura',
    'STACK OVERFLOW · pilha de chamadas excedida',
    'CHECKSUM · integridade da imagem fictícia inválida',
    'DEADLOCK · dependências aguardando umas pelas outras',
    'SCHEDULER · fila de processos virtuais bloqueada',
    'INVALID OPCODE · instrução simulada desconhecida',
    'BUS ERROR · endereço desalinhado no barramento',
    'RECOVERY · tentativa de restauração interrompida',
    'KERNEL PANIC · falha ao iniciar o processo principal',
    'CPU HALTED · execução do sistema simulado interrompida'
  ];
  const failureLines=()=>g.PortfolioBoot.lines.map((line,i,all)=>({...line,t:i===all.length-1?'Sistema interrompido. Aguardando recuperação.':errors[i%errors.length],note:i<all.length-8?line.t:'',tag:i%8===0?'warn':'fail',fatal:i%12===0||i===all.length-1}));
  // The failure buries the log under scareware-style pop-ups, more with every few lines, each kind with a look of its
  // own. Every brand, address and number is made up, and each pop-up says it is a simulation.
  const popupKinds=['browser','guard','classic','os','toast','term','rpg','call','blue','hang'],popupEvery=2,popupMax=48;
  const fakeUrls=['suporte-okaru.fake/verificar-virus','sistema-seguro.fake/alerta','pixelguard.fake/scan?id=1337','okaru-ajuda.fake/urgente'];
  const rand=seed=>()=>((seed=Math.imul(seed^seed>>>15,2246822507)+1013904223|0)>>>0)/4294967296;
  function popupBody(kind,i,h){
    const E=(tag,cls,...kids)=>h(tag,cls?{className:cls}:null,...kids);
    const tri=()=>h('svg',{className:'be-tri',viewBox:'0 0 40 36','aria-hidden':'true'},h('path',{d:'M20 2L38 34H2Z'}),h('rect',{x:18,y:12,width:4,height:12}),h('rect',{x:18,y:27,width:4,height:4}));
    const shield=()=>h('svg',{className:'be-shield',viewBox:'0 0 20 22','aria-hidden':'true'},h('path',{d:'M10 1L19 4V11C19 16 15 20 10 21C5 20 1 16 1 11V4Z'}));
    const sim=E('span','be-sim','simulação');
    switch(kind){
      case 'browser':return [E('div','be-chrome',E('span','be-tab','AVISO: VERIFICAÇÃO DE VÍRUS'),E('span','be-win','– □ ×')),E('div','be-url','← → ⟳ ',E('span',null,fakeUrls[i%fakeUrls.length])),
        E('div','be-body',tri(),E('strong','be-big','AVISO: SEU SISTEMA PODE TER ENCONTRADO VÍRUS'),E('p',null,'Encontramos (2) vírus de faz de conta: Rootkit.Solda.Fria e Trojan.Pixel.Art.')),sim];
      case 'guard':return [E('div','be-gh',shield(),E('b',null,'PixelGuard'),E('span',null,'| Proteção Total'),E('span','be-x','×')),E('div','be-scan',E('span',null,'Verificação rápida'),E('i','be-bar'),E('span','be-ok','Concluída')),
        E('strong','be-red','Seu PC está infectado com 5 vírus!'),E('div','be-modal',E('b',null,'AVISO!'),E('p',null,'Seu sistema está infectado com vírus imaginários e outros aplicativos de faz de conta.'),E('span','be-btn','Renovar licença')),sim];
      case 'classic':{
        // the old error that leaves a trail of copies behind it
        const copy=k=>h('div',{className:'be-cl',key:k,style:{transform:'translate('+k*12+'px,'+k*12+'px)'}},E('div','be-cl-t',E('span',null,'Erro'),E('span','be-x','×')),
          E('div','be-cl-b',E('span','be-xx','×'),E('p',null,'Okaru.exe realizou uma operação ilegal e será fechado.')),E('div','be-cl-f',E('span','be-btn','OK'),E('span','be-btn','Detalhes >>')),k===4?sim:null);
        return Array.from({length:5},(_,k)=>copy(k));
      }
      case 'os':return [E('div','be-mbar',E('i'),E('i'),E('i'),E('span',null,'okaru.os/alerta-do-dispositivo')),E('strong','be-red','Seu sistema está infectado com 3 vírus!'),
        E('div','be-inner',E('b',null,'AÇÃO IMEDIATA NECESSÁRIA'),E('p',null,'Detectamos um cavalo de Troia (os.Pixel_worm) no seu Okaru.'),E('p',null,'Pressione OK para começar o reparo.'),E('span','be-btn','Fechar')),sim];
      case 'toast':return [E('div','be-th',shield(),E('b',null,'Adware / notificações bloqueadas')),E('p',null,'Pop-ups persistentes de okaru.fake foram bloqueados.'),E('span','be-btn','Remover ameaça'),sim];
      case 'term':return [E('div','be-tt',E('i'),E('i'),E('i'),E('span',null,'bash — 80×24')),
        E('pre','be-tb','$ ./portfolio --start\n',E('span','be-err','Segmentation fault (core dumped)'),'\nkernel: okaru[1337]: segfault at 0000dead\n$ ▮'),sim];
      case 'rpg':return [E('b','be-rt','ERRO CRÍTICO!'),E('p',null,'Um BUG selvagem apareceu!'),E('p',null,'Hikaru usou CTRL+Z... Não foi muito efetivo.'),E('span','be-next','▼'),sim];
      case 'call':return [E('div','be-ch',tri(),E('b',null,'Seu computador foi bloqueado')),E('p',null,'Não desligue nem reinicie o computador.'),
        E('div','be-num','Suporte: ',E('mark',null,'0000-0000')),E('small',null,'Número de mentira. Não ligue.'),sim];
      case 'blue':return [E('b','be-face',':('),E('p',null,'O seu PC encontrou um problema e precisa reiniciar. Estamos coletando informações de faz de conta.'),E('p','be-pct','0% concluído'),sim];
      default:return [E('div','be-ht',E('span',null,'Portfólio (Não está respondendo)'),E('span','be-x','×')),E('p',null,'O programa não está respondendo. Se fechar, você poderá perder dados imaginários.'),
        E('div','be-hf',E('span','be-btn','Fechar o programa'),E('span','be-btn','Aguardar')),sim];
    }
  }
  // One pop-up every two lines, piled with a seed per boot so each failure covers the screen differently; later
  // ones land on top of the earlier ones. The screen is a 4×4 grid: each round visits every cell in a shuffled
  // order, and the four middle cells twice, so the whole screen fills up and the middle fills up most.
  const popupCells=[...Array.from({length:16},(_,c)=>c),5,6,9,10];
  function failurePopups(lines,seed,h){
    const count=Math.min(popupMax,Math.floor(lines/popupEvery)),rounds={};
    const order=round=>rounds[round]||(rounds[round]=(()=>{const r=rand(seed*131+round*977+7),list=popupCells.slice();for(let k=list.length-1;k>0;k--){const j=Math.floor(r()*(k+1));[list[k],list[j]]=[list[j],list[k]];}return list;})());
    return Array.from({length:count},(_,i)=>{
      const r=rand(seed*977+i*7919+11),kind=popupKinds[(i*7+seed)%popupKinds.length],cell=order(Math.floor(i/popupCells.length))[i%popupCells.length];
      const cx=(cell%4+.5+(r()-.5)*.8)*25,cy=(Math.floor(cell/4)+.5+(r()-.5)*.8)*25;
      return {kind,cell,cls:'be-'+kind,style:'--cx:'+cx.toFixed(1)+'%;--cy:'+cy.toFixed(1)+'%;',body:popupBody(kind,i,h)};
    });
  }
  g.PortfolioBootFlow={failureChance,visitKey,rebootPromptDelay,errors,failureLines,popupKinds,popupEvery,popupMax,popupCells,failurePopups,install(C){
    const p=C.prototype,base={};
    const wrap=(name,fn)=>{base[name]=p[name];p[name]=function(...args){return fn.call(this,base[name].bind(this),...args);};};
    wrap('persist',function(fn,...args){if(!this.hasProgress())return false;return fn(...args);});
    p.clearBootRecovery=function(){clearTimeout(this._bootRecoverT);clearTimeout(this._bootPromptT);this._bootRecoverT=null;this._bootPromptT=null;};
    p.bootHasRun=function(){try{return !!this._bootSeenInSession||this.store()?.getItem(visitKey)==='1';}catch{return !!this._bootSeenInSession;}};
    wrap('chooseLanguage',function(fn,...args){
      // Capture before choosing writes the language preference: it is independent of progress.
      if(!this._languageReady)this._firstBootPending=!this.bootHasRun()&&!this.hasProgress();
      return fn(...args);
    });
    wrap('bootLogStart',function(fn){
      if(!this._languageReady)return;
      this.clearBootRecovery();
      const first=!this.bootHasRun()&&(this._firstBootPending??(!g.PortfolioI18n.saved()&&!this.hasProgress()));
      this._bootFault=!this._bootSafe&&(first||Math.random()<failureChance);this._bootSafe=false;
      this._firstBootPending=false;this._bootSeenInSession=true;
      try{this.store()?.setItem(visitKey,'1');}catch{/* Disabled storage still remembers this session. */}
      this.data().bootLog=this._bootFault?failureLines():g.PortfolioBoot.lines;this._bootSeed=Math.floor(Math.random()*1e6);
      this.setState({bootFault:this._bootFault,bootRecovery:false,bootRebootPrompt:false});return fn();
    });
    wrap('bootLogEnd',function(fn){
      if(!this._bootFault)return fn();
      if(this._bootRecoverT||this.st().bootRecovery)return;
      clearTimeout(this._blT);this._blN=this.data().bootLog.length;
      this.setState({bootN:this._blN,bootDone:false});
      this._bootRecoverT=setTimeout(()=>{
        this._bootRecoverT=null;this.setState({bootRecovery:true});
        this._bootPromptT=setTimeout(()=>{this._bootPromptT=null;if(this.st().bootRecovery&&this.st().bootLog)this.setState({bootRebootPrompt:true});},rebootPromptDelay);
      },3500);
    });
    p.bootRecover=function(){
      const s=this.st();if(!s.bootRecovery||!s.bootLog||s.languageOpen)return;
      this.clearBootRecovery();this._bootSafe=true;this.unlock('boot-recovery');this.bootLogStart();
    };
    wrap('rootKey',function(fn,e){if(this.st().bootRecovery&&this.st().bootLog&&!this.st().languageOpen&&e.key==='Enter'){e.preventDefault();if(!e.repeat)this.bootRecover();return;}return fn(e);});
    wrap('componentWillUnmount',function(fn){this.clearBootRecovery();return fn();});
    wrap('renderVals',function(fn){
      const r=fn(),s=this.st(),failure=!!s.bootFault&&s.bootLog&&!s.languageOpen;
      r.bootFailures=failure&&!s.bootRecovery?failurePopups(s.bootN||0,this._bootSeed||0,g.React.createElement):[];
      r.bootRecovery=failure&&!!s.bootRecovery;r.bootRebootPrompt=r.bootRecovery&&!!s.bootRebootPrompt;r.bootRecover=()=>this.bootRecover();
      // Once it is fixed, a tap or click anywhere on the console reboots: phones have no Enter to press.
      const touch=this.padTouch?.()??this.coarse?.();
      r.bootRecoverText=touch?'Toque na tela para reiniciar':'Pressione Enter ou clique na tela para reiniciar';
      r.bootTap=e=>{if(e?.target?.closest?.('button'))return;if(this.st().bootRecovery)this.bootRecover();};
      if(r.bootRecovery)r.bootLines=['Problema corrigido.','Ambiente restaurado. Pronto para reiniciar.'].map(t=>({t,ts:'',dots:false,tag:'',tagCls:'',note:'',cls:'is-recovered'}));
      r.bootLines=r.bootLines.map(line=>({...line,ariaHidden:!r.bootRecovery}));
      r.bootRunning=!r.bootRecovery;r.bootMenuOn=r.isBoot&&!s.bootLog&&!s.languageOpen;
      r.bootLogCls+=(failure?' is-simulated-failure':'');return r;
    });
  }};
})(window);
