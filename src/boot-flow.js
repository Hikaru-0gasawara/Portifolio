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
  g.PortfolioBootFlow={failureChance,visitKey,rebootPromptDelay,errors,failureLines,install(C){
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
      this.data().bootLog=this._bootFault?failureLines():g.PortfolioBoot.lines;
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
      r.bootFailures=failure&&!s.bootRecovery?Array.from({length:Math.min(5,Math.floor((s.bootN||0)/16))},(_,i)=>({label:['Serviço indisponível','Falha no barramento','Inicialização interrompida','Memória de faz de conta esgotada','A recuperação está sendo preparada'][i],style:'left:'+(8+i*12)+'%;top:'+(12+i*10)+'%;'})):[];
      r.bootRecovery=failure&&!!s.bootRecovery;r.bootRebootPrompt=r.bootRecovery&&!!s.bootRebootPrompt;r.bootRecover=()=>this.bootRecover();
      if(r.bootRecovery)r.bootLines=['Problema corrigido.','Ambiente restaurado. Pronto para reiniciar.'].map(t=>({t,ts:'',dots:false,tag:'',tagCls:'',note:'',cls:'is-recovered'}));
      r.bootLines=r.bootLines.map(line=>({...line,ariaHidden:!r.bootRecovery}));
      r.bootRunning=!r.bootRecovery;r.bootMenuOn=r.isBoot&&!s.bootLog&&!s.languageOpen;
      r.bootLogCls+=(failure?' is-simulated-failure':'');return r;
    });
  }};
})(window);
