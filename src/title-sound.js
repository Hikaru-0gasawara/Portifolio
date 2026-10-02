/* Sound before Novo jogo: the language screen and its music, the title screen and the recruiter's shortcut to the pages. */
(function(g){
  // The language screen's theme: one loop over C, Am, F and G (64 sixteenths at 120 bpm) in three styles that share
  // the grid, so the cursor can swap them on the next sixteenth: samba for Português, rock for English and a
  // matsuri (festival) groove in the pentatonic scale for 日本語. Every lead stays between F4 and G5.
  const languageRoots=[48,45,41,43];
  const languageLeads={
    pt:[[0,72,2],[3,76,2],[6,79,3],[10,76,2],[12,74,2],[14,72,2],[16,69,2],[19,72,2],[22,76,3],[26,74,2],[28,72,2],[30,69,2],
      [32,69,2],[35,72,2],[38,77,3],[42,76,2],[44,74,2],[46,72,2],[48,71,2],[51,74,2],[54,79,3],[58,77,2],[60,74,2],[62,71,2]],
    en:[[0,67,2],[2,72,2],[4,76,4],[8,74,2],[10,72,2],[12,74,4],[16,69,2],[18,72,2],[20,76,4],[24,79,2],[26,76,2],[28,74,4],
      [32,65,2],[34,69,2],[36,72,4],[40,77,2],[42,76,2],[44,72,4],[48,67,2],[50,71,2],[52,74,4],[56,79,4],[60,77,2],[62,74,2]],
    ja:[[0,76,2],[2,79,2],[4,76,1],[5,74,1],[6,72,2],[8,74,2],[10,76,2],[12,74,1],[13,72,1],[14,69,2],[16,69,2],[18,72,2],[20,74,2],[22,76,2],[24,74,1],[25,72,1],[26,69,2],[28,67,4],
      [32,69,2],[34,72,2],[36,74,1],[37,76,1],[38,79,2],[40,76,2],[42,74,2],[44,72,4],[48,74,2],[50,76,2],[52,79,2],[54,76,1],[55,74,1],[56,72,2],[58,69,2],[60,67,2],[62,69,2]]
  };
  const languageGrooves={
    // Surdo on the second beat, a teleco-teco tamborim, shaker sixteenths and a syncopated bass.
    pt:{bass:[[0,0,3],[4,7,3],[8,0,3],[11,0,1],[12,7,3]],kick:[[0,.4],[4,.8],[8,.4],[12,.8]],snare:[],hat:[[0,.6],[3,.6],[6,.6],[8,.6],[11,.6],[14,.6]],tick:[1,2,5,7,9,10,13,15],comp:[2,6,10,13]},
    // Driving eighths, backbeat snare, eighth hats and an octave jump in the bass.
    en:{bass:[[0,0,2],[2,0,2],[4,0,2],[6,12,2],[8,0,2],[10,0,2],[12,0,2],[14,12,2]],kick:[[0,.7],[8,.7],[10,.5]],snare:[[4,.5],[12,.5]],hat:[[0,.5],[2,.5],[4,.5],[6,.5],[8,.5],[10,.5],[12,.5],[14,.5]],tick:[],comp:[0,8]},
    // Taiko on "don, don-don", a kane bell on the offbeats and a droning bass.
    ja:{bass:[[0,0,4],[4,7,2],[8,0,4],[12,7,2]],kick:[[0,.8],[3,.5],[8,.8],[10,.6],[11,.5]],snare:[[14,.3]],hat:[[2,.5],[6,.5],[10,.5],[14,.5]],tick:[1,5,9,13],comp:[0,8]}
  };
  function languageTrack(locale){
    const style=languageGrooves[locale]?locale:'pt',groove=languageGrooves[style],ev=Array.from({length:64},()=>[]),put=(step,v)=>ev[step%64].push(v);
    const chords=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]];
    languageRoots.forEach((root,bar)=>{
      const at=bar*16;
      groove.bass.forEach(([s,interval,len])=>put(at+s,{m:root+interval,len,type:'triangle',vol:.085}));
      groove.comp.forEach(s=>chords[bar].forEach(m=>put(at+s,{m,len:style==='en'?6:2,type:'triangle',vol:.018})));
      groove.kick.forEach(([s,vol])=>put(at+s,{drum:'kick',vol}));
      groove.snare.forEach(([s,vol])=>put(at+s,{drum:'snare',vol}));
      groove.hat.forEach(([s,vol])=>put(at+s,{drum:'hat',vol}));
      groove.tick.forEach(s=>put(at+s,{drum:'tick',vol:.5}));
    });
    languageLeads[style].forEach(([step,m,len])=>put(step,{m,len,type:'square',vol:style==='ja'?.03:.026,lead:true}));
    return {name:'Tela de idioma',language:style,bpm:120,len:64,ev};
  }
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
  const vizBars=28,vizNotes=6;
  g.PortfolioTitleSound={titleTrack,languageTrack,bootGap,vizBars,install(C){
    const p=C.prototype;
    const wrap=(name,fn)=>{const prior=p[name];p[name]=function(...args){return fn.call(this,prior.bind(this),...args);};};
    p.titleTrack=function(){return this._titleTrack||(this._titleTrack=titleTrack());};
    p.languageTracks=function(){return this._languageTracks||(this._languageTracks={pt:languageTrack('pt'),en:languageTrack('en'),ja:languageTrack('ja')});};
    // The language screen before the opening television has music; later language changes do not.
    p.languageScreenOn=function(){return !!this._displayStarting&&!!this.st().languageOpen;};
    p.languagePlaying=function(){return !!this._mus&&!!this._mTrack?.language;};
    // 'on' while it plays, 'ready' when sound is on but the browser still waits for a gesture, 'off' when muted.
    p.languageMusicState=function(){return !this._snd?'off':this.languagePlaying()?'on':'ready';};
    p.cursorLocale=function(){return ['pt','en','ja'][this.languageCursor?.()??0]||'pt';};
    p.startLanguageMusic=function(){
      this.stopMusic();
      const ac=this._snd?this.audio():null;
      if(!ac||!this._mix)return;
      // A context created by the gesture can still be resuming: try again once it runs, without polling.
      if(ac.state!=='running'){
        if(!this._langResume){this._langResume=true;const done=()=>{this._langResume=false;if(ac.state==='running')this.languageMusicSync();};ac.resume?.()?.then?.(done,done);}
        return;
      }
      try{
        const bus=ac.createGain();
        bus.gain.setValueAtTime(.0001,ac.currentTime);bus.gain.exponentialRampToValueAtTime(.8,ac.currentTime+.6);bus.connect(this._mix);
        this._mus=bus;this._mTrack=this.languageTracks()[this.cursorLocale()];this._mNext=ac.currentTime+.08;this._mStep=0;this._vizStep=-1;
      }catch{this._mus=null;this._mTrack=null;}
      this.startLoop();this.setState({languageMusic:true});
    };
    p.languageMusicSync=function(){
      const want=!!this._snd&&this.languageScreenOn(),playing=this.languagePlaying();
      if(want&&!playing)this.startLanguageMusic();
      else if(!want&&playing){this.stopMusic();this.setState({languageMusic:false});}
    };
    // The cursor changes the style on the next sixteenth: the grid is shared, so the groove never skips.
    p.languageMusicFollow=function(locale){if(this.languagePlaying())this._mTrack=this.languageTracks()[locale]||this._mTrack;};
    // The first click or key on the screen is the gesture browsers wait for.
    p.languageWake=function(){if(this._snd&&this.languageScreenOn()&&!this.languagePlaying()){this.audio();this.languageMusicSync();}};
    p.languageSound=function(){
      if(this._snd&&!this.languagePlaying()&&this.languageScreenOn()){this.audio();this.languageMusicSync();this.sfx('coin');return;}
      this.toggleSnd();
    };
    // A two-note cursor blip, a step higher for each option.
    p.languageBlip=function(index){
      if(!this._snd||!this._ac||this._ac.state!=='running')return;
      const base=[523,587,659][index]||523;
      try{this.tone(base,.045,'square',.028);this.tone(base*1.5,.06,'square',.024,.045);}catch{this._snd=false;}
    };
    // The equalizer under the language screen follows the sixteenth that is sounding now: drums lift the low bars,
    // notes lift the bar at their pitch and the lead lets a note float up. Movimento reduzido keeps it still.
    p.languageVizFrame=function(){
      const el=this._langViz,deck=this._langDeck,tr=this._mTrack,ac=this._ac;
      const live=!!(el?.isConnected&&tr?.language&&this._mus&&ac&&!this.calm?.());
      if(el&&el.dataset.live!==(live?'1':'0'))el.dataset.live=live?'1':'0';
      if(!live)return;
      const now=g.performance?.now?.()??Date.now(),dt=Math.min(64,now-(this._vizAt||now));this._vizAt=now;
      const spb=60/tr.bpm/4,cur=((this._mStep-Math.ceil((this._mNext-ac.currentTime)/spb))%tr.len+tr.len)%tr.len;
      const bars=this._vizBars||(this._vizBars=[...el.querySelectorAll('.language-bar')]),notes=this._vizNotes||(this._vizNotes=[...el.querySelectorAll('.language-note')]);
      const lv=this._vizLv||(this._vizLv=new Array(bars.length).fill(0)),pk=this._vizPk||(this._vizPk=new Array(bars.length).fill(0)),n=bars.length;
      if(cur!==this._vizStep){
        this._vizStep=cur;
        const bump=(i,v)=>{for(let d=-2;d<=2;d++){const j=i+d;if(j>=0&&j<n)lv[j]=Math.min(1,Math.max(lv[j],v*(1-Math.abs(d)*.32)));}};
        for(const ev of tr.ev[cur]){
          if(ev.drum==='kick')bump(2,.95*(ev.vol||1));
          else if(ev.drum==='snare')bump(Math.round(n*.45),.8);
          else if(ev.drum)bump(n-3-Math.floor(Math.random()*4),.45);
          else{
            const i=Math.round(Math.max(0,Math.min(1,(ev.m-40)/40))*(n-1));bump(i,ev.lead?1:.6);
            if(ev.lead&&notes.length){const b=notes[this._vizNote=(this._vizNote+1||0)%notes.length];b.style.setProperty('--x',(i/(n-1)*100).toFixed(1)+'%');b.dataset.up=b.dataset.up==='a'?'b':'a';}
          }
        }
        // The deck shows the bar being played: the sounding sixteenth lit, the kicks marked.
        const cells=deck?this._vizCells||(this._vizCells=[...deck.querySelectorAll('.language-step')]):[];
        cells.forEach((c,i)=>{
          const on=i===cur%16?'1':'0',hit=tr.ev[Math.floor(cur/16)*16+i]?.some(e=>e.drum==='kick')?'1':'0';
          if(c.dataset.on!==on)c.dataset.on=on;if(c.dataset.hit!==hit)c.dataset.hit=hit;
        });
      }
      const fall=Math.exp(-dt/170);
      bars.forEach((bar,i)=>{
        lv[i]*=fall;pk[i]=Math.max(lv[i],pk[i]-dt/1100);
        const q=Math.round(lv[i]*12)/12,qp=Math.round(pk[i]*12)/12;
        if(bar._q!==q){bar._q=q;bar.style.setProperty('--lv',String(q));}
        if(bar._qp!==qp){bar._qp=qp;bar.style.setProperty('--pk',String(qp));}
      });
    };
    wrap('loopMusic',function(fn,...args){const r=fn(...args);this.languageVizFrame();return r;});
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
    wrap('componentDidUpdate',function(fn,...args){const r=fn(...args);this.titleMusicSync();this.languageMusicSync();return r;});
    // The opening television has its own sound bus; the portfolio stays quiet behind it, except for the language
    // screen before it and the recruiter view opened over it.
    wrap('sfx',function(fn,name,...args){
      const s=this.st();
      if(this._displayStarting&&!s.languageOpen&&!s.recOpen)return;
      const gap=this.st().bootLog?bootGap[name]:0;
      if(gap){const now=Date.now();if(now-(this._bootSfxAt||0)<gap)return;this._bootSfxAt=now;}
      return fn(name,...args);
    });
    // Browsers only start audio after a gesture: never create the context before the first one.
    wrap('audio',function(fn){
      if(!this._ac&&g.navigator?.userActivation&&!g.navigator.userActivation.hasBeenActive)return null;
      return fn();
    });
    wrap('toggleSnd',function(fn){const r=fn();this._sndPref=!!this._snd;this.titleMusicSync();this.languageMusicSync();return r;});
    // The language screen's equalizer, its floating notes and its step deck are driven straight from the music.
    wrap('renderVals',function(fn){
      const r=fn();
      r.languageBars=this._langBarList||(this._langBarList=Array.from({length:vizBars},(_,i)=>({style:'--i:'+i})));
      r.languageNotes=this._langNoteList||(this._langNoteList=Array.from({length:vizNotes},(_,i)=>({style:'--n:'+i})));
      r.languageSteps=this._langStepList||(this._langStepList=Array.from({length:16},(_,i)=>({cls:i%4?'':'is-beat'})));
      r.setLanguageViz=this._langVizRef||(this._langVizRef=el=>{this._langViz=el;this._vizBars=this._vizNotes=this._vizLv=this._vizPk=null;});
      r.setLanguageDeck=this._langDeckRef||(this._langDeckRef=el=>{this._langDeck=el;this._vizCells=null;});
      return r;
    });
    // M mutes on the title screen too (the room and pages already had it).
    wrap('rootKey',function(fn,e){
      const s=this.st(),k=e.key||'',tg=e.target||{};
      if((k==='m'||k==='M')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat&&this.titleScreenOn()&&!s.recOpen&&!s.credOpen&&tg.tagName!=='INPUT'&&tg.tagName!=='TEXTAREA'){this.toggleSnd();return;}
      return fn(e);
    });
  }};
})(window);
