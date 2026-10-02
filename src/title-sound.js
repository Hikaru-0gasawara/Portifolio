/* Sound before Novo jogo: the title screen, the language picker with its recruiter glass and the recruiter's shortcut to the pages. */
(function(g){
  // The title theme, in the same event format as the room tracks: 64 sixteenth notes over Am, F, C and G.
  // The lead stays between E4 and G5, so nothing whistles.
  function titleTrack(){
    const ev=Array.from({length:64},()=>[]),put=(step,v)=>ev[step%64].push(v);
    const chords=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],roots=[45,41,48,43];
    chords.forEach((chord,bar)=>{
      for(let s=0;s<16;s+=2)put(bar*16+s,{m:chord[(s/2)%3]+12,len:1,type:'triangle',vol:.02});
      for(let s=0;s<16;s+=4)put(bar*16+s,{m:roots[bar]+(s%8?12:0),len:3,type:'triangle',vol:.085});
      [0,8].forEach(s=>put(bar*16+s,{drum:'kick',vol:.7}));
      [4,12].forEach(s=>put(bar*16+s,{drum:'snare',vol:.5}));
      for(let s=2;s<16;s+=4)put(bar*16+s,{drum:'hat',vol:.6});
    });
    [[0,64,3],[3,69,3],[6,72,2],[8,71,2],[10,69,2],[12,64,4],[16,65,3],[19,69,3],[22,72,2],[24,74,2],[26,72,2],[28,69,4],
      [32,67,3],[35,72,3],[38,76,2],[40,74,2],[42,72,2],[44,67,4],[48,71,2],[50,74,2],[52,79,4],[56,77,2],[58,74,2],[60,71,4]]
      .forEach(([step,m,len])=>put(step,{m,len,type:'square',vol:.026}));
    put(62,{drum:'snare',vol:.35});put(63,{drum:'snare',vol:.45});
    return {name:'Tela de título',bpm:112,len:64,ev};
  }
  // The simulated boot failure prints dozens of errors; the alarm keeps to one beep at a time.
  const bootGap={blip:900,error:900,breach:300};
  g.PortfolioTitleSound={titleTrack,bootGap,install(C){
    const p=C.prototype;
    const wrap=(name,fn)=>{const prior=p[name];p[name]=function(...args){return fn.call(this,prior.bind(this),...args);};};
    p.titleTrack=function(){return this._titleTrack||(this._titleTrack=titleTrack());};
    // The menu that waits for Novo jogo / Continuar.
    p.titleScreenOn=function(){const s=this.st();return this.curPage()==='boot'&&!this._displayStarting&&!s.bootLog&&!s.languageOpen&&!s.transitioning&&!s.powering;};
    p.titlePlaying=function(){return !!this._mus&&!!this._titleTrack&&this._mTrack===this._titleTrack;};
    p.startTitleMusic=function(){
      this.stopMusic();
      const ac=this._snd?this.audio():null;
      if(!ac||!this._mix||ac.state!=='running')return;
      try{
        const bus=ac.createGain();
        bus.gain.setValueAtTime(.0001,ac.currentTime);bus.gain.exponentialRampToValueAtTime(.8,ac.currentTime+1.2);bus.connect(this._mix);
        this._mus=bus;this._mTrack=this.titleTrack();this._mNext=ac.currentTime+.08;this._mStep=0;
      }catch{this._mus=null;this._mTrack=null;}
      this.startLoop();
    };
    // Declarative: the theme plays exactly while the title screen is up with sound on.
    p.titleMusicSync=function(){
      const want=!!this._snd&&this.titleScreenOn(),playing=this.titlePlaying();
      if(want&&!playing)this.startTitleMusic();
      else if(!want&&playing)this.stopMusic();
    };
    // Until Novo jogo chose, the sound followed nothing and stayed off: the menu, its hover and the recruiter
    // view were silent. It now starts from the saved preference (on for new visitors).
    wrap('componentDidMount',function(fn){
      const r=fn();
      if(this._snd===undefined){this._snd=this._sndPref!==false;this.setState({snd:this._snd});}
      return r;
    });
    wrap('componentDidUpdate',function(fn,...args){const r=fn(...args);this.titleMusicSync();return r;});
    // The opening television has its own sound bus; the portfolio stays quiet behind it, as before.
    wrap('sfx',function(fn,name,...args){
      if(this._displayStarting)return;
      const gap=this.st().bootLog?bootGap[name]:0;
      if(gap){const now=Date.now();if(now-(this._bootSfxAt||0)<gap)return;this._bootSfxAt=now;}
      return fn(name,...args);
    });
    // Browsers only start audio after a gesture: never create the context before the first one.
    wrap('audio',function(fn){
      if(!this._ac&&g.navigator?.userActivation&&!g.navigator.userActivation.hasBeenActive)return null;
      return fn();
    });
    wrap('toggleSnd',function(fn){const r=fn();this._sndPref=!!this._snd;this.titleMusicSync();return r;});
    // M mutes on the title screen too (the room and pages already had it).
    wrap('rootKey',function(fn,e){
      const s=this.st(),k=e.key||'',tg=e.target||{};
      if((k==='m'||k==='M')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat&&this.titleScreenOn()&&!s.recOpen&&!s.credOpen&&tg.tagName!=='INPUT'&&tg.tagName!=='TEXTAREA'){this.toggleSnd();return;}
      return fn(e);
    });
  }};
})(window);
