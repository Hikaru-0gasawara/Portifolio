(function (g) {
  const I = g.PortfolioI18n;
  // Each choice speaks its own language: the greeting, the style its music turns into and the sound labels follow
  // the option under the cursor.
  const languages = [
    {locale:'pt',lang:'pt-BR',code:'PT-BR',name:'Português',question:'Qual idioma você fala?',action:'Entrar →',hello:'Olá!',style:'samba 8-bit',now:'Tocando agora',play:'Tocar música',on:'Música ligada',off:'Música desligada'},
    {locale:'en',lang:'en',code:'EN',name:'English',question:'What language do you speak?',action:'Enter →',hello:'Hello!',style:'8-bit rock',now:'Now playing',play:'Play music',on:'Music on',off:'Music off'},
    {locale:'ja',lang:'ja',code:'JP',name:'日本語',question:'どの言語を話しますか？',action:'はじめる →',hello:'こんにちは！',style:'8ビット祭り',now:'再生中',play:'音楽を再生',on:'音楽オン',off:'音楽オフ'}
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
      // A first visit is greeted in the browser's language, shown but not saved until a choice is made.
      if(!saved)I.set(I.preferred(),false);
      this.setState({languageOpen:!saved,locale:I.locale,langCursor:languages.findIndex(item=>item.locale===I.locale)});
    });
    p.activeDialog=function(){
      const visible=[...(this._rootEl?.querySelectorAll('[role="dialog"][aria-modal="true"]')||[])].filter(el=>el.getClientRects().length);
      // The recruiter view opens over the opening television and covers it until closed.
      return visible.find(el=>el.classList.contains('gallery-zoom'))||visible.find(el=>el.classList.contains('rec'))||visible.find(el=>el.classList.contains('language-screen'))||visible.at(-1);
    };
    wrap('componentDidUpdate', function(base,...args) {
      base(...args);
      const log=this._rootEl?.querySelector('.blog-in');
      if(log)log.scrollTop=log.scrollHeight;
      const modal=this.activeDialog();
      if(modal!==this._activeDialog){
        // The language screen starts on the option under its cursor, not on the sound button above it. The opening
        // television keeps the focus on the portfolio itself, where Enter, the arrows and the channel keys work.
        if(modal?.classList.contains('tv-power-gate')){this._focusReturn=null;this.focusRoot();}
        else if(modal){this._focusReturn=document.activeElement;(modal.querySelector('.language-options .is-cur')||modal.querySelector('button:not([disabled]),a[href],input,[tabindex="0"]'))?.focus();}
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
      this.setState({languageOpen:false,locale,paused:false,palOpen:false,langCursor:languages.findIndex(item=>item.locale===locale)});
      if(this._dialogSource)this.say(this._dialogSource.text,this._dialogSource.who);
      if(first&&boot)this.bootLogStart();
    };
    // The picker is a game menu: a cursor follows the pointer, focus and the arrow keys, with a blip per move.
    p.languageCursor=function(){
      const at=this.st().langCursor;
      return Number.isInteger(at)&&at>=0&&at<languages.length?at:Math.max(0,languages.findIndex(item=>item.locale===I.locale));
    };
    // Focus follows the cursor, so the pointer and the keyboard never highlight two options at once.
    p.languagePoint=function(index,focus){
      if(focus)this._rootEl?.querySelectorAll('.language-screen .language-options button')[index]?.focus({preventScroll:true});
      if(index===this.languageCursor())return;
      this.setState({langCursor:index});
      this.languageBlip?.(index);this.languageMusicFollow?.(languages[index].locale);
    };
    p.languageKey=function(e){
      const k=e.key||'',at=this.languageCursor(),step={ArrowUp:-1,ArrowLeft:-1,w:-1,W:-1,ArrowDown:1,ArrowRight:1,s:1,S:1}[k];
      if(e.ctrlKey||e.metaKey||e.altKey)return;
      // A key press is a gesture: the music may start here.
      this.languageWake?.();
      if(step){e.preventDefault();this.languagePoint((at+step+languages.length)%languages.length,true);return;}
      if(k==='Home'||k==='End'){e.preventDefault();this.languagePoint(k==='Home'?0:languages.length-1,true);return;}
      if((k==='m'||k==='M')&&!e.repeat){e.preventDefault();this.languageSound?.();return;}
      // Native buttons take their own Enter and space; anywhere else they confirm the option under the cursor.
      if((k==='Enter'||k===' ')&&!e.repeat&&!e.target?.closest?.('button')){e.preventDefault();this.languagePick(at);}
    };
    p.languagePick=function(index){const item=languages[index];if(!item)return;this.sfx(this._displayStarting?'start':'select');this.chooseLanguage(item.locale);};
    // The menu has its own cursor blips; the generic hover tick stays out of it.
    wrap('hoverSfx',function(base,e){if(e?.target?.closest?.('.language-screen'))return;return base(e);});
    wrap('rootKey',function(base,e){
      if(this.st().languageOpen&&!this.st().recOpen){this.languageKey(e);return;}
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
      // The big question speaks the language under the cursor (pointer, focus or arrows); the other two stay small
      // below it. All three big versions share one grid cell, so swapping them never moves the options.
      const cursor=this.languageCursor(),current=languages[cursor],native=text=>I.nativeText(text,current.lang),others=languages.filter(item=>item!==current);
      r.languageQuestionLang=current.lang;
      r.languageQuestion=I.nativeText(current.question,current.lang);
      r.languageQuestions=languages.map(item=>({lang:item.lang,text:I.nativeText(item.question,item.lang),cls:item===current?'is-on':'',hidden:item!==current}));
      r.languageOtherQuestions=others.map(item=>I.nativeText(item.question,item.lang));
      r.languageChoices=languages.map((item,i)=>({lang:item.lang,code:item.code,name:I.nativeText(item.name,item.lang),action:I.nativeText(item.action,item.lang),hello:I.nativeText(item.hello,item.lang),
        cls:i===cursor?'is-cur':'',choose:()=>this.languagePick(i),point:e=>this.languagePoint(i,e?.type==='pointerenter')}));
      r.languageChange=()=>this.setState({languageOpen:true});
      r.languageFoot=languages.flatMap((item,i)=>[...(i?[' / ']:[]),I.nativeText({pt:'Idioma',en:'Language',ja:'言語'}[item.locale],item.lang)]);
      // The music deck and the sound button speak the language under the cursor.
      const music=this.languageMusicState?.()||'off';
      r.languageNowLang=current.lang;r.languageNow=native((music==='on'?current.now:music==='ready'?current.play:current.off)+' · '+current.style);
      r.languageSndLabel=native(music==='on'?current.on:music==='ready'?current.play:current.off);r.languageSndPressed=music==='on';
      // Only the entrance has music; a later language change keeps the menu without the deck and its button.
      r.languageScreenCls='is-cursor-'+current.locale+(music==='on'?' is-playing':'')+(this.languageScreenOn?.()?' is-entry':'');
      r.languageSound=()=>this.languageSound?.();r.languageWake=()=>this.languageWake?.();
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
  const modules=['PortfolioCharacter','PortfolioRoom','PortfolioDice','PortfolioShooter','PortfolioScene','PortfolioCharacterCare','PortfolioBootFlow','PortfolioDesktop','PortfolioPocket','PortfolioHitbox','PortfolioAchievements','PortfolioTvGame','PortfolioDisplay','PortfolioTitleSound','PortfolioGamepad'];
  g.Portfolio.modules=modules;
})(window);
