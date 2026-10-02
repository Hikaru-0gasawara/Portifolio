(function (g) {
  const I = g.PortfolioI18n;
  const languages = [
    {locale:'pt',lang:'pt-BR',code:'PT-BR',name:'Português',question:'Qual idioma você fala?',action:'Entrar →'},
    {locale:'en',lang:'en',code:'EN',name:'English',question:'What language do you speak?',action:'Enter →'},
    {locale:'ja',lang:'ja',code:'JP',name:'日本語',question:'どの言語を話しますか？',action:'はじめる →'}
  ];
  g.Portfolio = { install(Component) {
    const p = Component.prototype;
    const original = {};
    const wrap = (name, fn) => { original[name]=p[name]; p[name]=function(...args){return fn.call(this,original[name].bind(this),...args);}; };
    wrap('setState',function(base,...args){if(!this._dead)return base(...args);});
    wrap('data', function(base) {
      const d = base();
      if (!d.enhanced) { d.projects=g.PORTFOLIO_PROJECTS; d.bootLog=g.PortfolioBoot.lines; d.enhanced=true; }
      return d;
    });
    wrap('componentDidMount', function(base) {
      const saved=I.saved();this._languageReady=!!saved;if(saved)I.set(saved);
      base();
      document.getElementById('initial-loader')?.remove();
      this._modalKey = e => {
        const modal=this.activeDialog();
        if (!modal) return;
        if (e.key==='Tab') {
          const items=[...modal.querySelectorAll('button:not([disabled]),a[href],input,select,[tabindex="0"]')].filter(el=>el.getClientRects().length);
          if (!items.length) {e.preventDefault();return;}
          const first=items[0],last=items.at(-1),active=document.activeElement;
          if (e.shiftKey && (active===first || !modal.contains(active))) {e.preventDefault();last.focus();}
          else if (!e.shiftKey && (active===last || !modal.contains(active))) {e.preventDefault();first.focus();}
        }
        if (this.st().galleryLarge && e.key==='Escape') {e.preventDefault();e.stopImmediatePropagation();this.setState({galleryLarge:false});}
      };
      document.addEventListener('keydown',this._modalKey,true);
      this.setState({languageOpen:!saved,locale:saved||'pt'});
    });
    p.activeDialog=function(){
      const visible=[...(this._rootEl?.querySelectorAll('[role="dialog"][aria-modal="true"]')||[])].filter(el=>el.getClientRects().length);
      // The recruiter view opens from the language picker and covers it until closed.
      return visible.find(el=>el.classList.contains('gallery-zoom'))||visible.find(el=>el.classList.contains('rec'))||visible.find(el=>el.classList.contains('language-screen'))||visible.at(-1);
    };
    wrap('componentDidUpdate', function(base,...args) {
      base(...args);
      const log=this._rootEl?.querySelector('.blog-in');
      if(log)log.scrollTop=log.scrollHeight;
      const modal=this.activeDialog();
      if(modal!==this._activeDialog){
        if(modal){this._focusReturn=document.activeElement;modal.querySelector('button:not([disabled]),a[href],input,[tabindex="0"]')?.focus();}
        else if(this._focusReturn?.isConnected)this._focusReturn.focus();
        this._activeDialog=modal;
      }
    });
    wrap('componentWillUnmount',function(base){
      document.removeEventListener('keydown',this._modalKey,true);
      for(const key of ['_blT','_doorTipT','_wkHintT','_dT','_pcT','_coinT','_hdkT'])clearTimeout(this[key]);
      base();
    });
    wrap('bootLogStart',function(base){if(this._languageReady)base();});
    // boot=false: the recruiter view already took the visitor past the boot, straight to a page.
    p.chooseLanguage=function(locale,boot=true){
      const first=!this._languageReady;
      I.set(locale);this._languageReady=true;
      for(const decode of this._decs||[])if(decode.node)decode.node.nodeValue=decode.final;
      this._decs=[];this._decSeen=new WeakSet();
      this.setState({languageOpen:false,locale,paused:false,palOpen:false});
      if(this._dialogSource)this.say(this._dialogSource.text,this._dialogSource.who);
      if(first&&boot)this.bootLogStart();
    };
    // The recruiter glass sits on the first language choice. Before a language is chosen, breaking it shows the
    // recruiter view in the browser's language without saving it; leaving through one of its links keeps it.
    p.languageRushOn=function(){return !!this.st().languageOpen&&!this._languageReady;};
    wrap('openRec',function(base,...args){
      const pick=I.preferred();
      if(this.languageRushOn()&&pick!==I.locale){I.set(pick,false);this.setState({locale:pick});}
      return base(...args);
    });
    wrap('recGo',function(base,...args){
      if(this.languageRushOn())this.chooseLanguage(I.locale,false);
      return base(...args);
    });
    wrap('rootKey',function(base,e){
      if(this.st().languageOpen&&!this.st().recOpen)return;
      if(this.st().bootLog)return;
      if(this.st().galleryLarge)return;
      return base(e);
    });
    wrap('bootLogEnd',function(base){base();});
    p.skLayout=function(){return this._skL||(this._skL=g.PortfolioSkills.layout(this.data().skills));};
    wrap('say',function(base,text,...args){this._dialogSource={text,who:args[0]};return base(I.t(text),...args);});
    wrap('diffText',function(base){return I.t(base());});
    wrap('achHintText',function(base,id){const text=this.data().hints[id]||'';return I.locale==='pt'?base(id):I.t(text);});
    p.canvasText=function(ctx,text,...args){return ctx.fillText(I.t(text),...args);};
    wrap('palAll',function(base){const list=base(),at=list.findIndex(item=>item.name.includes('debug'));list.splice(at<0?0:at,0,{k:'LANG',name:'Alterar idioma',hint:'PT / EN / 日本語',kw:'idioma language lang 言語',act:()=>this.setState({languageOpen:true,paused:false,palOpen:false})});return list.filter(item=>!['PT','EN','JP'].includes(item.k)||(g.PORTFOLIO_RESUMES||[]).some(r=>r.label===item.k)).map(item=>({...item,name:I.t(item.name),hint:I.t(item.hint),kw:(item.kw||'')+' '+I.t(item.name)}));});
    wrap('scramble',function(base,el,final,...args){if(this.calm()){if(el&&final)el.textContent=I.t(final);return;}return base(el,final?I.t(final):final,...args);});
    wrap('loopTicker',function(base,dt,modal){if(!document.hidden&&!this.calm())return base(dt,modal);});
    wrap('loopModels',function(base,dt,frozen){return base(dt,frozen||document.hidden||this.calm());});
    p.galleryMove=function(delta){
      const project=this.data().projects[this.st().openProj];
      const length=project?.gallery?.length||0;
      if(length)this.setState({galleryIndex:((this.st().galleryIndex||0)+delta+length)%length});
    };
    wrap('openProj',function(base,...args){this.setState({galleryIndex:0,galleryLarge:false});return base(...args);});
    wrap('renderVals',function(base){
      const r=base(),s=this.st(),open=!!s.languageOpen;
      r.languageOpen=open;r.isBoot=r.isBoot&&!open;r.notBoot=r.notBoot&&!open;
      r.languageLabel={pt:'PT',en:'EN',ja:'日本語'}[I.locale];
      const primary=languages.find(item=>item.locale===I.locale),others=languages.filter(item=>item!==primary);
      r.languageQuestionLang=primary.lang;
      r.languageQuestion=I.nativeText(primary.question,primary.lang);
      r.languageOtherQuestions=[I.nativeText(others[0].question,others[0].lang),g.React.createElement('br',{key:'separator'}),I.nativeText(others[1].question,others[1].lang)];
      r.languageChoices=languages.map(item=>({lang:item.lang,code:item.code,name:I.nativeText(item.name,item.lang),action:I.nativeText(item.action,item.lang),choose:()=>this.chooseLanguage(item.locale)}));
      r.languageChange=()=>this.setState({languageOpen:true});
      // The glass speaks the language its recruiter view will open in.
      const rushLocale=I.preferred(),rushLang=languages.find(item=>item.locale===rushLocale).lang,rush=text=>I.nativeText(I.tIn(text,rushLocale),rushLang);
      r.languageRush=open&&!this._languageReady;r.rushLang=rushLang;
      if(r.languageRush){
        r.rushTitle=rush('Em caso de pressa');r.rushLabel=rush('MODO RECRUTADOR');r.glassHint=rush(r.glassHint);
        const down=r.glassDown;r.glassDown=e=>{if(!this._displayStarting)down(e);};
      }
      r.skNodes=r.skNodes.map(n=>({...n,aria:n.label,key:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();n.pick();}}}));
      const project=this.data().projects[typeof s.openProj==='number'?s.openProj:0]||this.data().projects[0];
      r.op={...r.op,repositoryUrl:project.repositoryUrl,hasRepository:!!project.repositoryUrl};
      const gallery=project.gallery||[],item=gallery[(s.galleryIndex||0)%Math.max(1,gallery.length)];
      r.galleryOn=!!item;r.galleryMany=gallery.length>1;r.galleryLarge=!!s.galleryLarge&&!!item;
      r.galleryImage=item?.localized?.[I.locale]||item?.src||'';r.galleryCaption=item?.caption||'';r.galleryAlt=item?.alt||item?.caption||'';
      r.galleryCount=((s.galleryIndex||0)%Math.max(1,gallery.length)+1)+' / '+gallery.length;
      r.galleryPrev=()=>this.galleryMove(-1);r.galleryNext=()=>this.galleryMove(1);
      r.galleryZoom=()=>this.setState({galleryLarge:true});r.galleryClose=()=>this.setState({galleryLarge:false});
      r.resumeLinks=g.PORTFOLIO_RESUMES||[];r.cvReady=r.resumeLinks.length>0;r.cvMissing=!r.cvReady;
      r.shooterFireDown=e=>{e.preventDefault();e.currentTarget.setPointerCapture?.(e.pointerId);this.shooterInput('fire',true);};r.shooterFireUp=()=>this.shooterInput('fire',false);
      r.shooterPause=()=>{const game=this._shooter;if(game){game.mode=game.mode==='play'?'pause':game.mode==='pause'?'play':game.mode;game.keys={};}};
      const next=r.nextProj;r.nextProj=()=>{this.setState({galleryIndex:0,galleryLarge:false});next();};
      return r;
    });
    // Order matters: each module wraps the methods left by the previous ones. A module that failed to load
    // is reported instead of silently removing its feature; the rest of the portfolio still starts.
    for(const name of modules){
      if(g[name]?.install)g[name].install(Component);
      else g.console?.error?.('Portfolio: module '+name+' is missing; its features are disabled.');
    }
  }};
  const modules=['PortfolioCharacter','PortfolioRoom','PortfolioDice','PortfolioShooter','PortfolioScene','PortfolioCharacterCare','PortfolioBootFlow','PortfolioDesktop','PortfolioPocket','PortfolioHitbox','PortfolioAchievements','PortfolioTvGame','PortfolioDisplay','PortfolioTitleSound'];
  g.Portfolio.modules=modules;
})(window);
