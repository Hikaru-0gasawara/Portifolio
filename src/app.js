class Component extends DCLogic {
  componentDidMount() {
    this._got = this._got || {};
    this._visited = {};
    this._visited[this.curPage()] = true;
    this._born = Date.now();
    this._dead = false;
    this._mEl = {};
    this._rot = { hw: { rx: -24, ry: -32, vy: 0.014 }, sw: { rx: -20, ry: 28, vy: -0.012 } };
    this._spun = {};
    this._ft = [];
    this._decs = [];
    this._decSeen = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
    this._qual = 'auto';
    this._autoLvl = 'alta';
    this._arcHi = this.data().arcDefault.map((r) => r.slice());
    this._fichas = this.fichaStart();
    this._fichaGot = {};
    this._moves = {};
    this._snakeHi = 0;
    this._pcHi = 0;
    this._miniHi = {};
    this._bubCoin = Math.floor(Math.random() * 24);
    this.loadSave();
    this.measureLoad();
    this.rmImg();
    this._tick = setInterval(() => {
      const s = this.state || {};
      if (!s.seis || s.deOpen) this.setState({ now: Date.now() });
      this.checkOwl();
      this._tickN = (this._tickN || 0) + 1;
      if (this._tickN % 30 === 0 && this.curPage() !== 'boot') this.persist(false);
    }, 1000);
    this.setState({ now: Date.now() });
    this.startLoop();
    if (this.curPage() === 'boot') this.bootLogStart();
    this._onBlur = () => {
      if (this._rm) this._rm.held = [];
      this._wKeys = {};
    };
    // when focus drops to <body> (a clicked button unmounted, an overlay closed), the page keys
    // would go nowhere; route them to the same handlers the root uses
    const outside = (e) => !(this._rootEl && this._rootEl.contains && this._rootEl.contains(e.target));
    this._onWinKey = (e) => { if (outside(e)) this.rootKey(e); };
    this._onWinKeyUp = (e) => { if (outside(e)) this.rootKeyUp(e); };
    // page clicks are caught first (capture) so the little guy can act them out
    this._onPoke = (e) => this.pokeCapture(e);
    try {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('blur', this._onBlur);
        window.addEventListener('keydown', this._onWinKey);
        window.addEventListener('keyup', this._onWinKeyUp);
        window.addEventListener('click', this._onPoke, true);
      }
    } catch (err) {
      this._onBlur = null;
    }
  }

  measureLoad() {
    this._ttfb = '';
    try {
      const pf = typeof performance !== 'undefined' ? performance : null;
      if (!pf) return;
      const nav = pf.getEntriesByType ? pf.getEntriesByType('navigation')[0] : null;
      let v = nav && nav.responseStart > 0 ? nav.responseStart : 0;
      if (!v && pf.timing && pf.timing.responseStart && pf.timing.navigationStart) v = pf.timing.responseStart - pf.timing.navigationStart;
      if (v >= 1 && v < 60000) this._ttfb = 'ttfb ' + Math.round(v) + ' ms';
      else if (pf.now) this._ttfb = 'boot ' + Math.round(pf.now()) + ' ms';
    } catch (err) {
      this._ttfb = '';
    }
  }

  store() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage;
    } catch (err) {
      return null;
    }
  }

  loadSave() {
    this._saveOk = false;
    this._hadSave = false;
    const ls = this.store();
    if (!ls) return;
    let raw = null;
    try {
      raw = ls.getItem('okaru-save-v1');
      this._saveOk = true;
    } catch (err) {
      this._saveOk = false;
      return;
    }
    if (!raw) return;
    let sv = null;
    try {
      sv = JSON.parse(raw);
    } catch (err) {
      sv = null;
    }
    if (!sv || sv.v !== 1) return;
    const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
    const ids = {};
    this.data().trophies.forEach((t) => { ids[t.id] = true; });
    this._got = {};
    Object.keys(obj(sv.got)).forEach((k) => { if (ids[k] && sv.got[k] === true) this._got[k] = true; });
    this._visited = Object.assign({}, obj(sv.visited), this._visited || {});
    this._quests = obj(sv.quests);
    this._seen = obj(sv.seen);
    this._gamesRead = obj(sv.games);
    this._recipes = obj(sv.recipes);
    this._roomSeen = obj(sv.room);
    // Older saves inferred the tutorial from explored objects; new saves record it explicitly.
    this._rmIntroShown = sv.roomIntro === true || (sv.roomIntro === undefined && this.roomSeenN() > 2);
    this._plushMeet = obj(sv.plush);
    this._galleryRead = obj(sv.gallery);
    this._spun = obj(sv.spun);
    this._heard = obj(sv.heard);
    this._fichaGot = obj(sv.fgot);
    this._moves = obj(sv.moves);
    this._snakeHi = Math.max(0, Math.floor(+sv.snake || 0));
    this._pcHi = Math.max(0, Math.floor(+sv.pc || 0));
    this._miniHi = obj(sv.mini);
    this._coinSpot = this.coinValid(sv.coin);
    // fv 2: the counter became the big digit on Contato and new visitors start with fichaStart();
    // older saves (from the 3-ficha era) get a fresh handful once
    if (sv.fv === 2 && typeof sv.fichas === 'number' && isFinite(sv.fichas)) this._fichas = Math.max(0, Math.min(9, Math.floor(sv.fichas)));
    if (Array.isArray(sv.hi) && sv.hi.length === 5) this._arcHi = sv.hi.map((r) => [String((r && r[0]) || 'AAA').slice(0, 3), Math.max(0, Math.floor(+(r && r[1]) || 0))]);
    if (['auto', 'alta', 'media', 'eco'].indexOf(sv.qual) >= 0) this._qual = sv.qual;
    this._playMs = Math.max(0, +sv.play || 0);
    this._lastPage = typeof sv.last === 'string' ? sv.last : '';
    this._savedAt = +sv.at || 0;
    this._diffDone = !!sv.diff;
    this._sndPref = typeof sv.snd === 'boolean' ? sv.snd : undefined;
    this._hadSave = true;
    const st = {
      got: this._got,
      fichas: this._fichas,
      gamesRead: Object.keys(this._gamesRead).length,
      recipesN: Object.keys(this._recipes).length,
      roomSeenN: this.roomSeenN(),
      coinSpot: this._coinSpot
    };
    if (sv.main === 'hw' || sv.main === 'sw' || sv.main === 'sec') st.main = sv.main;
    if (this._diffDone) st.diffStep = 3;
    if (sv.bent) st.bent = true;
    this.setState(st);
  }

  persist(icon) {
    if (this._noSave) return false;
    const ls = this.store();
    if (!ls) return false;
    const now = Date.now();
    const s = this.st();
    const page = this.curPage();
    const sv = {
      v: 1,
      at: now,
      got: this._got || {},
      visited: this._visited || {},
      quests: this._quests || {},
      seen: this._seen || {},
      games: this._gamesRead || {},
      recipes: this._recipes || {},
      room: this._roomSeen || {},
      roomIntro: !!this._rmIntroShown,
      plush: this._plushMeet || {},
      gallery: this._galleryRead || {},
      spun: this._spun || {},
      heard: this._heard || {},
      fichas: this.fichaN(),
      fv: 2,
      fgot: this._fichaGot || {},
      moves: this._moves || {},
      snake: this._snakeHi || 0,
      pc: this._pcHi || 0,
      mini: this._miniHi || {},
      coin: this._coinSpot || null,
      hi: this.arcHi(),
      qual: this._qual || 'auto',
      main: s.main || '',
      snd: !!this._snd,
      bent: !!s.bent,
      diff: !!this._diffDone,
      last: page !== 'boot' ? page : (this._lastPage || ''),
      play: (this._playMs || 0) + (now - (this._born || now))
    };
    try {
      ls.setItem('okaru-save-v1', JSON.stringify(sv));
      this._saveOk = true;
    } catch (err) {
      this._saveOk = false;
      return false;
    }
    this._lastPage = sv.last;
    this._savedAt = now;
    this._hadSave = true;
    if (icon && now - (this._svIconAt || 0) > 4000) {
      this._svIconAt = now;
      this.setState({ savingIcon: true });
      clearTimeout(this._svT);
      this._svT = setTimeout(() => this.setState({ savingIcon: false }), 1500);
    }
    return true;
  }

  persistSoon() {
    clearTimeout(this._persistT);
    this._persistT = setTimeout(() => this.persist(false), 800);
  }

  eraseSave() {
    const s = this.st();
    if (this._noSave) {
      this._noSave = false;
      this.persist(true);
      this.sfx('coin');
      this.setState({ eraseArm: false, saveTick: Date.now() });
      return;
    }
    if (!s.eraseArm) {
      this.sfx('error');
      this.setState({ eraseArm: true });
      clearTimeout(this._eraseT);
      this._eraseT = setTimeout(() => this.setState({ eraseArm: false }), 3000);
      return;
    }
    clearTimeout(this._eraseT);
    const ls = this.store();
    try {
      if (ls) ls.removeItem('okaru-save-v1');
    } catch (err) {
      this._saveOk = false;
    }
    this._noSave = true;
    this._hadSave = false;
    this.sfx('off');
    this.setState({ eraseArm: false, saveTick: Date.now() });
  }

  wipeProgress() {
    this._got = {};
    this._visited = { boot: true };
    this._quests = {};
    this._seen = {};
    this._gamesRead = {};
    this._recipes = {};
    this._roomSeen = {};
    this._plushMeet = {};
    this._galleryRead = {};
    this._pocket = null;
    this._gbSnake = false;
    this._desktopSession = false;
    this._rmIntroShown = false;
    this._rm = null;
    this._spun = {};
    this._heard = {};
    this._playMs = 0;
    this._born = Date.now();
    this._lastPage = '';
    this._diffDone = false;
    this._diffStarted = false;
    this._reboots = 0;
    this._noSave = false;
    this._dlg = null;
    this._fichas = this.fichaStart();
    this._fichaGot = {};
    this._moves = {};
    this._snakeHi = 0;
    this._pcHi = 0;
    this._miniHi = {};
    this._mini = null;
    this._snake = null;
    this._coinSpot = null;
    this._arcHi = this.data().arcDefault.map((r) => r.slice());
    const ls = this.store();
    try {
      if (ls) ls.removeItem('okaru-save-v1');
    } catch (err) {
      this._saveOk = false;
    }
    this._hadSave = false;
    this.setState({ got: {}, main: 'hw', gamesRead: 0, recipesN: 0, roomSeenN: 0, diffStep: 0, bent: false, bench: [-1, -1], benchSt: '', bub: {}, reboots: 0, dlgText: '', roomObj: -1, broke: false, safeOpen: false, coined: false, gameOpen: -1, inv: 0, furi: false, fichas: this.fichaStart(), snakeMode: 'off', lcdList: false, padFx: null, padSeq: [], coinSpot: null, ctl: 'hitbox', hitFighter: 'ryu', hitResult: '', deOpen: false, deView: 'home' });
  }

  newGame(snd = true) {
    if (this.st().bootLog) return;
    if (this.canContinue() && !this.st().newArm) {
      this.sfx('error');
      this.setState({ newArm: true });
      clearTimeout(this._newT);
      this._newT = setTimeout(() => this.setState({ newArm: false }), 3000);
      return;
    }
    clearTimeout(this._newT);
    // Keep the newcomer boot-recovery trophy; reset exploration only when it exists.
    if (this.hasProgress()) this.wipeProgress();
    this.setState({ newArm: false });
    this.pressStart(snd, true);
  }

  continueGame(snd = true) {
    if (!this.canContinue()) return;
    this.pressStart(snd);
  }

  checkOwl() {
    if ((this._got || {}).owl || this.curPage() === 'boot') return;
    try {
      if (!this._hourFmt) this._hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hourCycle: 'h23' });
      const h = parseInt(this._hourFmt.format(Date.now()), 10);
      if (h >= 0 && h < 5) this.unlock('owl');
    } catch (err) {
      this._hourFmt = null;
    }
  }

  componentWillUnmount() {
    try {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        if (this._onBlur) window.removeEventListener('blur', this._onBlur);
        if (this._onWinKey) window.removeEventListener('keydown', this._onWinKey);
        if (this._onWinKeyUp) window.removeEventListener('keyup', this._onWinKeyUp);
        if (this._onPoke) window.removeEventListener('click', this._onPoke, true);
      }
    } catch (err) {
      this._onBlur = null;
    }
    clearInterval(this._tick);
    this._dead = true;
    if (this._raf && typeof window !== 'undefined' && window.cancelAnimationFrame) window.cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._tk = null;
    this._mEl = {};
    ['_t1', '_t2', '_t3', '_toastT', '_tremT', '_seisT', '_cmdT', '_copyT', '_toesT', '_safeT', '_zzT', '_zzT2', '_benchT', '_palT', '_shT', '_recT', '_credT', '_credT2', '_panicT', '_panicT2', '_dfT1', '_dfT2', '_pwrT', '_newT', '_eraseT', '_svT', '_persistT'].forEach((k) => clearTimeout(this[k]));
    if (this._io && this._io.disconnect) this._io.disconnect();
    this.persist(false);
    try {
      if (this._ac && this._ac.close) this._ac.close();
    } catch (err) {
      this._ac = null;
    }
  }

  componentDidUpdate() {
    if (this._scrollTerm && this._termBody) {
      this._termBody.scrollTop = this._termBody.scrollHeight;
      this._scrollTerm = false;
    }
    if (this._palScroll && this._palList) {
      this._palScroll = false;
      const el = this._palList.querySelector ? this._palList.querySelector('.is-sel') : null;
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }
  }

  st() { return this.state || {}; }

  // the scrolling <section class="screen"> of the current page (only one is mounted at a time)
  screenEl() {
    const r = this._rootEl;
    if (!r || !r.querySelector) return null;
    try {
      return r.querySelector('.stage .screen');
    } catch (err) {
      return null;
    }
  }

  curPage() {
    const ok = ['boot', 'inicio', 'projetos', 'lab', 'sobre', 'quarto', 'contato'];
    const s = this.st();
    if (s.page) return s.page;
    return ok.indexOf(this.props.startScreen) >= 0 ? this.props.startScreen : 'boot';
  }

  data() {
    if (this._d) return this._d;
    const d = {};
    // the regular site has four pages; the room and the lab live inside the game
    d.nav = [['inicio', 'Início'], ['projetos', 'Projetos'], ['sobre', 'Sobre'], ['contato', 'Contato']];
    d.trophies = [
      { id: 'start', ic: 'M3 12a5 5 0 0 1 5-5h8a5 5 0 0 1 0 10H8a5 5 0 0 1-5-5z M10.5 9.6l4 2.4-4 2.4z', name: 'Press Start', goal: 'Ligue o sistema.', done: 'Ligou o sistema.' },
      { id: 'main', ic: 'M12 21v-6 M12 15L6.5 9.5V4.5 M12 15l5.5-5.5V4.5 M4.5 6.5l2-2 2 2 M15.5 6.5l2-2 2 2', name: 'Main escolhido', goal: 'Escolha entre hardware, software e segurança.', done: 'Escolheu um main. Todos valem.' },
      { id: 'explorer', ic: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z M12 12h.01', name: 'Explorador', goal: 'Visite todas as telas.', done: 'Viu tudo. Ou quase tudo.' },
      { id: 'questlog', ic: 'M3 5.5c3-1.2 6-1 9 1 3-2 6-2.2 9-1v13c-3-1.2-6-1-9 1-3-2-6-2.2-9-1z M12 6.5v13 M6 9.5h3 M6 12.5h3 M15 9.5h3 M15 12.5h3', name: 'Leitor de missões', goal: 'Abra as 4 missões principais.', done: 'Leu o quest log inteiro.' },
      { id: 'collector', ic: 'M4 10.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z M4 10.5V9a4.5 4.5 0 0 1 4.5-4.5h7A4.5 4.5 0 0 1 20 9v1.5 M10.5 10.5v3.5h3v-3.5 M4 14.5h6.5 M13.5 14.5H20', name: 'Colecionador', goal: 'Inspecione os 26 itens do inventário.', done: 'Conferiu o inventário item por item.' },
      { id: 'lore', ic: 'M7.5 8h9a4 4 0 0 1 3.9 3.2l.9 4.4a2.4 2.4 0 0 1-4.2 2L15.5 16h-7l-1.6 1.6a2.4 2.4 0 0 1-4.2-2l.9-4.4A4 4 0 0 1 7.5 8z M8 10.5v3 M6.5 12h3 M15.5 11h.01 M17.5 13h.01', name: 'Gamer de carteirinha', goal: 'Leia a nota de cada jogo no Sobre.', done: 'Conhece a biblioteca inteira.' },
      { id: 'furigana', ic: 'M12 3v5 M7.5 4.5L9 7 M16.5 4.5L15 7 M4 10h16 M10 10c0 4.8-1.8 8-5.5 10 M14 10v8.5c0 1 .5 1.5 1.5 1.5h3.2c.8 0 1.2-.5 1.3-1.6', name: 'Furigana', goal: 'Descubra como se lê meu nome.', done: 'Aprendeu a ler 小笠原 光.' },
      { id: 'special', ic: 'M15 7.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z M15 10a2 2 0 1 1-2 2 M9.5 9.5H4 M9.8 12H2.5 M9.5 14.5H5', name: 'Golpe especial', goal: 'Solte um golpe da lista no controle do Sobre.', done: 'A lista de golpes não era enfeite.' },
      { id: 'konami', ic: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z M12 6v1 M12 17v1 M6 12h1 M17 12h1', name: '↑↑↓↓←→←→BA', goal: 'Use o código clássico no controle.', done: '30 vidas extras.' },
      { id: 'sudo', ic: 'M7 17.5v-5a5 5 0 0 1 10 0v5 M5 17.5h14v3H5z M12 2.5v2.2 M4.2 5.7l1.6 1.6 M19.8 5.7l-1.6 1.6 M10 13a2 2 0 0 1 2-2', name: 'Sem sudo', goal: 'Tente virar root no terminal do lab.', done: 'Tentou virar root. Foi reportado.' },
      { id: 'speed', ic: 'M12 7.5a6.8 6.8 0 1 0 0 13.6a6.8 6.8 0 1 0 0-13.6z M12 10.5V14l2.2 1.6 M10 3h4 M12 3v4.5 M18 7.2l1.6-1.6', name: 'Speedrun any%', goal: 'Do Press Start ao contato em até 15 s.', done: 'Chegou no save point voando.' },
      { id: 'rage', ic: 'M12 3v8 M16.8 6.6a7.8 7.8 0 1 1-9.6 0', name: 'Rage quit', goal: 'Desligue o sistema no botão de energia.', done: 'Desligou no meio da partida.' },
      { id: 'save', ic: 'M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4z M8 4v4.5h7V4 M8 20v-6h8v6', name: 'Save point', goal: 'Insira uma ficha no contato.', done: 'Ficha inserida, e-mail copiado. Até já.' },
      { id: 'room', ic: 'M6 3.5l11.5 8.2-5 1 2.9 5.9-2.3 1.1-2.9-5.9L6 17.3z', name: 'Aponte e clique', goal: 'Examine todos os objetos do quarto.', done: 'Nada no quarto escapou.' },
      { id: 'spin', ic: 'M12 7l5 2.8v5.7L12 18.3l-5-2.8V9.8z M7 9.8l5 2.8 5-2.8 M12 12.6v5.7 M3.8 10A8.6 8.6 0 0 1 17 4.3 M17 4.3l-.6 2.6 M17 4.3l-2.6-.4', name: 'Engenharia reversa', goal: 'Gire um modelo 3D do início uma volta inteira.', done: 'Olhou a placa por todos os ângulos.' },
      { id: 'craft', ic: 'M3 7.5h13.5c0 2.2 1.8 3.8 4.5 4v1.5c-3.6 0-5 1.6-5 3.8V17H8v-.3c0-2-1.5-3.2-4-3.5z M6 20.5h12 M9.5 17v3.5 M14.5 17v3.5', name: 'Primeira receita', goal: 'Combine dois itens na bancada do lab.', done: 'Craftou o primeiro projeto.' },
      { id: 'palette', ic: 'M4.5 4.5h15a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z M9.5 8.5v7 M14.5 8.5L9.5 12.3 M11.3 11l3.4 4.5', name: 'Power user', goal: 'Execute um comando pela paleta (ctrl+k).', done: 'Navegou sem tirar a mão do teclado.' },
      { id: 'bubbles', ic: 'M8.5 10a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9z M16.5 3.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M17.5 13.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z M6.3 13.2a2.2 2.2 0 0 1 1.9-1.1', name: 'Estoura tudo', goal: 'Estoure uma folha inteira de plástico-bolha.', done: 'A ansiedade de esperar resposta agradece.' },
      { id: 'glass', ic: 'M4 4h16v16H4z M12.5 4l-1.5 4.5 2.5 2.5-2.5 3.5 1 5.5 M11 8.5L4 7.5 M13.5 11l6.5-1.5 M11 14.5l-7 2.5', name: 'Em caso de emergência', goal: 'Quebre o vidro do modo recrutador.', done: 'Quebrou o vidro. O essencial estava lá dentro.' },
      { id: 'arcade', ic: 'M8.5 5l1.5 2.5h4L15.5 5 M5.5 8.5h13v6h-13z M3.5 10.5v5 M20.5 10.5v5 M8.5 14.5l-2 3.5 M15.5 14.5l2 3.5 M10.5 17.5h3 M9.5 11.2h.01 M14.5 11.2h.01', name: 'Firewall humano', goal: 'Faça 3.000 pontos no Packet Invaders.', done: 'Segurou a LAN no braço.' },
      { id: 'dj', ic: 'M4 15.5V12a8 8 0 0 1 16 0v3.5 M4 15.5A2.5 2.5 0 0 1 6.5 13H8v7H6.5A2.5 2.5 0 0 1 4 17.5z M20 15.5a2.5 2.5 0 0 0-2.5-2.5H16v7h1.5a2.5 2.5 0 0 0 2.5-2.5z', name: 'DJ do quarto', goal: 'Ouça as 3 faixas da trilha.', done: 'Conhece a trilha inteira.' },
      { id: 'snake', ic: 'M3.5 19.5h9a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7 M18 5.3a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 1 0 0-4.4z M20.2 7.5h1.8', name: 'Cobra criada', goal: 'Coma 15 maçãs na cobrinha do controle.', done: 'Cresceu sem morder o próprio rabo.' },
      { id: 'seismic', ic: 'M2 12.5h3.5l1.8-4.5 2.9 10 3-14 2.9 11.5 1.9-3h4', name: 'Blind Bandit', secret: true, hint: 'Sinta o chão.', done: 'Enxergou sem usar os olhos.' },
      { id: 'metal', ic: 'M3.5 18.5h17l-3.3-7.5H6.8z M6.8 11l1.5-3.5h7.4l1.5 3.5 M12 14.8h.01', name: 'Metalbender', secret: true, hint: 'Nenhum metal é puro.', done: 'Achou a impureza no metal.' },
      { id: 'ctf', ic: 'M5.5 21V3.5 M5.5 4h12l-2.5 4.2 2.5 4.3h-12', name: 'Capture the Flag', secret: true, hint: 'Toda flag precisa ser entregue em algum lugar.', done: 'Entregou a flag no terminal.' },
      { id: 'toes', ic: 'M9.2 21c-2.4 0-3.6-1.9-3.6-4.4 0-2.8 1.5-5.6 3.9-5.6 2.3 0 3.6 2.2 3.6 4.7 0 2.9-1.4 5.3-3.9 5.3z M7.3 7.8a1 1 0 1 0 .01 0z M10.2 6.1a1.1 1.1 0 1 0 .01 0z M13.3 6.8a1 1 0 1 0 .01 0z M15.6 8.9a.9.9 0 1 0 .01 0z M16.5 12a.8.8 0 1 0 .01 0z', name: 'Twinkle Toes', secret: true, hint: 'Tem gente que anda sem fazer barulho.', done: 'Pisou tão leve que o sismógrafo nem sentiu.' },
      { id: 'owl', ic: 'M6 4.5l2 3 M18 4.5l-2 3 M5 12a7 7 0 0 1 14 0v2.5a6.5 6.5 0 0 1-6.5 6.5h-1A6.5 6.5 0 0 1 5 14.5z M9 10.3a1.9 1.9 0 1 0 0 3.8a1.9 1.9 0 1 0 0-3.8z M15 10.3a1.9 1.9 0 1 0 0 3.8a1.9 1.9 0 1 0 0-3.8z M12 14.5l-.9 1.5h1.8z', name: 'Coruja', secret: true, hint: 'Volte quando o sol for embora.', done: 'Apareceu de madrugada. Boa noite.' },
      { id: 'safe', ic: 'M4 4h16v15H4z M6 19v1.5 M18 19v1.5 M11.5 8a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z M11.5 8v1.3 M15 11.5h-1.3 M17.5 9.5v4', name: 'Senha de fábrica', secret: true, hint: 'Tem um cofre que nunca trocou a senha.', done: 'Abriu o cofre com a senha padrão. Troque sempre a sua.' },
      { id: 'rest', ic: 'M3 19V7 M3 14.5h18V19 M21 14.5v-2a3 3 0 0 0-3-3h-7v5 M6.8 12.2a1.6 1.6 0 1 0 0-3.2a1.6 1.6 0 1 0 0 3.2z M15 3.5h3l-3 3h3', name: 'Descanso merecido', secret: true, hint: 'Até herói precisa de um save.', done: 'Dormiu, salvou e recuperou o HP.' },
      { id: 'panic', ic: 'M10 8a6.3 6.3 0 1 0 0 12.6a6.3 6.3 0 1 0 0-12.6z M13.6 9l1.8-1.8 1.8 1.8-1.8 1.8 M16.3 7.2c.4-1.9 2-2.9 3.9-2.5 M20.8 2.5v1.1 M22.3 4.3h-1.1 M21.9 6.1l-.8-.6', name: 'Kernel panic', secret: true, hint: 'Tem comando que se multiplica até travar tudo.', done: 'Derrubou o sistema com uma fork bomb. Em produção, nunca.' },
      { id: 'nat20', ic: 'M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z M12 3v4.5 M4.2 7.5l4.5 2.6 M19.8 7.5l-4.5 2.6 M8.7 10.1L12 16.5l3.3-6.4z M8.7 10.1L4.2 16.5 M15.3 10.1l4.5 6.4 M12 16.5V21', name: 'Vinte natural', goal: 'Tire um 20 natural no d20 da mesa de Magic.', done: 'Vinte natural. O mestre nem conferiu o modificador.' },
      { id: 'f3', ic: 'M9 7.2a3 3 0 0 1 6 0 M8 9h8v5.3a4 4 0 0 1-8 0z M12 9v9.3 M8 12.2H4.2 M16 12.2h3.8 M8.2 15.8l-3 2 M15.8 15.8l3 2 M8.6 9.4L5.8 7 M15.4 9.4l2.8-2.4', name: 'Por trás da tela', secret: true, hint: 'Todo jogo de bloco tem uma tela de debug.', done: 'Abriu o modo debug e viu as hitboxes.' }
    ];
    d.trophyQ = 'M9.3 9.2a2.7 2.7 0 1 1 3.8 2.5c-.7.3-1.1.9-1.1 1.6v.8 M12 17h.01';
    d.hints = {
      start: 'aperte PRESS START na tela de boot.',
      main: 'escolha hardware, software ou a segurança do meio, na página inicial.',
      explorer: 'passe pelas quatro telas do site, pelo quarto e pelo lab (o computador do quarto abre ele).',
      questlog: 'abra as quatro missões em Projetos.',
      collector: 'passe o mouse em todos os itens do inventário, aqui no Lab.',
      lore: 'no Sobre, clique em cada jogo da lista.',
      furigana: 'clique no nome em kanji da página inicial.',
      special: 'no controle do Sobre, ↓ → A solta o golpe do firmware.',
      konami: '↑ ↑ ↓ ↓ ← → ← → B A, no controle do Sobre.',
      sudo: 'tente um sudo aqui mesmo.',
      speed: 'do Press Start até o Contato em até 15 segundos.',
      rage: 'tem um botão de energia lá no topo.',
      save: 'insira a ficha no Contato.',
      room: 'no quarto, examine os 61 objetos: chegue perto e aperte E, ou clique neles.',
      spin: 'no Início, arraste um dos modelos 3D até dar uma volta completa.',
      craft: 'combine dois itens na bancada daqui do Lab. tente ESP32 + MQTT.',
      palette: 'abra a paleta com ctrl+k (ou o botão >_ lá em cima) e execute um comando.',
      bubbles: 'no Contato tem plástico-bolha. estoure tudo.',
      rest: 'tem uma cama no quarto. deite nela.',
      glass: 'tem um vidro de emergência no Press Start e no menu de pausa. segure até quebrar.',
      arcade: 'o fliperama do quarto funciona. chegue a 3.000 pontos.',
      dj: 'no menu de pausa, troque a trilha até ouvir as três.',
      snake: 'o controle do Sobre tem uma tela. aperte START.',
      panic: 'a fork bomb clássica do bash, aqui no terminal: :(){ :|:& };:',
      f3: 'aperte F3 (ou procure "debug" na paleta).',
      seismic: 'bata o pé três vezes rápido no sismógrafo lá embaixo.',
      metal: 'o firmware.bin tem um byte que não deveria estar ali. quem enxerga pelo chão sente ele tremer.',
      ctf: 'achou uma flag? entregue ela aqui no terminal.',
      toes: 'pare o mouse em cima do sismógrafo, sem clicar.',
      owl: 'volte entre meia-noite e cinco da manhã.',
      safe: 'a missão 03 tem um cofre. a senha de fábrica é a revisão do BIOS.'
    };
    d.games = [
      { name: 'Persona 3 Reload', tag: 'JRPG', note: 'Montei um compendium interativo em HTML pra acompanhar as personas. E Makouha > Mahama: prefiro dano confiável a instakill no cara ou coroa.' },
      { name: 'Baldur’s Gate 3', tag: 'zerado no Honour Mode', note: 'Zerado no Honour Mode: um save só, chefes com ações lendárias e nenhuma chance de recarregar. Cada teste de dado valia de verdade.' },
      { name: 'Skullgirls', tag: 'main: Robo-Fortune', note: 'Time em montagem com a Squigly. Favorita: Robo-Fortune, com a Annie logo atrás.' },
      { name: 'Street Fighter V', tag: 'favorita: Falke', note: 'Personagem favorita: Falke. Estilo: zoner, como sempre.' },
      { name: 'Magic: The Gathering', tag: 'Commander · Standard', note: 'Commander com quatro decks: Toph, the First Metalbender; The Emperor of Palamecia; Sokka, Tenacious Tactician; e Imskir Iron-Eater. No Standard, mono-red aggro.' },
      { name: 'Terraria', tag: 'sandbox', note: 'Minerar, construir, derrubar boss. E o jogo tem fiação e portas lógicas, basicamente sistemas digitais com espada.' }
    ];
    // one source for every combo: the Início move list, the controller screen and the parser all read from here
    d.specials = [
      { seq: 'DRA', name: 'Firmware C++ no ESP32', long: 'Firmware C++ no ESP32', side: 'hw' },
      { seq: 'RDA', name: 'MQTT sobre TLS', long: 'MQTT sobre TLS no HiveMQ', side: 'hw' },
      { seq: 'LDRB', name: 'I²C · UART · PWM', long: 'I²C · UART · PWM, até bit-banging', side: 'hw' },
      { seq: 'DDB', name: 'Gabinete 3D paramétrico', long: 'Gabinete 3D paramétrico', side: 'hw' },
      { seq: 'DRDRA', name: 'Do sensor ao dashboard', long: 'Super: do sensor ao dashboard', side: 'hw', sup: true },
      { seq: 'RLA', name: 'API REST em Spring Boot', long: 'API REST em Spring Boot', side: 'sw' },
      { seq: 'URA', name: 'Dashboard React + TS', long: 'Dashboard em React + TypeScript', side: 'sw' },
      { seq: 'DUA', name: 'Automação em Python', long: 'Automação em Python com planilhas', side: 'sw' },
      { seq: 'ULB', name: 'JUnit · Vitest · Playwright', long: 'Testes: JUnit, Vitest e Playwright', side: 'sw' },
      { seq: 'URURA', name: 'Do push ao build', long: 'Super: CI do push ao build', side: 'sw', sup: true },
      { seq: 'RDLA', name: 'AD + Domain Controller', long: 'AD + Domain Controller do zero', side: 'sec' },
      { seq: 'LRA', name: 'Rede segmentada no IPFire', long: 'Rede segmentada no IPFire', side: 'sec' },
      { seq: 'DDA', name: 'SIEM com correlação', long: 'SIEM com correlação de eventos', side: 'sec' },
      { seq: 'DLB', name: 'Nós no Proxmox', long: 'Nós virtualizados no Proxmox', side: 'sec' },
      { seq: 'DLDLB', name: 'Validar tudo com Kali', long: 'Super: validar tudo com Kali', side: 'sec', sup: true }
    ];
    d.secrets = [
      { seq: 'UUDDLRLRBA', name: 'Código Konami', fx: 'konami', sub: '30 vidas extras' },
      { seq: 'DDDB', name: 'Pisada sísmica', fx: 'seis', sub: 'sentiu o chão?' },
      { seq: 'LDRA', name: 'Hadouken de pacote', fx: 'hdk', sub: 'SYN enviado' }
    ];
    d.projects = window.PORTFOLIO_PROJECTS || [];
    d.inv = [
      ['ESP', 'ESP32', 'Hardware', 'AquaSense e cofre eletrônico', 'hw'],
      ['UNO', 'Arduino UNO', 'Hardware', 'cofre (1ª versão) e estudos de sistemas embarcados', 'hw'],
      ['PICO', 'Raspberry Pi Pico', 'Hardware', 'cofre (versão MicroPython)', 'hw'],
      ['C++', 'C / C++', 'Firmware', 'firmware do AquaSense (887 linhas) e do cofre', 'hw'],
      ['MPY', 'MicroPython', 'Firmware', 'cofre (versão Pico)', 'hw'],
      ['I2C', 'I²C · UART · PWM', 'Protocolo', 'LCD, teclado, servo e sensores; o LCD até por bit-banging', 'hw'],
      ['MQTT', 'MQTT sobre TLS', 'Protocolo', 'telemetria do AquaSense no HiveMQ Cloud', 'hw'],
      ['LOGI', 'LogiSim', 'Circuitos digitais', 'MUX/DEMUX, decodificadores e circuitos sequenciais', 'hw'],
      ['PVE', 'Proxmox', 'Infra', 'nós virtualizados do lab de infraestrutura', 'sec'],
      ['AD', 'Windows Server · AD/DC', 'Infra', 'domínio, contas e políticas de acesso no lab', 'sec'],
      ['IPF', 'IPFire', 'Segurança', 'firewall de perímetro e regras entre zonas', 'sec'],
      ['FW', 'iptables · ufw', 'Segurança', 'firewall no próprio host Linux: fecha tudo e libera só o necessário', 'sec'],
      ['SIEM', 'SIEM', 'Segurança', 'coleta e correlação de eventos no lab', 'sec'],
      ['KALI', 'Kali Linux', 'Segurança', 'validação das configurações do lab', 'sec'],
      ['NET', 'DNS · DHCP', 'Redes', 'serviços de rede no Ubuntu Server', 'sec'],
      ['TUX', 'Linux', 'Infra', 'Ubuntu Server e Pop!_OS, com apt e systemd', 'sec'],
      ['PY', 'Python', 'Software', 'automação de e-mails (pywin32, openpyxl) e gabinete 3D (trimesh)', ''],
      ['JAVA', 'Java · Spring Boot', 'Software', 'API da CPTM, com Jackson', ''],
      ['TS', 'TypeScript · React', 'Software', 'dashboard do AquaSense, com Zod', ''],
      ['WEB', 'HTML · CSS', 'Web', 'site do ciclo de palestras do Ibmec', ''],
      ['DATA', 'Jupyter · NumPy · pandas', 'Dados e IA', 'fundamentos de ML e a auditoria que achou vazamento de dados', ''],
      ['SQL', 'SQL', 'Banco de dados', 'consultas e modelagem em bancos relacionais', ''],
      ['BI', 'Excel · Power BI', 'Dados', 'Excel avançado e dashboards no Power BI', ''],
      ['AWS', 'AWS Lambda · Alexa Skills Kit', 'Nuvem', 'skill da Alexa do AquaSense', ''],
      ['GIT', 'Git · GitHub Actions', 'Ferramentas', 'CI do AquaSense: lint, tipos, testes e build', ''],
      ['TEST', 'Vitest · Playwright · JUnit · Postman', 'Testes', 'dashboard do AquaSense e as 10 classes de teste da API da CPTM', '']
    ];
    d.termInit = [
      { t: 'okaru@lab · bash', cls: 't-d' },
      { t: 'digite "help" pra ver os comandos.', cls: '' }
    ];
    const rowsTxt = ['fw: okaru v2.7.0', 'sensor.solo = ok', 'metal.pureza=99%', 'flag{t0d0_m3t4l_', 't3m_t3rr4}'];
    const hx = (n, w) => ('0000' + n.toString(16)).slice(-w);
    d.hex = [];
    for (let r = 0; r !== 6; r++) {
      const txt = rowsTxt[r] || '';
      const bytes = [];
      let asc = '';
      for (let c = 0; c !== 16; c++) {
        let v = c < txt.length ? txt.charCodeAt(c) : (r === 4 ? 0 : 255);
        const imp = r === 5 && c === 10;
        if (imp) v = 84;
        const blank = v === 255 || v === 0;
        bytes.push({
          h: hx(v, 2), o: '0x' + hx(r * 16 + c, 4), imp: imp, pure: !imp,
          cls: (blank ? 'ff' : '') + (c === 7 ? ' mid' : ''),
          bend: () => this.bend()
        });
        asc += (v >= 32 && v !== 127 && v < 128) ? String.fromCharCode(v) : '.';
      }
      d.hex.push({ off: hx(r * 16, 4), bytes: bytes, asc: asc, cls: (r === 3 || r === 4) ? 'is-flag' : '', delay: r * 70 });
    }
    d.recipes = [
      { a: 'ESP', b: 'MQTT', k: 'IOT', name: 'AquaSense IoT', desc: 'Firmware C++ publicando telemetria por MQTT/TLS no HiveMQ.' },
      { a: 'TS', b: 'AWS', k: 'DASH', name: 'Dashboard + Alexa', desc: 'React e TypeScript via WebSocket, com uma skill da Alexa na Lambda.' },
      { a: 'ESP', b: 'I2C', k: 'SAFE', name: 'Cofre eletrônico', desc: 'LCD I²C, teclado 3×4 e servo, com a senha guardada na NVS.' },
      { a: 'C++', b: 'MPY', k: 'PORT', name: 'Porte de firmware', desc: 'O mesmo cofre em C++ e em MicroPython: UNO, Pico e ESP32.' },
      { a: 'PVE', b: 'IPF', k: 'LAB', name: 'Lab de infraestrutura', desc: 'Firewall de perímetro e zonas segmentadas em nós virtualizados.' },
      { a: 'AD', b: 'PVE', k: 'DC', name: 'Domain Controller', desc: 'Windows Server com AD, domínio, contas e políticas, tudo virtualizado.' },
      { a: 'SIEM', b: 'KALI', k: 'R×B', name: 'Red × blue', desc: 'O Kali ataca, o SIEM correlaciona e as regras seguram.' },
      { a: 'JAVA', b: 'TEST', k: 'API', name: 'API da CPTM', desc: '14 endpoints em Spring Boot e 10 classes de teste no JUnit.' },
      { a: 'GIT', b: 'TEST', k: 'CI', name: 'CI do AquaSense', desc: 'Lint, checagem de tipos, testes e build a cada push.' },
      { a: 'PY', b: 'DATA', k: 'ML', name: 'Auditoria de ML', desc: 'Acurácia de 0,98 parecia boa demais. Era vazamento temporal.' },
      { a: 'PY', b: 'BI', k: 'AUTO', name: 'Automação de e-mails', desc: 'Rascunhos no Outlook gerados a partir de planilha, anexos casados por nome.' },
      { a: 'TUX', b: 'NET', k: 'SRV', name: 'Servidor Linux', desc: 'DNS e DHCP no Ubuntu Server, com o systemd cuidando dos serviços.' },
      { a: 'TUX', b: 'FW', k: 'UFW', name: 'Firewall no host', desc: 'Regras no ufw, que por baixo é iptables: nega tudo e libera só o que o servidor usa.' }
    ];
    // the room: 24x14 tiles; t = [x, y, w, h] in tiles; walls are rows 0-1
    d.roomAtlas = '75b98b5016959e3b3df4172e2b9fd420';
    // decoration you bump into but can't examine (the plush corner, the middle of the TV stand)
    d.roomDeco = [[0, 12, 2, 2], [5, 8, 1, 1]];
    d.room = [
      { id: 'janela', name: 'Janela', t: [1, 0, 3, 2], night: 'São Paulo à noite. A cidade não desliga, e a rede também não.', day: 'São Paulo lá fora, cinza-azulado como sempre. Dia bom pra deixar o sensor coletando.' },
      { id: 'poster-sf', name: 'Pôster de Street Fighter', t: [4, 0, 1, 2], text: 'Pôster de Street Fighter, com o VS bem no meio. Fica de frente pro tapete, pra lembrar que sempre cabe mais um round.' },
      { id: 'espelho', name: 'Espelho', t: [5, 0, 1, 2], text: 'Esse sou eu: Engenharia da Computação no Ibmec, hardware, segurança e bastante café. Quer ver a ficha completa?', acts: [['Ver a ficha (Sobre)', 'go:sobre']] },
      { id: 'poster-retro', name: 'Pôster retrô', t: [6, 0, 1, 2], text: 'Pôster retrô: pôr do sol em 16 bits sobre colinas verdes. Toda fase clássica começava mais ou menos assim.' },
      { id: 'poster', name: 'Pôster', t: [7, 0, 1, 2], text: 'Pôster do Festival do Japão. Lá eu coordeno a escala de voluntários da Kochi Kenjinkai.' },
      { id: 'livros', name: 'Livros', t: [9, 0, 1, 2], text: 'Redes, sistemas digitais, segurança. E japonês, no nível intermediário-avançado.' },
      { id: 'luva', name: 'Luva de beisebol', t: [10, 0, 1, 2], text: 'Luva de beisebol. Foram seis anos jogando no Cooper Cotia.' },
      { id: 'pedra', name: 'Pedra', t: [11, 0, 1, 2], text: 'Uma pedra comum. Encostando a mão, dá pra jurar que ela sente o chão.', acts: [['Encostar a mão', 'seis']] },
      { id: 'kit', name: 'Kit de montar', t: [12, 0, 1, 2], text: 'Um kit de montar de Evangelion, ainda lacrado. Eu sei, eu sei: não dá pra fugir. Mas dá pra adiar.' },
      { id: 'arvore', name: 'Árvore de habilidades', t: [13, 0, 1, 2], text: 'A árvore de habilidades, emoldurada na parede: cada ramo começou num projeto, e os nós apagados são os próximos.', acts: [['Ver a árvore', 'skills']] },
      { id: 'quadro', name: 'Quadro de missões', t: [14, 0, 2, 2], text: 'O quadro de missões: AquaSense IoT, o lab de infraestrutura, o cofre eletrônico e o sistema de ativos da CPTM.', acts: [['Ver as missões (Projetos)', 'go:projetos']] },
      { id: 'resistores', name: 'Tabela de resistores', t: [17, 0, 1, 2], text: 'O código de cores dos resistores: preto, marrom, vermelho, laranja, amarelo, verde, azul, violeta, cinza e branco. Mesmo sabendo de cor, eu confiro no multímetro.' },
      { id: 'blueprint', name: 'Blueprint de robô', t: [18, 0, 2, 2], text: 'O blueprint do robô que está ali na bancada. Primeiro o desenho, depois a morsa, o estanho e muita paciência.' },
      { id: 'calendario', name: 'Calendário', t: [16, 0, 1, 2], text: 'Calendário com a lua cheia marcada. Mania de Persona 3: todo dia conta, e lua cheia sempre traz problema.' },
      { id: 'caderno', name: 'Caderno de desenho', t: [2, 3, 1, 1], text: 'Um caderno de desenho e uma caixa de lenços do lado. Referência a Omori: quem jogou sabe pra que serve o lenço.' },
      { id: 'estrela', name: 'Estrela', t: [2, 5, 1, 1], text: 'Uma estrelinha brilhando no chão. Olhar pra ela me enche de DETERMINAÇÃO.', acts: [['Salvar', 'savestar']] },
      { id: 'cama', name: 'Cama', t: [0, 2, 2, 3], text: 'Minha cama. Ponto de save oficial do quarto.', acts: [['Dormir', 'sleep']] },
      { id: 'celular', name: 'Celular', t: [2, 2, 1, 1], text: 'Meu celular, no silencioso, mas eu vejo tudo. E-mail, LinkedIn e currículo ficam no Contato.', acts: [['Ir pro Contato', 'go:contato']] },
      { id: 'cofre', name: 'Cofre', t: [19, 2, 1, 1], text: 'O cofre eletrônico que eu portei do Arduino pro ESP32. Ainda com a senha de fábrica... ou será que não?', acts: [['Ver a missão 03', 'proj:2']] },
      { id: 'pc', name: 'Computador', t: [20, 2, 2, 1], text: 'WezTerm aberto, JetBrains Mono, tema system24. Sempre tem um terminal esperando. E, quando a internet cai, um joguinho.', acts: [['Sentar e jogar', 'pcgame'], ['Abrir o Lab', 'go:lab']] },
      { id: 'mousepad', name: 'Mousepad', t: [22, 2, 1, 1], text: 'Mousepad gasto de tanto flick no CS. Mira verde, sensibilidade baixa e zero desculpa.' },
      { id: 'cadeira', name: 'Cadeira', t: [21, 3, 1, 1], text: 'Cadeira gamer. Onde eu passo mais tempo do que deveria. Senta aí: quando a internet cai, o PC tem um joguinho escondido.', acts: [['Sentar e jogar', 'pcgame']] },
      { id: 'rack', name: 'Rack', t: [23, 2, 1, 2], text: 'O rack dos laboratórios que eu monto por conta própria: Proxmox, AD, IPFire e SIEM, todos no mesmo barulho de ventoinha.', acts: [['Ver a missão 02', 'proj:1']] },
      { id: 'fliperama', name: 'Fliperama', jingle: 'jInvaders', t: [9, 4, 1, 3], v: [144, 64, 20, 47], text: 'Fliperama. Em luta eu sou zoner: Falke no Street Fighter V, Robo-Fortune no Skullgirls. Mas essa máquina roda outra coisa: Packet Invaders.', acts: [['Jogar', 'arcade']] },
      { id: 'fliperama-luta', name: 'Fliperama de luta', jingle: 'jFight', t: [10, 4, 1, 3], v: [164, 64, 20, 47], text: 'The King of Fighters 2002, clássico de todo fliperama de bairro. Ficha na máquina, fila atrás e ninguém solta o controle.' },
      { id: 'fliperama-nave', name: 'Fliperama de nave', jingle: 'jShoot', t: [11, 4, 2, 3], v: [184, 64, 20, 47], text: 'Galaga. Deixar a nave ser capturada de propósito pra resgatar e jogar com duas é estratégia, não erro.' },
      { id: 'fliperama-slug', name: 'Fliperama de tiro', jingle: 'jSlug', t: [9, 8, 1, 3], v: [144, 128, 20, 47], text: 'Metal Slug pra jogar em dupla: tanque, granada e explosão pra todo lado. A ficha acaba antes da vontade.' },
      { id: 'fliperama-blocos', name: 'Fliperama de blocos', jingle: 'jBlocks', t: [10, 8, 1, 3], v: [164, 128, 20, 47], text: 'Tetris: os blocos caem cada vez mais rápido e a música não sai da cabeça. O jogo mais honesto que existe: o erro é sempre seu.' },
      { id: 'fliperama-corrida', name: 'Fliperama de corrida', jingle: 'jRace', t: [11, 8, 2, 3], v: [184, 128, 20, 47], text: 'Daytona USA, volante e câmbio de duas marchas. Na curva, o segredo é frear antes. Eu sempre descubro isso depois.' },
      { id: 'pachinko', name: 'Pachinko', jingle: 'jPachinko', t: [13, 8, 1, 3], v: [205, 128, 16, 47], text: 'Máquina de pachinko: centenas de bolinhas de aço descendo entre os pinos. No Japão é febre; aqui no quarto, é hipnose.' },
      { id: 'pinball', name: 'Pinball', jingle: 'jPinball', t: [13, 4, 1, 3], v: [205, 64, 16, 47], text: 'Pinball: bumper, rampa e a bolinha de aço que sempre escapa pelo meio. Um tranquinho na mesa vale; tilt, não.' },
      { id: 'cartuchos', name: 'Cartuchos de Pokémon', t: [0, 6, 1, 1], text: 'Todos os Pokémon de DS e 3DS: Diamond, Pearl, Platinum, HeartGold, SoulSilver, Black, White, Black 2 e White 2. Depois X, Y, Omega Ruby, Alpha Sapphire, Sun, Moon, Ultra Sun e Ultra Moon.' },
      { id: 'fichario', name: 'Fichário', t: [0, 7, 1, 1], text: 'Fichário de Pokémon TCG. As holográficas ficam na primeira página, óbvio.' },
      { id: 'portatil', name: 'Portáteis', t: [0, 8, 1, 2], text: 'Meus portáteis: New 3DS XL, 3DS, DS Lite, GBA SP e um Anbernic com cara de Game Boy clássico, que emula do Game Boy ao GBA com todos os Pokémon dessa era. Nuzlocke: perdeu, soltou.' },
      { id: 'pelucia-gigante', name: 'Pelúcia gigante', t: [5, 3, 1, 1], v: [75, 34, 26, 30], text: 'Ursão de pelúcia gigante. É encosto nas maratonas de jogo, plateia no tamancobol e o único que nunca pede revanche.' },
      { id: 'bonecos', name: 'Bonecos', t: [4, 5, 3, 1], text: 'Bonecos de Street Fighter, Mario e Sonic dividindo a mesma estante. Nintendo e Sega em paz, pelo menos aqui dentro.' },
      { id: 'tv', name: 'TV de tubo', jingle: 'jTv', t: [4, 7, 3, 1], text: 'TV de tubo, 4:3 e scanline de verdade. Os consoles da estante revezam as entradas de vídeo, e a vez é de quem pegar o controle primeiro.' },
      { id: 'xboxone', name: 'Xbox One S', jingle: 'jOne', t: [6, 8, 1, 1], text: 'O Xbox One S branco, o caçula dos consoles da minha infância. Discreto, silencioso e sempre com uma atualização pra baixar.' },
      { id: 'wii', name: 'Wii', jingle: 'jWii', t: [4, 8, 1, 1], text: 'O Wii da infância. Boliche, tênis e a lição mais importante de todas: sempre use a alça do controle.' },
      { id: 'jogos-snes', name: 'Cartuchos do SNES', jingle: 'jCarts', t: [4, 9, 1, 1], text: 'Os clássicos do SNES: Super Mario World, Donkey Kong Country, A Link to the Past, Super Metroid, Chrono Trigger, Street Fighter II, Mega Man X e Super Mario Kart.' },
      { id: 'snes', name: 'SNES', jingle: 'jSnes', t: [5, 9, 1, 1], text: 'O SNES, no tapete em frente à TV, com um cartucho sempre encaixado. Dois controles: um é meu, o outro é de quem topar um versus.' },
      { id: 'puff', name: 'Puff', t: [5, 10, 1, 1], text: 'O puff na frente da TV, na distância certa pra ninguém falar «senta longe da tela». Lugar de quem tá com o controle na mão.' },
      { id: 'cartola', name: 'Cartola', t: [1, 11, 1, 1], text: 'Uma cartola na prateleira. Em BattleBlock Theater o chapéu faz o herói, e nunca, nunca confie num gato de teatro.' },
      { id: 'espada', name: 'Espada de espuma', t: [2, 11, 1, 1], text: 'Espada de espuma e escudo de brinquedo. Castle Crashers é assim: quatro amigos, um sofá e zero piedade.' },
      { id: 'tamancobol', name: 'Tamancobol', t: [4, 12, 3, 2], text: 'Tamancobol: cada um gira o tamanco no varão e tenta fazer o gol do outro lado. Clássico de festa que merecia campeonato.' },
      { id: 'pelucia', name: 'Pelúcia da Toph', t: [12, 12, 1, 1], text: 'Pelúcia da Toph. Cega, marrenta e a melhor dobradora de terra que já existiu. Quem precisa de olhos quando dá pra sentir o chão?' },
      { id: 'decks', name: 'Decks de Magic', t: [15, 7, 1, 2], text: 'Quatro decks de Commander: Toph, the First Metalbender; The Emperor of Palamecia; Sokka, Tenacious Tactician; e Imskir Iron-Eater. Pro Standard, um mono-red aggro. Topa uma partida?' },
      { id: 'playmat', name: 'Playmat', t: [16, 7, 1, 2], text: 'Uma partida de Commander congelada no turno 7. Ninguém mexe em nada.' },
      { id: 'd20', name: 'd20', t: [17, 7, 1, 2], text: 'Um d20 que tirou 1 no teste de persuasão mais importante da minha run de Baldur’s Gate 3. Zerei no Honour Mode mesmo assim. Quer rolar um teste?', acts: [['Rolar o d20', 'd20']] },
      { id: 'caixote', name: 'Caixote e pé de cabra', t: [15, 5, 1, 1], text: 'Caixote e pé de cabra. Lições de Black Mesa: todo caixote merece ser aberto, e nunca empurre a amostra pro feixe de análise.' },
      { id: 'bancada-trabalho', name: 'Bancada de trabalho', t: [17, 4, 2, 2], text: 'Bancada de trabalho: morsa, chaves e um potinho de ferragens. É onde a parte mecânica acontece, e foi daqui que o robô do blueprint saiu do papel.' },
      { id: 'robo', name: 'Mini robô', jingle: 'beeps', talk: true, t: [19, 4, 1, 2], text: 'O robô do blueprint, acabado de montar. Por enquanto ele só anda pra lá e pra cá e pisca o LED da antena, mas já é o xodó do quarto.', acts: [['Falar de novo', 'robot']] },
      { id: 'mesa-solda', name: 'Mesa de solda', t: [19, 9, 3, 2], text: 'Mesa de solda: terceira mão com lupa, exaustor de fumaça e rolo de estanho. Solda boa é brilhante e em forma de vulcão; bolinha fosca é solda fria.' },
      { id: 'ferramentas', name: 'Carrinho de ferramentas', t: [23, 6, 1, 2], text: 'Carrinho de ferramentas: chaves, alicates, soquetes e aquela chave Phillips que some justo quando eu mais preciso.' },
      { id: 'ferragens', name: 'Gaveteiro de ferragens', t: [23, 8, 1, 2], text: 'Gaveteiro de ferragens: parafusos, porcas, espaçadores, resistores, LEDs e servos, tudo etiquetado. Quase tudo.' },
      { id: 'multimetro', name: 'Multímetro', t: [20, 6, 1, 2], text: 'Antes do printf, o multímetro. É ele que diz onde o sinal chegou torto.' },
      { id: 'bancada', name: 'Bancada', t: [21, 6, 2, 2], text: 'ESP32 na protoboard e o ferro de solda ainda quente. Foi daqui que saiu o AquaSense.', acts: [['Ver a missão 01', 'proj:0']] },
      { id: 'drone', name: 'Drone', t: [10, 13, 1, 1], text: 'Drone de brinquedo. Vício de Rainbow Six: antes de entrar em qualquer cômodo, eu mando o drone.' },
      { id: 'caixa', name: 'Caixa da Ycare', t: [22, 11, 1, 1], text: 'Doações da Ycare: alimentos e itens de higiene. Todo segundo sábado do mês, a gente entrega numa comunidade.' },
      { id: 'planta', name: 'Planta', t: [23, 11, 1, 1], text: 'Uma planta que sobrevive de luz de monitor. No Terraria ela já teria virado poção.' },
      { id: 'porta', name: 'Porta', t: [11, 13, 2, 1], walk: true, door: true, text: 'A porta do quarto. Lá fora fica a versão comum do portfólio: Início, Projetos, Sobre e Contato, ligados por portas. Pra voltar, é só entrar na portinha do lado do meu nome.', acts: [['Ir pro site comum', 'site']] }
    ];
    // ---- the skill tree: four branches out of the degree; the last node of each is still dark ----
    d.skills = {
      root: { k: 'root', label: 'Eng. Comp.', full: 'Engenharia da Computação', desc: 'Ibmec, 2023 a 2027. O tronco de onde os quatro ramos saem.' },
      branches: [
        { k: 'hw', name: 'Hardware', nodes: [
          { k: 'esp', label: 'ESP32', full: 'ESP32 · Arduino', desc: 'Firmware em C++ pro ESP32 e pro Arduino: o AquaSense e o cofre eletrônico saíram daqui.' },
          { k: 'bus', label: 'I²C/UART', full: 'I²C · UART · PWM', desc: 'Barramentos e sinais: LCD por I²C (com biblioteca, direto e por bit-banging), UART e PWM.' },
          { k: 'sens', label: 'Sensores', full: 'Sensores · LCD', desc: 'pH, cloro, ORP, temperatura e umidade lidos e mostrados num LCD 16×2.' },
          { k: 'iot', label: 'IoT/MQTT', full: 'IoT · MQTT sobre TLS', desc: 'Publicação por MQTT sobre TLS num broker na nuvem, com comandos de volta.' } ] },
        { k: 'infra', name: 'Infra', nodes: [
          { k: 'linux', label: 'Linux', full: 'Linux · Ubuntu Server', desc: 'Ubuntu Server e Pop!_OS no dia a dia: apt, systemd e terminal.' },
          { k: 'dns', label: 'DNS/DHCP', full: 'DNS · DHCP · systemd', desc: 'Serviços de rede num servidor Linux, com o systemd cuidando deles.' },
          { k: 'pve', label: 'Proxmox', full: 'Proxmox', desc: 'Os nós do laboratório virtualizados no Proxmox.' },
          { k: 'ad', label: 'AD/DC', full: 'Windows Server · AD/DC', desc: 'Windows Server do zero: Active Directory, domínio, contas e políticas.' } ] },
        { k: 'sec', name: 'Segurança', nodes: [
          { k: 'kali', label: 'Kali', full: 'Kali Linux', desc: 'O Kali valida as configurações: ataca o próprio lab pra ver o que segura.' },
          { k: 'ipfire', label: 'IPFire', full: 'IPFire · segmentação', desc: 'Firewall de perímetro e rede dividida em zonas, com regras entre elas.' },
          { k: 'ufw', label: 'ufw', full: 'iptables · ufw', desc: 'Firewall no host: nega tudo e libera só o que o servidor usa.' },
          { k: 'siem', label: 'SIEM', full: 'SIEM', desc: 'SIEM montado do zero, correlacionando eventos das camadas de defesa.' } ] },
        { k: 'sw', name: 'Software', nodes: [
          { k: 'py', label: 'Python', full: 'Python · C/C++', desc: 'Python pra automação e dados; C e C++ no firmware.' },
          { k: 'spring', label: 'Spring', full: 'Java · Spring Boot', desc: 'API REST em Spring Boot pra CPTM, com JUnit e Postman.' },
          { k: 'react', label: 'React/TS', full: 'React · TypeScript', desc: 'Dashboard em React e TypeScript com WebSocket e validação com Zod.' },
          { k: 'ci', label: 'CI', full: 'CI · testes', desc: 'GitHub Actions com lint, tipos, Vitest, Playwright e build a cada push.' } ] }
      ],
      locked: { label: '???', full: 'Próximo nó', desc: 'Ainda apagado: é o próximo da fila desse ramo.' }
    };
    // ---- the d20 on the Magic table: areas (bonus or penalty, capped at ±3) and the PO's task pool ----
    d.d20Areas = { hw: ['Hardware', 3], infra: ['Infraestrutura', 3], sec: ['Segurança', 2], sw: ['Software', 2], dados: ['Dados', 1], idiomas: ['Idiomas', 1], humanas: ['Humanas', -1], mkt: ['Marketing', -2], artes: ['Artes', -2], buro: ['Burocracia', -3] };
    d.d20Openers = ['O chefe aparece na sua mesa:', 'Mensagem do PO às 8h01:', 'A dona do produto puxa uma cadeira:', 'Ticket novo, prioridade alta:', 'Na daily, o líder solta:', 'O cliente liga direto pra você:'];
    // adv: 1 = advantage, -1 = disadvantage (why says the reason), 0 = a plain roll
    d.d20Tasks = [
      { t: 'Sobe um servidor DNS e DHCP no Ubuntu Server pro laboratório até o fim do dia.', area: 'infra', dc: 10, adv: 0 },
      { t: 'O firewall tá deixando passar tudo. Fecha o ufw: nega tudo e libera só o que a gente usa.', area: 'sec', dc: 12, adv: 0 },
      { t: 'O ESP32 parou de publicar no broker. Descobre por quê. Com o multímetro, se precisar.', area: 'hw', dc: 11, adv: 1, why: 'a placa é sua velha conhecida' },
      { t: 'Monta um dashboard em React que leia os sensores por WebSocket e mostre o histórico.', area: 'sw', dc: 13, adv: 0 },
      { t: 'Migra o cofre do Arduino pro ESP32 sem perder a senha salva.', area: 'hw', dc: 12, adv: 0 },
      { t: 'Configura o Active Directory do zero: domínio, contas e políticas de acesso.', area: 'infra', dc: 14, adv: -1, why: 'é sexta, 17h58' },
      { t: 'O SIEM tá cheio de alerta falso. Ajusta as regras de correlação sem perder o que importa.', area: 'sec', dc: 15, adv: 0 },
      { t: 'Escreve 10 classes de teste no JUnit pra API antes do deploy.', area: 'sw', dc: 11, adv: 1, why: 'a documentação da API é boa' },
      { t: 'Faz um relatório no Power BI dos dados de operação pra diretoria.', area: 'dados', dc: 12, adv: 0 },
      { t: 'Apresenta o projeto em inglês pra um cliente de fora.', area: 'idiomas', dc: 13, adv: 0 },
      { t: 'Traduz o manual do produto pro japonês.', area: 'idiomas', dc: 15, adv: -1, why: 'tem termo técnico que nem em japonês existe' },
      { t: 'Escreve o texto da campanha de marketing do produto novo.', area: 'mkt', dc: 12, adv: 0 },
      { t: 'Redesenha o logo da empresa. Pra amanhã.', area: 'artes', dc: 14, adv: -1, why: 'o cliente ainda não decidiu a cor' },
      { t: 'Faz a ata da reunião de três horas sobre o nome do projeto.', area: 'humanas', dc: 10, adv: 0 },
      { t: 'Preenche o formulário da certificação, em seis vias, com carimbo.', area: 'buro', dc: 16, adv: 0 },
      { t: 'Segmenta a rede em zonas e sobe o IPFire entre elas.', area: 'sec', dc: 13, adv: 1, why: 'você já montou isso no lab' },
      { t: 'Virtualiza os nós do ambiente no Proxmox e deixa tudo subindo sozinho.', area: 'infra', dc: 11, adv: 0 },
      { t: 'Automatiza os rascunhos de e-mail a partir da planilha, com os anexos certos.', area: 'sw', dc: 9, adv: 1, why: 'tem um script pronto pra adaptar' },
      { t: 'Liga o LCD I2C na protoboard e faz o pH aparecer na tela.', area: 'hw', dc: 8, adv: 0 },
      { t: 'Corrige o vazamento temporal do modelo antes que alguém acredite nos 98%.', area: 'dados', dc: 14, adv: 0 },
      { t: 'Configura o CI: lint, tipos, testes e build a cada push.', area: 'sw', dc: 12, adv: 0 },
      { t: 'Passa o Kali no ambiente novo e vê o que fica de pé.', area: 'sec', dc: 14, adv: 1, why: 'o ambiente é seu' },
      { t: 'Solda de novo o conector do sensor que soltou. Sem solda fria.', area: 'hw', dc: 9, adv: 0 },
      { t: 'Negocia o prazo do projeto com o cliente, em espanhol.', area: 'idiomas', dc: 14, adv: -1, why: 'o cliente também quer negociar' },
      { t: 'Organiza a confraternização de fim de ano do time.', area: 'humanas', dc: 12, adv: 0 },
      { t: 'Faz o pitch de vendas pra investidores.', area: 'mkt', dc: 16, adv: -1, why: 'o slide 1 já tem erro de digitação' },
      { t: 'Documenta a API inteira antes do fim da sprint.', area: 'sw', dc: 13, adv: -1, why: 'é o último dia da sprint' },
      { t: 'Calibra o sensor de temperatura do coletor solar.', area: 'hw', dc: 10, adv: 0 },
      { t: 'Pinta o mural da recepção com o tema da empresa.', area: 'artes', dc: 15, adv: 0 },
      { t: 'Consegue a assinatura dos três diretores no mesmo dia.', area: 'buro', dc: 18, adv: -1, why: 'um deles está de férias' }
    ];
    d.d20React = {
      crit: ['«Isso vai pro README como exemplo.»', '«Não sei o que você fez, mas não mexe mais.»', '«Ok, agora ensina o resto do time.»'],
      ok: ['«Mandou bem. Agora documenta.»', '«Fechou. Próximo ticket.»', '«Era isso. Pode dar merge.»'],
      fail: ['«Tudo bem, a gente refaz na segunda.»', '«Anota como lição aprendida.»', '«Não foi dessa vez. O café tá na copa.»'],
      fumble: ['«...vamos fingir que isso não aconteceu.»', '«O backup existe, né? Né?»', '«Chama o time. Chama todo mundo.»']
    };
    // the boot log before the start screen: [timestamp] text, a status tag (ok / warn / fail / none) and
    // how long that step "took"; ms = delay before the line shows up. Errors and warnings are the fun part.
    d.bootLog = window.PortfolioBoot?.lines || [];
    // what the little robot says when you poke it (the first line is always the hello)
    d.robotLines = [
      'BIP BIP BOP! Olá, humano. Bateria em 87%, empolgação em 100%.',
      '01001111 01101001! Isso é “Oi” em binário. De nada.',
      'Diagnóstico: servos ok, LED ok, senso de humor... em calibração.',
      'Fui montado naquela bancada. Minha primeira memória é o cheiro de estanho.',
      'Aviso: não sou à prova d’água. Nem de café.',
      'Protocolo de amizade: SYN... SYN-ACK... ACK! Conexão estabelecida.',
      'BIP? BIP BIP! ...desculpa, era pra ser um BIP só.',
      'Se eu parar no meio do caminho, não é pane. Eu tô pensando. Tá, às vezes é pane.',
      'Meu maior sonho é subir uma escada. Esteira não ajuda muito nisso.',
      'Pode fazer carinho na cabeça. Só com cuidado: o botão de reset fica ali.'
    ];
    const U = (v) => (Math.round(v * 100) / 100) + 'cqw';
    const box = (list, k, part, c, sz, skip) => {
      const X = c[0] * k, Y = c[1] * k, Z = c[2] * k, W = sz[0] * k, H = sz[1] * k, D = sz[2] * k;
      const base = 'translate(-50%,-50%) translate3d(' + U(X) + ',' + U(Y) + ',' + U(Z) + ') ';
      [
        ['ft', W, H, 'translateZ(' + U(D / 2) + ')'],
        ['bk', W, H, 'rotateY(180deg) translateZ(' + U(D / 2) + ')'],
        ['rt', D, H, 'rotateY(90deg) translateZ(' + U(W / 2) + ')'],
        ['lt', D, H, 'rotateY(-90deg) translateZ(' + U(W / 2) + ')'],
        ['tp', W, D, 'rotateX(90deg) translateZ(' + U(H / 2) + ')'],
        ['bt', W, D, 'rotateX(-90deg) translateZ(' + U(H / 2) + ')']
      ].forEach((q) => {
        if (!skip || skip.indexOf(q[0]) < 0) list.push({ cls: 'p-' + part + ' f-' + q[0], w: U(q[1]), h: U(q[2]), tf: base + q[3] });
      });
    };
    const flat = ['ft', 'bk', 'rt', 'lt', 'bt'];
    const k1 = 1.38;
    d.hwFaces = [];
    box(d.hwFaces, k1, 'pcb', [0, 0, 0], [52, 1.6, 28]);
    box(d.hwFaces, k1, 'hdr', [0, 2.05, 12.6], [48.3, 2.5, 2.5]);
    box(d.hwFaces, k1, 'hdr', [0, 2.05, -12.6], [48.3, 2.5, 2.5]);
    box(d.hwFaces, k1, 'pin', [0, 6.3, 12.6], [48.3, 6, 0.02], ['rt', 'lt', 'tp', 'bt']);
    box(d.hwFaces, k1, 'pin', [0, 6.3, -12.6], [48.3, 6, 0.02], ['rt', 'lt', 'tp', 'bt']);
    box(d.hwFaces, k1, 'mod', [18.25, -1.2, 0], [25.5, 0.8, 18], ['bt']);
    box(d.hwFaces, k1, 'can', [15.2, -3.15, 0], [17.6, 3.1, 16], ['bt']);
    box(d.hwFaces, k1, 'ant', [27.8, -1.72, 0], [5.4, 0.02, 15], flat);
    box(d.hwFaces, k1, 'usb', [-24.25, -2.1, 0], [6.5, 2.6, 7.5], ['bt']);
    box(d.hwFaces, k1, 'ic', [-13.5, -1.25, 4.5], [5, 0.9, 5], ['bt']);
    box(d.hwFaces, k1, 'reg', [-13.5, -1.6, -7.5], [6.5, 1.6, 3.5], ['bt']);
    box(d.hwFaces, k1, 'sw', [-19.5, -1.55, 9.8], [3.5, 1.5, 3.5], ['bt']);
    box(d.hwFaces, k1, 'sw', [-19.5, -1.55, -9.8], [3.5, 1.5, 3.5], ['bt']);
    box(d.hwFaces, k1, 'ld', [-6, -0.9, 10.2], [1.6, 0.1, 0.9], flat);
    const k2 = 1.26;
    d.swFaces = [];
    box(d.swFaces, k2, 'lb', [0, 6, 2], [58, 2.6, 36]);
    box(d.swFaces, k2, 'ls', [0, -11.6, -16.4], [58, 33, 2]);
    d.credits = [
      { role: 'Direção e roteiro', names: ['Hikaru Ogasawara'] },
      { role: 'Hardware', names: ['ESP32 · Arduino UNO · Raspberry Pi Pico', 'C/C++ e MicroPython'] },
      { role: 'Infraestrutura e segurança', names: ['Proxmox · Windows Server · IPFire', 'SIEM · Kali Linux'] },
      { role: 'Missões principais', names: ['AquaSense IoT · Invivio Tecnologia / Ibmec', 'Lab de infraestrutura · acadêmico', 'Cofre eletrônico · projeto pessoal', 'Ativos da CPTM · CPTM'] },
      { role: 'Orientação no AquaSense', names: ['Prof. Marcel Stefan Wagner, PhD'] },
      { role: 'Guildas', names: ['Ycare · vice-presidência', 'Kochi Kenjinkai · voluntariado'] },
      { role: 'Biblioteca de jogos', names: ['Persona 3 Reload · Baldur’s Gate 3', 'Skullgirls · Street Fighter V', 'Magic: The Gathering · Terraria'] },
      { role: 'Trilha sonora', names: ['Três faixas geradas ao vivo com Web Audio'] },
      { role: 'Efeitos sonoros', names: ['Osciladores quadrados e um pouco de ruído branco'] },
      { role: 'Feito com', names: ['Solda, café e ctrl+z'] },
      { role: 'Logos no inventário', names: ['Simple Icons (CC0)', 'Logo do Git por Jason Long (CC BY 3.0)'] },
      { role: 'Agradecimento especial', names: ['Você, por jogar até aqui'] }
    ];
    d.panicLines = [
      ['[ 4242.000001] bash: fork: retry: Resource temporarily unavailable', ''],
      ['[ 4242.000417] Out of memory: Killed process 2311 (bash) total-vm:∞kB', ''],
      ['[ 4242.000418] Kernel panic - not syncing: Out of memory and no killable processes...', 'hl'],
      ['[ 4242.000419] CPU: 0 PID: 1 Comm: okaru Not tainted 6.2.7-okaru #2027', ''],
      ['[ 4242.000420] Hardware name: Ibmec SP / Engenharia da Computação, BIOS REV. 2027', ''],
      ['[ 4242.000421] Call Trace:', ''],
      ['[ 4242.000422]  <TASK>', ''],
      ['[ 4242.000423]  dump_stack_lvl+0x48/0x70', ''],
      ['[ 4242.000424]  panic+0x10a/0x2e6', ''],
      ['[ 4242.000425]  out_of_memory.cold+0x2f/0x7e', ''],
      ['[ 4242.000426]  sentir_o_chao+0x0/0x42 [seismic]', 'egg'],
      ['[ 4242.000427]  do_fork+0xde/0xad', ''],
      ['[ 4242.000428]  </TASK>', ''],
      ['[ 4242.000429] ---[ end Kernel panic - not syncing: fork bomb detectada. em produção, nunca. ]---', 'hl']
    ];
    d.arcDefault = [['OKR', 4200], ['TPH', 3000], ['BIT', 2200], ['SYS', 1400], ['BOT', 600]];
    // tech logos for the Sobre loadout: Simple Icons (CC0); the Git logo is by Jason Long (CC BY 3.0)
    d.logos = {
      cplusplus: 'M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.34.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.11c-3.92 0-7.109-3.19-7.109-7.11 0-3.92 3.19-7.11 7.11-7.11a7.133 7.133 0 016.156 3.553l-3.076 1.78a3.567 3.567 0 00-3.08-1.78A3.56 3.56 0 008.444 12 3.56 3.56 0 0012 15.555a3.57 3.57 0 003.08-1.778l3.078 1.78A7.135 7.135 0 0112 19.11zm7.11-6.715h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79zm2.962 0h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79z',
      python: 'M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z',
      git: 'M13.09 23.549a1.54 1.54 0 0 1-2.18 0L.451 13.089a1.54 1.54 0 0 1 0-2.179l7.191-7.19 2.733 2.733a1.85 1.85 0 0 0 .964 2.326v6.66a1.849 1.849 0 1 0 1.54 0V8.957l2.508 2.508a1.85 1.85 0 1 0 1.09-1.09l-2.634-2.634a1.85 1.85 0 0 0-2.378-2.377L8.73 2.63 10.91.451a1.54 1.54 0 0 1 2.179 0l10.459 10.46a1.54 1.54 0 0 1 0 2.179z',
      kalilinux: 'M12.778 5.943s-1.97-.13-5.327.92c-3.42 1.07-5.36 2.587-5.36 2.587s5.098-2.847 10.852-3.008zm7.351 3.095l.257-.017s-1.468-1.78-4.278-2.648c1.58.642 2.954 1.493 4.021 2.665zm.42.74c.039-.068.166.217.263.337.004.024.01.039-.045.027-.005-.025-.013-.032-.013-.032s-.135-.08-.177-.137c-.041-.057-.049-.157-.028-.195zm3.448 8.479s.312-3.578-5.31-4.403a18.277 18.277 0 0 0-2.524-.187c-4.506.06-4.67-5.197-1.275-5.462 1.407-.116 3.087.643 4.73 1.408-.007.204.002.385.136.552.134.168.648.35.813.445.164.094.691.43 1.014.85.07-.131.654-.512.654-.512s-.14.003-.465-.119c-.326-.122-.713-.49-.722-.511-.01-.022-.015-.055.06-.07.059-.049-.072-.207-.13-.265-.058-.058-.445-.716-.454-.73-.009-.016-.012-.031-.04-.05-.085-.027-.46.04-.46.04s-.575-.283-.774-.893c.003.107-.099.224 0 .469-.3-.127-.558-.344-.762-.88-.12.305 0 .499 0 .499s-.707-.198-.82-.85c-.124.293 0 .469 0 .469s-1.153-.602-3.069-.61c-1.283-.118-1.55-2.374-1.43-2.754 0 0-1.85-.975-5.493-1.406-3.642-.43-6.628-.065-6.628-.065s6.45-.31 11.617 1.783c.176.785.704 2.094.989 2.723-.815.563-1.733 1.092-1.876 2.97-.143 1.878 1.472 3.53 3.474 3.58 1.9.102 3.214.116 4.806.942 1.52.84 2.766 3.4 2.89 5.703.132-1.709-.509-5.383-3.5-6.498 4.181.732 4.549 3.832 4.549 3.832zM12.68 5.663l-.15-.485s-2.484-.441-5.822-.204C3.37 5.211 0 6.38 0 6.38s6.896-1.735 12.68-.717Z',
      espressif: 'M12.926 19.324a7.6 7.6 0 00-2.983-6.754 7.44 7.44 0 00-3.828-1.554.697.697 0 01-.606-.731.674.674 0 01.743-.617 8.97 8.97 0 018 9.805 7.828 7.828 0 01-.298 1.542l1.989.56a11.039 11.039 0 001.714-.651 12.159 12.159 0 00.217-2.343A12.57 12.57 0 007.212 6.171a5.53 5.53 0 00-2 0 4.354 4.354 0 00-2.16 1.337 4.274 4.274 0 001.909 6.856 9.896 9.896 0 001.074.195 4.011 4.011 0 013.337 3.954 3.965 3.965 0 01-.64 2.16l1.371.88a10.182 10.182 0 002.057.342 7.52 7.52 0 00.754-2.628m.16 4.73A13.073 13.073 0 01.001 10.983 12.982 12.982 0 013.83 1.737l.743.697a12.067 12.067 0 000 17.141 12.067 12.067 0 0017.141 0l.697.697a12.97 12.97 0 01-9.336 3.726M24 10.993A10.993 10.993 0 0012.949 0c-.389 0-.766 0-1.143.057l-.252.732a18.912 18.912 0 0111.588 11.576l.731-.263c0-.366.069-.732.069-1.143m-1.269 5.165A17.53 17.53 0 007.818 1.27a11.119 11.119 0 00-2.457 1.77v1.635A13.919 13.919 0 0119.268 18.57h1.634a11.713 11.713 0 001.771-2.446M7.92 17.884a1.691 1.691 0 11-1.69-1.691 1.691 1.691 0 011.69 1.691',
      arduino: 'M18.087 6.146c-.3 0-.607.017-.907.069-2.532.367-4.23 2.239-5.18 3.674-.95-1.435-2.648-3.307-5.18-3.674a6.49 6.49 0 0 0-.907-.069C2.648 6.146 0 8.77 0 12s2.656 5.854 5.913 5.854c.3 0 .607-.017.916-.069 2.531-.376 4.23-2.247 5.18-3.683.949 1.436 2.647 3.307 5.18 3.683.299.043.607.069.915.069C21.344 17.854 24 15.23 24 12s-2.656-5.854-5.913-5.854zM6.53 15.734a3.837 3.837 0 0 1-.625.043c-2.148 0-3.889-1.7-3.889-3.777 0-2.085 1.749-3.777 3.898-3.777.208 0 .416.017.624.043 2.39.35 3.847 2.768 4.347 3.734-.508.974-1.974 3.384-4.355 3.734zm11.558.043c-.208 0-.416-.017-.624-.043-2.39-.35-3.856-2.768-4.347-3.734.491-.966 1.957-3.384 4.347-3.734.208-.026.416-.043.624-.043 2.149 0 3.89 1.7 3.89 3.777 0 2.085-1.75 3.777-3.89 3.777zm1.65-4.404v1.134h-1.205v1.182h-1.156v-1.182H16.17v-1.134h1.206V10.19h1.156v1.183h1.206zM4.246 12.498H7.82v-1.125H4.245v1.125z',
      raspberrypi: 'm19.8955 10.8961-.1726-.3028c.0068-2.1746-1.0022-3.061-2.1788-3.7348.356-.0938.7237-.1711.8245-.6182.6118-.1566.7397-.4398.8011-.7398.16-.1066.6955-.4061.6394-.9211.2998-.2069.4669-.4725.3819-.8487.3222-.3515.407-.6419.2702-.9096.3868-.4805.2152-.7295.05-.9817.2897-.5254.0341-1.0887-.7758-.9944-.3221-.4733-1.0244-.3659-1.133-.3637-.1215-.1519-.2819-.2821-.7755-.219-.3197-.2851-.6771-.2364-1.0458-.0964-.4378-.3403-.7275-.0675-1.0584.0356-.53-.1706-.6513.0631-.9117.1583-.5781-.1203-.7538.1416-1.0309.4182l-.3224-.0063c-.8719.5061-1.305 1.5366-1.4585 2.0664-.1536-.5299-.5858-1.5604-1.4575-2.0664l-.3223.0063C9.942.5014 9.7663.2394 9.1883.3597 8.9279.2646 8.807.0309 8.2766.2015c-.2172-.0677-.417-.2084-.6522-.2012l.0004.0002C7.5017.0041 7.369.049 7.2185.166c-.3688-.1401-.7262-.1887-1.0459.0964-.4936-.0631-.654.0671-.7756.219C5.2887.4791 4.5862.3717 4.264.845c-.8096-.0943-1.0655.4691-.7756.9944-.1653.2521-.3366.5013.05.9819-.1367.2677-.0519.5581.2703.9096-.085.3763.0822.6418.3819.8487-.0561.515.4795.8144.6394.9211.0614.3001.1894.5832.8011.7398.1008.4472.4685.5244.8245.6183-1.1766.6737-2.1856 1.56-2.1788 3.7348l-.1724.3028c-1.3491.8082-2.5629 3.4056-.6648 5.5167.124.6609.3319 1.1355.5171 1.6609.2769 2.117 2.0841 3.1082 2.5608 3.2255.6984.524 1.4423 1.0212 2.449 1.3696.949.964 1.977 1.3314 3.0107 1.3308.0152 0 .0306.0002.0457 0 1.0337.0006 2.0618-.3668 3.0107-1.3308 1.0067-.3483 1.7506-.8456 2.4491-1.3696.4766-.1173 2.2838-1.1085 2.5607-3.2255.1851-.5253.3931-1 .517-1.6609 1.8981-2.1113.6843-4.7089-.6649-5.517zm-1.0386-.3715c-.0704.8759-4.6354-3.0504-3.8472-3.1808 2.1391-.3558 3.9191.896 3.8472 3.1808zm-2.0155 4.3649c-1.1481.7409-2.8025.2626-3.6953-1.0681-.8928-1.3306-.6858-3.0101.4623-3.7509 1.1481-.7409 2.8025-.2627 3.6953 1.068.8927 1.3307.6858 3.0101-.4623 3.751zM13.6591 1.3721c.0396.1967.0843.321.1354.3577.2537-.272.4611-.5506.7878-.8123.0011.1537-.0776.3205.1169.4425.1752-.2356.4119-.4459.7263-.6244-.1514.2611-.026.3404.0554.4486.24-.2059.4681-.4144.9109-.5759-.121.1474-.2902.2914-.1108.4607.2473-.1544.496-.3086 1.0833-.4183-.1323.1475-.4059.295-.2401.4426.3104-.1186.6539-.2047 1.034-.2546-.182.1496-.3337.2963-.1846.4122.3323-.1022.7899-.2398 1.2372-.1212l-.2832.2849c-.0314.0382.6623.0297 1.1202.0364-.167.2321-.3375.4562-.437.8548.0454.0459.2723.0204.4862 0-.2194.4618-.6004.5783-.6893.776.134.1015.32.075.5232.006-.158.3254-.4892.5484-.7509.8123.0662.047.1818.075.4555.0425-.2418.257-.5339.492-.8802.7032.0614.0708.2722.0681.4678.0727-.3136.3069-.7173.466-1.0955.6668.1885.1288.3234.0988.4678.097-.2676.2198-.7225.3342-1.1448.4668.0803.1249.1607.1589.3324.194-.447.2473-1.0873.1343-1.2679.2607.0435.1243.1665.2053.3139.2728-.7197.0418-2.6879-.0262-3.0652-1.5156.7367-.8094 2.0813-1.7593 4.394-2.934-1.7994.6022-3.4229 1.405-4.7817 2.5096-1.5978-.7436-.4965-2.6197.283-3.3645zm-1.6126 5.3718c1.1329-.0123 2.5356.8325 2.53 1.6286-.005.7027-.9851 1.2715-2.5213 1.2607-1.5043-.0177-2.5172-.7148-2.5137-1.3957.003-.5603 1.2282-1.5263 2.505-1.4936zm-5.7646-.6006c.1717-.0351.252-.0692.3323-.194-.4223-.1327-.8772-.247-1.1448-.4668.1444.0018.2792.0318.4678-.097-.3783-.2008-.782-.3599-1.0956-.6668.1955-.0048.4064-.002.4677-.0728-.3462-.2113-.6383-.4463-.8801-.7033.2738.0325.3893.0045.4555-.0425-.2617-.264-.593-.487-.7509-.8123.2032.069.3892.0954.5232-.006-.089-.1977-.47-.3142-.6894-.776.214.0204.4409.0459.4863 0-.0994-.3985-.2698-.6226-.4369-.8547.4579-.0067 1.1516.0018 1.1202-.0364l-.2831-.2849c.4472-.1186.9049.019 1.2371.1213.1492-.1159-.0026-.2626-.1847-.4123.3801.05.7236.1361 1.034.2547.1659-.1476-.1076-.2951-.24-.4426.5872.1097.8361.2639 1.0833.4183.1794-.1694.0103-.3133-.1108-.4607.4428.1615.6709.37.911.5759.0814-.1082.2068-.1875.0554-.4486.3143.1785.5511.3888.7263.6244.1945-.122.1159-.2888.1169-.4426.3267.2618.534.5404.7879.8124.0511-.0366.0959-.161.1354-.3577.7794.7448 1.8807 2.6208.2831 3.3646-1.3589-1.1039-2.9817-1.9064-4.78-2.5086 2.3115 1.174 3.6556 2.1239 4.392 2.9328-.3773 1.4895-2.3455 1.5575-3.0651 1.5157.1473-.0676.2703-.1485.3139-.2728-.1806-.1264-.8209-.0134-1.2679-.2607zm2.8175 1.1334c.7881.1304-3.7769 4.0567-3.8472 3.1809-.0719-2.2846 1.7079-3.5367 3.8472-3.1809zm-4.847 8.7567c-1.1094-.8789-1.4668-3.4529.5901-4.6097 1.2394-.3273.4184 5.051-.5901 4.6097zm4.2656 4.5989c-.6257.3719-2.1452.2187-3.2252-1.3095-.7283-1.2823-.6345-2.5872-.123-2.9705.7648-.4589 1.9464.1609 2.8559 1.2003.7923.9405 1.1536 2.5927.4923 3.0797zm-1.2415-5.6086c-1.1481-.7409-1.3551-2.4203-.4623-3.7511.8928-1.3307 2.5472-1.8089 3.6952-1.068 1.1481.7409 1.3551 2.4203.4623 3.7509-.8926 1.3308-2.5471 1.809-3.6952 1.0682zm4.7948 8.2279c-1.3763.0584-2.7258-1.1105-2.7081-1.5157-.0206-.594 1.6758-1.0578 2.782-1.0306 1.1131-.0479 2.6068.3531 2.6097.8851.0184.5166-1.3547 1.6838-2.6836 1.6612zm2.7584-5.8578c.0081 1.3899-1.226 2.5225-2.7562 2.5299-1.5302.0073-2.7773-1.1135-2.7854-2.5033v-.0265c-.008-1.3899 1.2259-2.5226 2.7562-2.5299 1.5302-.0073 2.7773 1.1134 2.7853 2.5033a.7794.7794 0 0 1 .0001.0265zm3.855 2.0029c-1.186 1.6208-2.7916 1.684-3.3896 1.2325-.6255-.5811-.148-2.3854.7094-3.3747v-.0003c.9812-1.0912 2.0302-1.8037 2.7609-1.2469.4919.4828.7805 2.3008-.0807 3.3894zm1.0724-3.4301c-1.0086.4413-1.8298-4.9372-.5901-4.61 2.0568 1.1569 1.6994 3.731.5901 4.61zm-.0256-8.3279h.2985v-.5304h.2986c.1502 0 .2053.0624.2262.2052.0152.1088.0113.2395.0477.3253h.2984c-.0533-.0763-.0515-.2358-.0571-.3213-.0097-.1373-.0513-.2796-.1977-.3176v-.0037c.1502-.061.2149-.1807.2149-.341 0-.2048-.1539-.3738-.3974-.3738h-.732v1.3573zm.2985-1.1255h.3269c.1333 0 .2054.0573.2054.188 0 .1369-.0721.1942-.2054.1942H20.03v-.3822zm-1.0337.4633c0 .7009.5682 1.2694 1.2695 1.2694s1.2695-.5684 1.2695-1.2694c0-.7013-.5683-1.2697-1.2695-1.2697-.7013 0-1.2695.5684-1.2695 1.2697zm2.3275 0c0 .5845-.4737 1.058-1.058 1.058s-1.058-.4735-1.058-1.058c0-.5849.4737-1.058 1.058-1.058s1.058.4731 1.058 1.058z',
      micropython: 'M0 0h11.509v18.737h.982V0H24v24h-5.263V5.263h-.983V24H6.246V5.263l-.983.035V24H0zm22.246 19.509h-1.404v2.386h1.404z',
      mqtt: 'M10.657 23.994h-9.45A1.212 1.212 0 0 1 0 22.788v-9.18h.071c5.784 0 10.504 4.65 10.586 10.386Zm7.606 0h-4.045C14.135 16.246 7.795 9.977 0 9.942V6.038h.071c9.983 0 18.121 8.044 18.192 17.956Zm4.53 0h-.97C21.754 12.071 11.995 2.407 0 2.372v-1.16C0 .55.544.006 1.207.006h7.64C15.733 2.49 21.257 7.789 24 14.508v8.291c0 .663-.544 1.195-1.207 1.195ZM16.713.006h6.092A1.19 1.19 0 0 1 24 1.2v5.914c-.91-1.242-2.046-2.65-3.158-3.762C19.588 2.11 18.122.987 16.714.005Z',
      proxmox: 'M4.928 1.825c-1.09.553-1.09.64-.07 1.78 5.655 6.295 7.004 7.782 7.107 7.782.139.017 7.971-8.542 8.058-8.801.034-.07-.208-.312-.519-.536-.415-.312-.864-.433-1.712-.467-1.59-.104-2.144.242-4.115 2.455-.899 1.003-1.66 1.833-1.66 1.833-.017 0-.76-.813-1.642-1.798S8.473 2.1 8.127 1.91c-.796-.45-2.421-.484-3.2-.086zM1.297 4.367C.45 4.695 0 5.007 0 5.248c0 .121 1.331 1.678 2.94 3.459 1.625 1.78 2.939 3.268 2.939 3.302 0 .035-1.331 1.522-2.94 3.303C1.314 17.11.017 18.683.035 18.822c.086.467 1.504 1.055 2.541 1.055 1.678-.018 2.058-.312 5.603-4.202 1.78-1.954 3.233-3.614 3.233-3.666 0-.069-1.435-1.694-3.199-3.63-2.3-2.508-3.423-3.632-3.96-3.874-.812-.398-2.126-.467-2.956-.138zm18.467.12c-.502.26-1.764 1.505-3.943 3.891-1.763 1.937-3.199 3.562-3.199 3.631 0 .07 1.453 1.712 3.234 3.666 3.544 3.89 3.925 4.184 5.602 4.202 1.038 0 2.455-.588 2.542-1.055.017-.156-1.28-1.712-2.905-3.493-1.608-1.78-2.94-3.285-2.94-3.32 0-.034 1.332-1.539 2.94-3.32C22.72 6.91 24.017 5.352 24 5.214c-.087-.45-1.366-.968-2.473-1.038-.795-.034-1.21.035-1.763.312zM7.954 16.973c-2.144 2.369-3.908 4.374-3.943 4.46-.034.07.208.312.52.537.414.311.864.432 1.711.467 1.574.103 2.161-.26 4.15-2.508.864-.968 1.608-1.78 1.625-1.78s.761.812 1.643 1.798c2.023 2.248 2.559 2.576 4.132 2.49.848-.035 1.297-.156 1.712-.467.311-.225.553-.467.519-.536-.087-.26-7.92-8.819-8.058-8.801-.069 0-1.867 1.954-4.011 4.34z',
      linux: 'M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z',
      springboot: 'm23.693 10.7058-4.73-8.1844c-.4094-.7106-1.4166-1.2942-2.2402-1.2942H7.2725c-.819 0-1.8308.5836-2.2402 1.2942L.307 10.7058c-.4095.7106-.4095 1.873 0 2.5837l4.7252 8.189c.4094.7107 1.4166 1.2943 2.2402 1.2943h9.455c.819 0 1.826-.5836 2.2402-1.2942l4.7252-8.189c.4095-.7107.4095-1.8732 0-2.5838zM10.9763 5.7547c0-.5365.4377-.9742.9742-.9742s.9742.4377.9742.9742v5.8217c0 .5366-.4377.9742-.9742.9742s-.9742-.4376-.9742-.9742zm.9742 12.4294c-3.6427 0-6.6077-2.965-6.6077-6.6077.0047-2.0896.993-4.0521 2.6685-5.304a.8657.8657 0 0 1 1.2142.1788.8657.8657 0 0 1-.1788 1.2143c-2.1602 1.6048-2.612 4.6592-1.0072 6.8194 1.6049 2.1603 4.6593 2.612 6.8195 1.0072 1.2378-.9177 1.9673-2.372 1.9673-3.9157a4.8972 4.8972 0 0 0-1.9861-3.925c-.386-.2824-.466-.8284-.1836-1.2143.2824-.386.8283-.466 1.2143-.1835 1.6895 1.2471 2.6826 3.2238 2.6873 5.3228 0 3.6474-2.965 6.6077-6.6077 6.6077z',
      typescript: 'M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z',
      html5: 'M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z',
      jupyter: 'M7.157 22.201A1.784 1.799 0 0 1 5.374 24a1.784 1.799 0 0 1-1.784-1.799 1.784 1.799 0 0 1 1.784-1.799 1.784 1.799 0 0 1 1.783 1.799zM20.582 1.427a1.415 1.427 0 0 1-1.415 1.428 1.415 1.427 0 0 1-1.416-1.428A1.415 1.427 0 0 1 19.167 0a1.415 1.427 0 0 1 1.415 1.427zM4.992 3.336A1.047 1.056 0 0 1 3.946 4.39a1.047 1.056 0 0 1-1.047-1.055A1.047 1.056 0 0 1 3.946 2.28a1.047 1.056 0 0 1 1.046 1.056zm7.336 1.517c3.769 0 7.06 1.38 8.768 3.424a9.363 9.363 0 0 0-3.393-4.547 9.238 9.238 0 0 0-5.377-1.728A9.238 9.238 0 0 0 6.95 3.73a9.363 9.363 0 0 0-3.394 4.547c1.713-2.04 5.004-3.424 8.772-3.424zm.001 13.295c-3.768 0-7.06-1.381-8.768-3.425a9.363 9.363 0 0 0 3.394 4.547A9.238 9.238 0 0 0 12.33 21a9.238 9.238 0 0 0 5.377-1.729 9.363 9.363 0 0 0 3.393-4.547c-1.712 2.044-5.003 3.425-8.772 3.425Z',
      vitest: 'M11.545 23.3a.613.613 0 0 1-.895.197L.252 15.936A.61.61 0 0 1 0 15.439V6.325c0-.502.569-.792.975-.497l6.358 4.624c.594.433 1.432.25 1.793-.39L14.393.7a.62.62 0 0 1 .535-.314h8.455a.613.613 0 0 1 .537.916z'
    };
    d.glyphs = {
      chip: 'M7 7h10v10H7zM10 10h4v4h-4zM9.5 3.5V7M14.5 3.5V7M9.5 17v3.5M14.5 17v3.5M3.5 9.5H7M3.5 14.5H7M17 9.5h3.5M17 14.5h3.5',
      db: 'M5 6c0-1.66 3.13-3 7-3s7 1.34 7 3-3.13 3-7 3-7-1.34-7-3zM5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3',
      radar: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9zM12 12l6.4-6.4M15.5 15.2h.01',
      wave: 'M2.5 16h3.8V8h3.8v8h3.8V8h3.8v8h3.8',
      gate: 'M5 6h6a6 6 0 0 1 0 12H5zM2 9.5h3M2 14.5h3M17 12h5',
      tree: 'M9 3h6v4H9zM12 7v3M5.5 10h13M5.5 10v3M12 10v3M18.5 10v3M3.5 13h4v4h-4zM10 13h4v4h-4zM16.5 13h4v4h-4z',
      wall: 'M3 5h18v14H3zM3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19',
      net: 'M10 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM3 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM17 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM11 6.8l-5 9.4M13 6.8l5 9.4M7 18h10',
      filter: 'M3.5 4.5h17l-6.5 8v6.5l-4 1.5v-8zM6.5 8h11',
      lambda: 'M5 20l6.2-10.6M8.2 4h3l7.3 16',
      bars: 'M3.5 20.5h17M6 20.5v-6M10.5 20.5V9M15 20.5v-9M19.5 20.5V4.5'
    };
    d.equip = [
      { k: 'C++', short: 'C/C++', slot: 'Mão principal', icon: 'cplusplus', col: '#5B9BD5', flav: 'Chega no registrador sem pedir licença.' },
      { k: 'PY', short: 'Python', slot: 'Mão secundária', icon: 'python', col: '#5A9BD0', flav: 'Resolve em dez linhas o que ia levar uma tarde.' },
      { k: 'SQL', short: 'SQL', slot: 'Amuleto', icon: 'db', col: '#E8E4D4', flav: 'SELECT * FROM problemas WHERE resolvido = 0;' },
      { k: 'EMB', short: 'Embarcados', slot: 'Armadura', icon: 'chip', col: '#F0CE6A', name: 'Sistemas embarcados / Infra', type: 'Hardware e infra', use: 'ESP32, Arduino e Pi Pico na bancada; Proxmox, Linux e Windows Server no lab.', flav: 'Do pino ao servidor.' },
      { k: 'KALI', short: 'Kali', slot: 'Arco', icon: 'kalilinux', col: '#8DB9D6', flav: 'Só dispara com escopo por escrito.' },
      { k: 'SIEM', short: 'SIEM', slot: 'Elmo', icon: 'radar', col: '#8FD3A6', flav: 'Enxerga o ataque pelo rastro.' },
      { k: 'GIT', short: 'Git', slot: 'Botas', icon: 'git', col: '#F05033', flav: 'Ctrl+Z com histórico.' },
      { k: 'NONE', short: 'vazio', slot: 'Anel', empty: true, name: 'Slot vazio', type: 'Anel', use: 'Procurando estágio em infraestrutura, segurança ou sistemas embarcados pra equipar aqui.', flav: '' }
    ];
    // PoE-style backpack: [inventory key, icon, color, column, row, width, height] on an 8×4 grid
    d.bag = [
      ['PVE', 'proxmox', '#E57000', 1, 1, 2, 2],
      ['ESP', 'espressif', '#E7352C', 3, 1, 1, 2],
      ['PICO', 'raspberrypi', '#D1456A', 4, 1, 1, 2],
      ['UNO', 'arduino', '#1FA9AE', 5, 1, 2, 1],
      ['TUX', 'linux', '#FCC624', 7, 1, 1, 1],
      ['MPY', 'micropython', '#E8E4D4', 8, 1, 1, 1],
      ['MQTT', 'mqtt', '#B77BB7', 5, 2, 1, 1],
      ['I2C', 'wave', '#A3AD9F', 6, 2, 1, 1],
      ['LOGI', 'gate', '#A3AD9F', 7, 2, 1, 1],
      ['AD', 'tree', '#A3AD9F', 1, 3, 1, 1],
      ['IPF', 'wall', '#E07A6E', 2, 3, 1, 1],
      ['NET', 'net', '#A3AD9F', 3, 3, 1, 1],
      ['FW', 'filter', '#E0906E', 7, 3, 1, 1],
      ['JAVA', 'springboot', '#6DB33F', 4, 3, 1, 1],
      ['TS', 'typescript', '#4A90E2', 5, 3, 1, 1],
      ['WEB', 'html5', '#E34F26', 6, 3, 1, 1],
      ['DATA', 'jupyter', '#F37626', 1, 4, 1, 1],
      ['AWS', 'lambda', '#F0A13A', 2, 4, 1, 1],
      ['TEST', 'vitest', '#7AD89A', 3, 4, 1, 1],
      ['BI', 'bars', '#E8C547', 4, 4, 1, 1]
    ];
    this._d = d;
    return d;
  }

  // inventory key -> the icon it wears in Sobre's loadout (brand logos are filled, line glyphs stroked)
  invIcons() {
    if (this._icons) return this._icons;
    const d = this.data();
    const out = {};
    d.equip.forEach((e) => {
      if (e.empty) return;
      const lg = d.logos[e.icon];
      out[e.k] = { d: lg || d.glyphs[e.icon] || '', col: e.col, logo: !!lg };
    });
    d.bag.forEach((b) => {
      const lg = d.logos[b[1]];
      out[b[0]] = { d: lg || d.glyphs[b[1]] || '', col: b[2], logo: !!lg };
    });
    this._icons = out;
    return out;
  }

  clock() {
    const n = this.st().now || Date.now();
    if (this._fmt === undefined) {
      try {
        this._fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      } catch (err) {
        this._fmt = null;
      }
    }
    return this._fmt ? this._fmt.format(n) : new Date(n).toTimeString().slice(0, 8);
  }

  unlock(id, note) {
    this._got = this._got || {};
    if (this._got[id]) return;
    const t = this.data().trophies.find((x) => x.id === id);
    if (!t) return;
    const add = {};
    add[id] = true;
    this._got = Object.assign({}, this._got, add);
    if (Date.now() - (this._sfxAt || 0) < 250) setTimeout(() => this.sfx('trophy'), 380);
    else this.sfx('trophy');
    this.toastShow('Conquista desbloqueada', t.name + (note ? ' · ' + note : ''), false, t.ic);
    this.setState({ got: this._got });
    this.persist(true);
    const all = this.data().trophies.every((x) => this._got[x.id]);
    if (all && !this._platShown) {
      this._platShown = true;
      clearTimeout(this._credT);
      this._credT = setTimeout(() => this.openCredits(), 3200);
    }
  }

  // the achievements screen: a small popup with every trophy (pause menu, the trophy drawer and the palette open it)
  openAch(sel) {
    const d = this.data();
    const got = this._got || {};
    const ids = Object.keys(got).filter((k) => d.trophies.some((t) => t.id === k));
    const pick = sel || (ids.length ? ids[ids.length - 1] : d.trophies[0].id);
    this.sfx('select');
    this._achFocus = true;
    this.setState({ achOpen: true, achSel: pick, achHint: '', troOpen: false, paused: false, palOpen: false });
  }

  closeAch() {
    if (!this.st().achOpen) return;
    this.sfx('select');
    this.setState({ achOpen: false, achHint: '' });
    this.focusRoot();
  }

  // arrow keys walk the trophy grid (focus follows, and focus selects)
  achKey(e) {
    const k = e && e.key;
    const g = this._achGrid;
    if (!g || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].indexOf(k) < 0) return;
    const tiles = Array.prototype.slice.call(g.querySelectorAll('.ach-s'));
    const i = tiles.indexOf(e.target);
    if (i < 0) return;
    let cols = 8;
    try {
      cols = Math.max(1, getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length);
    } catch (err) {
      cols = 8;
    }
    let j = i;
    if (k === 'ArrowLeft') j = i - 1;
    else if (k === 'ArrowRight') j = i + 1;
    else if (k === 'ArrowUp') j = i - cols;
    else if (k === 'ArrowDown') j = i + cols;
    else if (k === 'Home') j = 0;
    else if (k === 'End') j = tiles.length - 1;
    j = Math.max(0, Math.min(tiles.length - 1, j));
    e.preventDefault();
    if (j !== i && tiles[j].focus) tiles[j].focus();
  }

  // terminal hints are written from inside the Lab ("aqui no terminal"); the popup can open anywhere
  achHintText(id) {
    const h = this.data().hints[id] || '';
    const t = h.replace('aqui mesmo', 'no terminal do Lab').replace(', aqui no Lab', ' no Lab').replace('daqui do Lab', 'do Lab').replace('aqui no terminal', 'no terminal do Lab');
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  }

  toastShow(kick, name, info, ic) {
    this._toastSlot = this._toastSlot === 'a' ? 'b' : 'a';
    this.setState({ toast: { kick: kick, name: name, info: !!info, ic: ic || '' }, toastSlot: this._toastSlot });
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.setState({ toast: null }), 3700);
  }

  go(to, then) {
    const s = this.st();
    if (s.transitioning) return;
    if (to === this.curPage()) {
      if (s.troOpen || s.paused || s.palOpen || s.achOpen) this.setState({ troOpen: false, paused: false, palOpen: false, achOpen: false });
      if (then) then();
      return;
    }
    if (s.pcOpen || this._pc) this.closePc();
    if (s.dOpen) this.d20Close();
    if (s.skOpen) this.skClose();
    // leaving the bedroom: he walks out through the door first (the mirror of the walk-in)
    if (this.curPage() === 'quarto' && !this._rmOutGo && this.rmExit(to, then)) return;
    this._rmOut = null;
    this.tripSync();
    clearTimeout(this._t1);
    clearTimeout(this._t2);
    clearTimeout(this._doorT);
    const from = this.curPage();
    if (to === 'lab' && from !== 'lab') this._labFrom = from;
    // on the regular site he walks out of the door he'd have come through: going forward he comes
    // in from the left, going back from the right; out of the bedroom he stops to look around
    const WP = this.worldPages();
    if (WP.indexOf(to) >= 0) {
      const fi = WP.indexOf(from);
      this._wEnter = { page: to, side: fi > WP.indexOf(to) ? 'R' : 'L', flourish: fi < 0 };
    }
    this.sfx('nav');
    this.setState({ transitioning: true, nextPage: to, troOpen: false, achOpen: false, paused: false, palOpen: false });
    this._t1 = setTimeout(() => {
      const add = {};
      add[to] = true;
      this._visited = Object.assign({}, this._visited || {}, add);
      this.setState({ page: to, openProj: -1, rmDlg: false, rmHov: -1, doorTip: false });
      // back in the room, or at the site's front page: the "opened from the room" mode ends
      if ((to === 'quarto' || to === 'inicio') && this.st().backRoom) this.setState({ backRoom: false });
      if (to === 'quarto') {
        // he comes in through the door at the bottom and takes two steps; the intro (first visit)
        // starts once he is inside
        this.rmWalkIn();
        this.focusRoot();
      }
      this._wHov = null;
      if (then) then();
      this.persistSoon();
      const all = ['inicio', 'projetos', 'lab', 'sobre', 'quarto', 'contato'].every((k) => this._visited[k]);
      if (all) this.unlock('explorer');
      if (to === 'contato' && this._runStart) {
        const secs = (Date.now() - this._runStart) / 1000;
        this._runStart = 0;
        if (secs <= 15) this.unlock('speed', secs.toFixed(1).replace('.', ',') + ' s');
      }
    }, 680);
    this._t2 = setTimeout(() => this.setState({ transitioning: false }), 1420);
  }

  hasProgress() {
    return this._got?.start === true ||
      ['inicio', 'projetos', 'lab', 'sobre', 'quarto', 'contato'].some((page) => this._visited?.[page] === true) ||
      this.data().room.some((object) => this._roomSeen?.[object.id] === true);
  }

  canContinue() {
    return !!this._hadSave && !this._noSave && this.hasProgress();
  }

  // The kernel-style log runs to completion before the start screen on every boot and reboot.
  bootLogStart() {
    clearTimeout(this._blT);
    const L = this.data().bootLog;
    this._blN = 0;
    this.setState({ bootLog: true, bootN: 0, bootDone: false });
    const next = () => {
      const n = this._blN;
      if (n >= L.length || !this.st().bootLog) {
        this.bootLogEnd();
        return;
      }
      this._blT = setTimeout(() => {
        if (!this.st().bootLog) return;
        this._blN = n + 1;
        this.setState({ bootN: this._blN });
        if (L[n].tag === 'fail') this.sfx('error');
        else if (L[n].fatal) this.sfx('breach');
        else if (L[n].tag === 'warn') this.sfx('blip');
        next();
      }, L[n].ms);
    };
    next();
  }

  bootLogEnd() {
    clearTimeout(this._blT);
    if (!this.st().bootLog) return;
    const L = this.data().bootLog;
    this._blN = L.length;
    this.setState({ bootN: L.length, bootDone: true });
    this._blT = setTimeout(() => this.setState({ bootLog: false }), 380);
  }

  pressStart(snd, fresh) {
    if (this.st().bootLog) return;
    this._snd = snd !== false;
    this.setState({ snd: this._snd });
    if (this._snd) this.audio();
    this.sfx('start');
    this._sfxAt = Date.now() + 900;
    // every way in (continue, new game, no sound) starts in the room, at the door
    const target = 'quarto';
    this._rm = null;
    this.unlock('start');
    this._runStart = target !== 'contato' ? Date.now() : 0;
    if (this._track >= 0 && this._snd) this.startMusic(this._track);
    this.go(target);
  }

  setTk(el) {
    this._tk = el;
    if (el) this.startLoop();
  }

  startLoop() {
    if (this._raf || this._dead || typeof window === 'undefined') return;
    const raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : (fn) => setTimeout(() => fn(Date.now()), 16);
    let last = 0;
    const step = (t) => {
      if (this._dead) {
        this._raf = 0;
        return;
      }
      const dt = last ? Math.min(64, Math.max(0, t - last)) : 16;
      last = t;
      if (document.hidden) { this._raf = raf(step); return; }
      const s = this.state || {};
      const modal = !!(s.paused || s.arcOpen || s.pcOpen || s.deOpen || s.tvGameOpen || s.dOpen || s.skOpen || s.recOpen || s.credOpen || s.achOpen || s.shooterOpen || s.languageOpen);
      const frozen = modal;
      const ft = this._ft;
      if (ft) { ft.push(dt); if (ft.length > 90) ft.shift(); }
      // A failing widget must not stop the character, doors, typing and every other scene.
      const jobs = [
        ['loopFps',t],['loopTicker',dt,modal],['loopModels',dt,frozen],['loopDialog',t],
        ['loopHold',t,dt],['loopDecode',t],['loopDiff',t],['loopArcade',dt],['loopPc',dt],
        ['loopSnake',dt],['loopMini',dt],['loopPocket',dt],['loopSeis'],['loopRoom',dt],['loopWorld',dt],
        ['loopTvGame',dt],['loopMusic'],['loopDebug',t],['loopGoldDice',t],['loopShooter',dt],['loopScene',dt]
      ];
      for (const [name,...args] of jobs) {
        if (typeof this[name] !== 'function') continue;
        try { this[name](...args); }
        catch (err) {
          this._animationErrors = this._animationErrors || {};
          if (this._animationErrors[name] !== err.message) console.error('Portfolio: '+name,err);
          this._animationErrors[name] = err.message;
          this._loopErr = err;
        }
      }
      this._raf = raf(step);
    };
    this._raf = raf(step);
  }

  loopFps(t) {
    if (!this._fpsT0) {
      this._fpsT0 = t;
      this._fpsN = 0;
      return;
    }
    this._fpsN = (this._fpsN || 0) + 1;
    const el = t - this._fpsT0;
    if (el < 500) return;
    this._fps = Math.round(this._fpsN * 1000 / el);
    this._fpsT0 = t;
    this._fpsN = 0;
    const lag = !!(this.state && this.state.lag);
    if (this._fpsEl) this._fpsEl.textContent = (lag ? Math.floor(Math.random() * 6) : this._fps) + ' fps';
    this.autoQual(this._fps);
  }

  loopTicker(dt, frozen) {
    const el = this._tk;
    if (!el) return;
    const target = (this._tkHover || frozen) ? 0 : 0.055;
    const v = this._tkV || 0;
    this._tkV = v + (target - v) * Math.min(1, dt / 220);
    const half = el.scrollWidth / 2;
    let x = (this._tkX || 0) - this._tkV * dt;
    if (half > 0 && x <= -half) x += half;
    this._tkX = x;
    el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
  }

  loopModels(dt, frozen) {
    const els = this._mEl || {};
    ['hw', 'sw'].forEach((m) => {
      const el = els[m];
      const r = this._rot && this._rot[m];
      if (!el || !r) return;
      const dragging = this._drag && this._drag.m === m;
      if (!dragging && !frozen) {
        const idle = m === 'hw' ? 0.014 : -0.012;
        r.vy += (idle - r.vy) * Math.min(1, dt / 900);
        r.ry += r.vy * dt;
        const rest = m === 'hw' ? -24 : -20;
        r.rx += (rest - r.rx) * Math.min(1, dt / 1600);
      }
      el.style.transform = 'rotateX(' + r.rx.toFixed(2) + 'deg) rotateY(' + r.ry.toFixed(2) + 'deg)';
    });
  }

  loopDialog(t) {
    const el = this._dlgEl;
    const dl = this._dlg;
    if (!el || !dl) return;
    if (!dl.t0) dl.t0 = t;
    const n = dl.done ? dl.text.length : Math.min(dl.text.length, Math.floor((t - dl.t0) / 22));
    if (n >= dl.text.length) dl.done = true;
    if (dl.shown !== n || el.textContent.length !== n) {
      if (!dl.done && n > (dl.shown || 0) && n % 3 === 0 && dl.text.charAt(n - 1) !== ' ') this.sfx(dl.who ? 'botblip' : 'blip');
      dl.shown = n;
      el.textContent = dl.text.slice(0, n);
    }
  }

  reboot() {
    const s = this.st();
    if (s.powering || s.transitioning || this.curPage() === 'boot') return;
    this._desktopSession = false;
    this.setState({ deOpen: false, deView: 'home' });
    clearTimeout(this._t3);
    this._runStart = 0;
    this.sfx('off');
    this._arc = null;
    this.persist(false);
    this._pc = null;
    clearTimeout(this._pcT);
    this.setState({ powering: true, troOpen: false, achOpen: false, seis: false, openProj: -1, furi: false, paused: false, palOpen: false, sleeping: 0, recOpen: false, arcOpen: false, pcOpen: false, dOpen: false, skOpen: false, credOpen: false, lag: false, panic: false });
    this.unlock('rage');
    this._t3 = setTimeout(() => {
      this._reboots = (this._reboots || 0) + 1;
      this.setState({ page: 'boot', powering: false, reboots: this._reboots });
      this.bootLogStart();
    }, 760);
  }

  pick(m) {
    if (this._dragEnd && Date.now() - this._dragEnd < 400) return;
    if (this.st().main !== m) this.sfx('select');
    this.setState({ main: m });
    this.unlock('main');
    this.persistSoon();
  }

  mDown(m, e) {
    if (!e || (e.button !== undefined && e.button !== 0)) return;
    const r = this._rot && this._rot[m];
    if (!r) return;
    this._drag = { m: m, id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, lt: Date.now(), moved: false, acc: 0 };
    try {
      if (e.currentTarget && e.currentTarget.setPointerCapture && e.pointerId !== undefined) e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      this._drag.noCap = true;
    }
  }

  mMove(e) {
    const g = this._drag;
    if (!g || !e) return;
    const r = this._rot[g.m];
    const now = Date.now();
    const dx = e.clientX - g.lx;
    const dy = e.clientY - g.ly;
    const dt = Math.max(1, now - g.lt);
    g.lx = e.clientX;
    g.ly = e.clientY;
    g.lt = now;
    if (!g.moved && Math.abs(e.clientX - g.x0) + Math.abs(e.clientY - g.y0) > 5) g.moved = true;
    if (!g.moved) return;
    const dyaw = dx * 0.6;
    r.ry += dyaw;
    r.rx = Math.max(-80, Math.min(12, r.rx - dy * 0.4));
    r.vy = r.vy * 0.4 + (dyaw / dt) * 0.6;
    g.acc += Math.abs(dyaw);
    this._spun[g.m] = (this._spun[g.m] || 0) + Math.abs(dyaw);
    if (this._spun[g.m] >= 360) this.unlock('spin');
  }

  mUp(e) {
    const g = this._drag;
    if (!g) return;
    try {
      if (e && e.currentTarget && e.currentTarget.releasePointerCapture && g.id !== undefined) e.currentTarget.releasePointerCapture(g.id);
    } catch (err) {
      g.noCap = true;
    }
    const r = this._rot[g.m];
    r.vy = Math.max(-1.2, Math.min(1.2, r.vy));
    if (g.moved) {
      this._dragEnd = Date.now();
      if (Date.now() - g.lt > 120) r.vy = r.vy * 0.2;
      this._spun[g.m] = (this._spun[g.m] || 0) + Math.abs(r.vy) * 900;
      if (this._spun[g.m] >= 360) this.unlock('spin');
      if (Math.abs(r.vy) > 0.3) this.sfx('whoosh');
    }
    this._drag = null;
  }

  hoverProj(i) {
    const s = this.st();
    if ((typeof s.openProj === 'number' && s.openProj >= 0) || s.hoverProj === i) return;
    this.setState({ hoverProj: i });
  }

  openProj(i) {
    this.setState({ openProj: i, hoverProj: i });
    this.markQuest(i);
  }

  markQuest(i) {
    this._quests = Object.assign({}, this._quests || {});
    this._quests[i] = true;
    if (Object.keys(this._quests).length >= this.data().projects.length) this.unlock('questlog');
    this.persistSoon();
  }

  nextProj() {
    const s = this.st();
    const n = ((typeof s.openProj === 'number' ? s.openProj : 0) + 1) % this.data().projects.length;
    this.setState({ openProj: -1 });
    clearTimeout(this._cmdT);
    this._cmdT = setTimeout(() => {
      this.setState({ openProj: n, hoverProj: n });
      this.markQuest(n);
    }, 60);
  }

  pickInv(i) {
    this._seen = Object.assign({}, this._seen || {});
    this._seen[i] = true;
    if (this.st().inv !== i) this.setState({ inv: i });
    if (Object.keys(this._seen).length >= this.data().inv.length) this.unlock('collector');
    this.persistSoon();
  }

  holdStart(kind, e) {
    if (e && e.button !== undefined && e.button !== 0) return;
    if (this._hold) return;
    this._holdDecay = null;
    this._hold = { kind: kind, el: e && e.currentTarget ? e.currentTarget : null, t: 0, p: 0, marks: 0, done: false };
    if (kind === 'glass') this.sfx('creak');
    this.startLoop();
  }

  holdEnd() {
    const h = this._hold;
    if (!h) return;
    this._hold = null;
    if (!h.done && h.p > 0) this._holdDecay = { kind: h.kind, el: h.el, p: h.p };
  }

  setHoldVar(h, p) {
    const v = p.toFixed(3);
    if (h.el && h.el.style && h.el.style.setProperty) h.el.style.setProperty('--hp', v);
    if (h.kind === 'glass' && this._rootEl && this._rootEl.style && this._rootEl.style.setProperty) this._rootEl.style.setProperty('--hold', v);
  }

  loopHold(t, dt) {
    const h = this._hold;
    if (h) {
      if (!h.t) h.t = t;
      const dur = h.kind === 'glass' ? 1100 : 900;
      h.p = Math.min(1, Math.max(0, (t - h.t) / dur));
      this.setHoldVar(h, h.p);
      const mark = Math.floor(h.p * 3);
      if (h.kind === 'glass' && mark > h.marks && mark < 3) {
        h.marks = mark;
        this.sfx('crack');
      }
      if (h.p >= 1) {
        h.done = true;
        this._hold = null;
        this.holdDone(h);
      }
    } else if (this._holdDecay) {
      const d = this._holdDecay;
      d.p = Math.max(0, d.p - dt / 260);
      this.setHoldVar(d, d.p);
      if (d.p <= 0) this._holdDecay = null;
    }
  }

  holdDone(h) {
    this.setHoldVar(h, 0);
    if (h.kind === 'pwr') {
      this.reboot();
      return;
    }
    let x = 720;
    let y = 450;
    try {
      const root = this._rootEl;
      if (root && h.el && h.el.getBoundingClientRect) {
        const rr = root.getBoundingClientRect();
        const br = h.el.getBoundingClientRect();
        x = Math.round(br.left + br.width / 2 - rr.left);
        y = Math.round(br.top + br.height / 2 - rr.top);
      }
    } catch (err) {
      x = 720;
    }
    this.breakGlass(x, y);
  }

  breakGlass(x, y) {
    const R = Math.random;
    const shards = [];
    for (let i = 0; i < 16; i++) {
      const pts = [];
      for (let k = 0; k < 3; k++) pts.push(Math.round(R() * 100) + '% ' + Math.round(R() * 100) + '%');
      shards.push({
        x: Math.round(x - 100 + R() * 200), y: Math.round(y - 50 + R() * 100),
        w: Math.round(18 + R() * 46), h: Math.round(16 + R() * 40),
        clip: 'polygon(' + pts.join(', ') + ')',
        dx: Math.round((R() - 0.5) * 360), dy: Math.round(260 + R() * 460), rot: Math.round((R() - 0.5) * 540), d: Math.round(R() * 90)
      });
    }
    let path = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + (R() - 0.5) * 0.4;
      path += 'M' + x + ' ' + y;
      for (let k = 1; k <= 5; k++) {
        const r = k * (60 + R() * 90);
        const aa = a + (R() - 0.5) * 0.35;
        path += 'L' + Math.round(x + Math.cos(aa) * r) + ' ' + Math.round(y + Math.sin(aa) * r);
      }
    }
    this.sfx('shatter');
    this.setState({ shatter: true, shards: shards, shPath: path, broke: true });
    this.unlock('glass');
    clearTimeout(this._shT);
    clearTimeout(this._recT);
    this._shT = setTimeout(() => this.setState({ shatter: false }), 1100);
    this._recT = setTimeout(() => this.openRec(), 220);
  }

  glassKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.openRec();
    }
  }

  glassClick() {
    if (this.st().broke) {
      this.openRec();
      return;
    }
    this.setState({ glassNag: true });
    clearTimeout(this._recT);
    this._recT = setTimeout(() => this.setState({ glassNag: false }), 1400);
  }

  pwrKey(e) {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      this.holdStart('pwr', e);
    }
  }

  pwrClick() {
    if (this.st().powering) return;
    this.setState({ pwrHint: true });
    clearTimeout(this._pwrT);
    this._pwrT = setTimeout(() => this.setState({ pwrHint: false }), 1600);
  }

  openRec(who) {
    const s = this.st();
    if (s.recOpen) return;
    this._recEl = null;
    this.sfx('open');
    this.setState({ recOpen: true, paused: false, palOpen: false, troOpen: false, achOpen: false, arcOpen: false });
  }

  closeRec() {
    if (!this.st().recOpen) return;
    this.setState({ recOpen: false });
    this.focusRoot();
  }

  recGo(to, then) {
    this.setState({ recOpen: false });
    if (this.curPage() === 'boot') this.unlock('start');
    this._rmOutGo = true;
    this.go(to, then);
    this._rmOutGo = false;
  }

  benchUse(i) {
    this.pickInv(i);
    const s = this.st();
    let b = (s.bench || [-1, -1]).slice();
    if (s.benchSt === 'done' || s.benchSt === 'fail' || (b[0] >= 0 && b[1] >= 0)) b = [-1, -1];
    if (b[0] < 0) b[0] = i;
    else b[1] = i;
    this.sfx('key');
    this.benchEval(b);
  }

  benchEval(b) {
    if (b[0] < 0 || b[1] < 0) {
      this.setState({ bench: b, benchSt: '', benchRec: -1 });
      return;
    }
    const d = this.data();
    const ka = d.inv[b[0]][0];
    const kb = d.inv[b[1]][0];
    const ri = b[0] === b[1] ? -1 : d.recipes.findIndex((r) => (r.a === ka && r.b === kb) || (r.a === kb && r.b === ka));
    if (ri >= 0) {
      this.setState({ bench: b, benchSt: 'ready', benchRec: ri });
      this.sfx('ready');
    } else {
      this.setState({ bench: b, benchSt: 'fail', benchRec: -1 });
      this.sfx('error');
    }
  }

  benchTake(slot) {
    const b = (this.st().bench || [-1, -1]).slice();
    if (b[slot] < 0) return;
    b[slot] = -1;
    if (slot === 0 && b[1] >= 0) {
      b[0] = b[1];
      b[1] = -1;
    }
    this.sfx('key');
    this.setState({ bench: b, benchSt: '', benchRec: -1 });
  }

  craft() {
    const s = this.st();
    if (s.benchSt !== 'ready') {
      if (s.benchSt !== 'done') this.sfx('error');
      return;
    }
    this._recipes = Object.assign({}, this._recipes || {});
    const fresh = !this._recipes[s.benchRec];
    this._recipes[s.benchRec] = true;
    this.setState({ benchSt: 'done', benchFresh: fresh, recipesN: Object.keys(this._recipes).length });
    this.sfx('craft');
    this.unlock('craft');
    this.persist(true);
  }

  benchClear() {
    this.sfx('key');
    this.setState({ bench: [-1, -1], benchSt: '', benchRec: -1 });
  }

  toggleGame(i) {
    this._gamesRead = Object.assign({}, this._gamesRead || {});
    this._gamesRead[i] = true;
    const n = Object.keys(this._gamesRead).length;
    this.setState({ gameOpen: this.st().gameOpen === i ? -1 : i, gamesRead: n });
    if (n >= this.data().games.length) this.unlock('lore');
    this.persistSoon();
  }

  readName() {
    const on = !this.st().furi;
    this.setState({ furi: on });
    if (on) this.unlock('furigana');
  }

  groundEnter() {
    clearTimeout(this._toesT);
    this._toesT = setTimeout(() => this.unlock('toes'), 4000);
  }

  groundLeave() {
    clearTimeout(this._toesT);
  }

  bend() {
    if (this.st().bent) return;
    this.setState({ bent: true });
    this.unlock('metal');
  }

  safeKey(k) {
    const s = this.st();
    const now = Date.now();
    if (s.safeLock && now < s.safeLock) return;
    if (s.safeOpen) {
      if (k === '*' || k === '#') this.setState({ safeOpen: false, safeIn: '', safeMsg: '' });
      return;
    }
    if (k === '*') {
      this.setState({ safeIn: '', safeMsg: '' });
      return;
    }
    if (k === '#') {
      const code = s.safeIn || '';
      clearTimeout(this._safeT);
      if (code === '2027') {
        this.sfx('unlock');
        this.setState({ safeOpen: true, safeIn: '', safeMsg: '', safeTries: 0 });
        this.unlock('safe');
        return;
      }
      this.sfx('error');
      const tries = (s.safeTries || 0) + 1;
      if (tries >= 3) {
        this.setState({ safeIn: '', safeMsg: '', safeTries: 0, safeLock: now + 5000 });
        this._safeT = setTimeout(() => this.setState({ safeLock: 0 }), 5000);
      } else {
        this.setState({ safeIn: '', safeMsg: 'wrong', safeTries: tries });
        this._safeT = setTimeout(() => this.setState({ safeMsg: '' }), 1300);
      }
      return;
    }
    const cur = s.safeIn || '';
    if (cur.length >= 4) return;
    this.sfx('key');
    this.setState({ safeIn: cur + k, safeMsg: '' });
  }

  audio() {
    if (this._ac === null) return null;
    if (!this._ac) {
      try {
        const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
        if (!AC) {
          this._ac = null;
          return null;
        }
        this._ac = new AC();
        this._mix = this._ac.createGain();
        this._mix.gain.value = 0.55;
        this._mix.connect(this._ac.destination);
      } catch (err) {
        this._ac = null;
        return null;
      }
    }
    if (['suspended', 'interrupted'].includes(this._ac.state) && this._ac.resume) {
      try {
        const p = this._ac.resume();
        if (p && p.catch) p.catch(() => null);
      } catch (err) {
        return this._ac;
      }
    }
    return this._ac;
  }

  tone(f, dur, type, vol, at, to) {
    const ac = this._ac;
    if (!ac || !this._mix) return;
    const t0 = ac.currentTime + (at || 0);
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this._mix);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  noise(dur, vol, at, freq, type) {
    const ac = this._ac;
    if (!ac || !this._mix) return;
    const t0 = ac.currentTime + (at || 0);
    const src = ac.createBufferSource();
    src.buffer = this.noiseBuf();
    const fl = ac.createBiquadFilter();
    fl.type = type || 'lowpass';
    fl.frequency.setValueAtTime(freq || 1200, t0);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol || 0.1, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl);
    fl.connect(g);
    g.connect(this._mix);
    src.start(t0);
    src.stop(t0 + dur + 0.03);
  }

  tvPowerSound() {
    if (!this._ac || this._ac.state !== 'running' || !this._mix) return false;
    try {
      // Soft switch click, a rounded descending "blup", then a brief phosphor hiss.
      this.noise(0.035, 0.045, 0, 700, 'lowpass');
      this.tone(620, 0.28, 'sine', 0.14, 0.07, 62);
      this.tone(150, 0.22, 'triangle', 0.045, 0.09, 46);
      this.tone(74, 0.38, 'sine', 0.045, 0.11, 40);
      this.noise(0.18, 0.022, 0.17, 1900, 'bandpass');
      return true;
    } catch (err) {
      return false;
    }
  }

  sfx(name) {
    if (!this._snd) return;
    const ac = this.audio();
    if (!ac) return;
    this._sfxAt = Date.now();
    const T = (f, dur, type, vol, at, to) => this.tone(f, dur, type, vol, at, to);
    const N = (dur, vol, at, freq, type) => this.noise(dur, vol, at, freq, type);
    const seq = (notes, step, type, vol, len) => notes.forEach((f, i) => T(f, len || step * 1.1, type || 'square', vol || 0.045, i * step));
    // like seq, with a start offset; a 0 is a rest
    const mel = (notes, step, type, vol, at) => notes.forEach((f, i) => { if (f) T(f, step * 1.05, type || 'square', vol || 0.04, (at || 0) + i * step); });
    const r = Math.random();
    try {
      switch (name) {
        case 'hover': T(1480, 0.025, 'square', 0.012); break;
        case 'click': T(900, 0.045, 'square', 0.03, 0, 600); break;
        case 'key': T(640 + r * 90, 0.04, 'square', 0.03); break;
        case 'type': T(1700 + r * 300, 0.018, 'square', 0.012); break;
        case 'blip': T(1250 + r * 120, 0.022, 'square', 0.013); break;
        case 'look': T(1175, 0.05, 'triangle', 0.035); T(1568, 0.07, 'triangle', 0.03, 0.05); break;
        case 'select': T(523, 0.06, 'square', 0.04); T(1046, 0.09, 'square', 0.04, 0.06); break;
        case 'nav': T(392, 0.05, 'square', 0.035); T(587, 0.05, 'square', 0.035, 0.05); T(784, 0.08, 'triangle', 0.04, 0.1); N(0.35, 0.05, 0.05, 2400, 'bandpass'); break;
        case 'start': seq([523, 659, 784, 1047], 0.08, 'square', 0.05); T(1568, 0.3, 'triangle', 0.05, 0.34); break;
        case 'trophy': seq([784, 988, 1175, 1568], 0.07, 'square', 0.04); T(2093, 0.32, 'triangle', 0.04, 0.3); break;
        case 'coin': T(988, 0.07, 'square', 0.045); T(1319, 0.28, 'square', 0.045, 0.07); break;
        case 'unlock': seq([659, 880, 1319], 0.07, 'square', 0.045); break;
        case 'error': T(196, 0.1, 'square', 0.045); T(147, 0.18, 'square', 0.045, 0.1); break;
        case 'ready': T(880, 0.06, 'triangle', 0.04); T(1320, 0.1, 'triangle', 0.04, 0.07); break;
        case 'craft': seq([392, 523, 659, 784, 1047], 0.055, 'square', 0.04); N(0.12, 0.08, 0, 5000, 'highpass'); break;
        case 'stomp': N(0.28, 0.35, 0, 380); T(90, 0.28, 'sine', 0.22, 0, 38); break;
        case 'seis': T(60, 1.4, 'sine', 0.22, 0, 32); N(1.1, 0.18, 0, 220); T(520, 0.9, 'sine', 0.03, 0.25, 1040); break;
        case 'lights': seq([523, 784, 1047], 0.06, 'triangle', 0.04); break;
        case 'ping': T(1760, 0.45, 'sine', 0.035); T(1760, 0.3, 'sine', 0.015, 0.18); break;
        case 'pop': N(0.05, 0.25, 0, 2600 + r * 1600, 'bandpass'); T(520 + r * 260, 0.05, 'square', 0.025, 0, 180); break;
        case 'refill': seq([330, 440, 554, 659], 0.04, 'triangle', 0.035); break;
        case 'pause': seq([988, 740, 988, 740], 0.06, 'square', 0.035, 0.055); break;
        case 'unpause': seq([740, 988], 0.06, 'square', 0.035); break;
        case 'open': T(660, 0.05, 'square', 0.03); T(990, 0.07, 'square', 0.03, 0.05); break;
        case 'special': T(220, 0.32, 'sawtooth', 0.045, 0, 1320); N(0.22, 0.1, 0.06, 1800); break;
        case 'off': T(880, 0.5, 'sine', 0.05, 0, 40); break;
        case 'whoosh': N(0.3, 0.09, 0, 900, 'bandpass'); break;
        case 'sleep': seq([784, 659, 523, 392, 330], 0.22, 'triangle', 0.04, 0.24); break;
        case 'shoot': T(1200, 0.05, 'square', 0.018, 0, 600); break;
        case 'hit': N(0.12, 0.12, 0, 2400, 'bandpass'); T(300, 0.08, 'square', 0.03, 0, 90); break;
        case 'breach': T(160, 0.25, 'sawtooth', 0.05, 0, 60); N(0.2, 0.15, 0, 600); break;
        case 'gameover': seq([392, 330, 262, 196], 0.14, 'square', 0.04, 0.16); break;
        case 'creak': N(0.5, 0.04, 0, 900, 'bandpass'); break;
        case 'crack': N(0.06, 0.22, 0, 5200, 'highpass'); T(2600 + r * 800, 0.03, 'triangle', 0.02); break;
        case 'shatter': N(0.55, 0.32, 0, 4200, 'highpass'); N(0.3, 0.18, 0.02, 1500, 'bandpass'); [2800, 3400, 4100, 3100, 3700, 2500].forEach((f, i) => T(f + r * 300, 0.12, 'triangle', 0.018, 0.03 + i * 0.05)); break;
        case 'strike': N(0.35, 0.07, 0, 2000, 'bandpass'); break;
        case 'merge': seq([523, 659, 784, 1047], 0.07, 'triangle', 0.04); break;
        case 'glitch': for (let i = 0; i < 9; i++) T(80 + Math.random() * 1500, 0.05, 'sawtooth', 0.028, i * 0.07); N(0.7, 0.08, 0, 800); break;
        case 'panic': T(880, 1.1, 'square', 0.025); break;
        case 'bump': T(110, 0.07, 'square', 0.035, 0, 70); break;
        case 'door': N(0.32, 0.05, 0, 760, 'bandpass'); T(210, 0.1, 'square', 0.018, 0, 160); break;
        case 'doorShut': T(96, 0.09, 'square', 0.04, 0, 62); N(0.09, 0.14, 0, 520); break;
        case 'jump': T(330, 0.13, 'square', 0.03, 0, 900); break;
        case 'land': T(150, 0.05, 'square', 0.03, 0, 90); N(0.05, 0.09, 0, 900); break;
        case 'poof': N(0.24, 0.12, 0, 2300, 'bandpass'); T(720, 0.12, 'triangle', 0.02, 0, 1500); break;
        // the room's arcades, pinball, pachinko, consoles, TV and robot: short original jingles
        case 'jInvaders': mel([523, 659, 784, 659, 880, 1047], 0.07, 'square', 0.04); T(1400, 0.16, 'square', 0.025, 0.46, 350); N(0.18, 0.08, 0.5, 1800, 'bandpass'); break;
        case 'jFight': T(110, 0.14, 'sawtooth', 0.05, 0, 70); N(0.12, 0.16, 0, 900); mel([294, 0, 392, 523], 0.08, 'square', 0.045, 0.16); T(784, 0.32, 'square', 0.045, 0.48); T(392, 0.32, 'square', 0.03, 0.48); break;
        case 'jShoot': T(260, 0.22, 'square', 0.03, 0, 1300); mel([1047, 1319, 1568, 2093], 0.05, 'triangle', 0.035, 0.22); [0.5, 0.6, 0.7].forEach((a) => T(1600, 0.05, 'square', 0.02, a, 500)); break;
        case 'jPinball': [1568, 1175, 1760, 1319, 2093].forEach((f, i) => T(f, 0.07, 'square', 0.035, i * 0.08)); N(0.35, 0.05, 0.42, 3000, 'bandpass'); mel([784, 988, 1175, 1568], 0.06, 'triangle', 0.04, 0.5); break;
        case 'jSlug': N(0.45, 0.22, 0, 420); T(82, 0.4, 'sine', 0.2, 0, 38); mel([220, 220, 262, 294, 330], 0.08, 'square', 0.04, 0.3); break;
        case 'jBlocks': mel([523, 587, 659, 523, 784, 659, 1047], 0.075, 'square', 0.04); N(0.25, 0.08, 0.5, 5000, 'highpass'); break;
        case 'jRace': [0, 0.22, 0.44].forEach((a) => T(587, 0.1, 'square', 0.04, a)); T(1175, 0.35, 'square', 0.045, 0.66); T(98, 0.9, 'sawtooth', 0.03, 0.62, 330); break;
        case 'jPachinko': for (let i = 0; i < 14; i++) T(2200 + Math.random() * 1800, 0.03, 'triangle', 0.018, i * 0.035); mel([784, 988, 1175, 1568, 1976], 0.06, 'square', 0.035, 0.5); T(2349, 0.45, 'triangle', 0.035, 0.8); break;
        case 'jNes': N(0.3, 0.1, 0, 1100, 'bandpass'); T(1319, 0.05, 'square', 0.03, 0.36); mel([523, 659, 784, 1047], 0.07, 'square', 0.04, 0.9); break;
        case 'jCarts': N(0.04, 0.25, 0, 3200, 'highpass'); T(180, 0.06, 'square', 0.03, 0.02, 120); mel([659, 880, 1109, 1319, 1760], 0.055, 'square', 0.035, 0.12); break;
        case 'jSnes': T(262, 0.7, 'triangle', 0.04); T(330, 0.7, 'triangle', 0.035, 0.04); T(392, 0.7, 'triangle', 0.035, 0.08); mel([1047, 1319, 1568], 0.09, 'sine', 0.03, 0.3); T(2093, 0.5, 'sine', 0.03, 1.2); break;
        case 'jWii': mel([784, 988, 1175, 1568, 1175], 0.13, 'sine', 0.04); T(2637, 0.08, 'sine', 0.02, 0.7); T(3136, 0.12, 'sine', 0.02, 0.78); break;
        case 'j360': T(80, 1, 'sawtooth', 0.02, 0, 160); N(1, 0.05, 0, 600, 'bandpass'); T(392, 0.25, 'triangle', 0.035, 0.35); T(587, 0.45, 'triangle', 0.035, 0.55); break;
        case 'jOne': T(196, 0.7, 'sine', 0.05, 0, 392); T(784, 0.5, 'sine', 0.03, 0.35); T(1175, 0.6, 'sine', 0.025, 0.6); break;
        case 'jTv': this.tvPowerSound(); break;
        case 'beeps': [1320, 1568, 1175, 1760, 1480].forEach((f, i) => T(f + r * 60, 0.05, 'square', 0.028, i * 0.1)); T(660, 0.1, 'triangle', 0.03, 0.55, 990); break;
        case 'botblip': T(1800 + r * 700, 0.018, 'square', 0.011); break;
        case 'save': mel([1047, 1319, 1568, 2093], 0.07, 'triangle', 0.04); T(2637, 0.45, 'sine', 0.03, 0.3); N(0.3, 0.04, 0.28, 6000, 'highpass'); break;
        case 'sit': N(0.18, 0.1, 0, 500, 'bandpass'); T(140, 0.08, 'square', 0.02, 0.04, 90); break;
        case 'sim0': T(523, 0.22, 'triangle', 0.045); break;
        case 'sim1': T(659, 0.22, 'triangle', 0.045); break;
        case 'sim2': T(784, 0.22, 'triangle', 0.045); break;
        case 'sim3': T(1047, 0.22, 'triangle', 0.045); break;
        case 'dice': for (let i = 0; i < 7; i++) { N(0.03, 0.14, i * 0.07 + r * 0.02, 2600 + Math.random() * 1200, 'bandpass'); T(1800 + Math.random() * 900, 0.02, 'triangle', 0.02, i * 0.07); } break;
        case 'duck': T(240, 0.06, 'square', 0.02, 0, 150); break;
        default: T(880, 0.04, 'square', 0.03);
      }
    } catch (err) {
      this._snd = false;
    }
  }

  toggleSnd() {
    this._snd = !this._snd;
    if (this._snd) this.audio();
    this.setState({ snd: this._snd });
    this.sfx('coin');
    this._sfxAt = Date.now();
    if (!this._snd) this.stopMusic();
    else if (this._track >= 0) this.startMusic(this._track);
    this.persistSoon();
  }

  hoverSfx(e) {
    if (!this._snd) return;
    const t = e && e.target && e.target.closest ? e.target.closest('button, a') : null;
    if (t === this._hovEl) return;
    this._hovEl = t;
    if (!t) return;
    const now = Date.now();
    if (now - (this._hovAt || 0) < 45) return;
    this._hovAt = now;
    this.sfx('hover');
  }

  focusRoot() {
    const el = this._rootEl;
    if (!el || !el.focus) return;
    try {
      el.focus({ preventScroll: true });
    } catch (err) {
      this._rootEl = el;
    }
  }

  rootKey(e) {
    const k = e.key || '';
    const s = this.st();
    if (s.panic || s.arcOpen || s.pcOpen || s.deOpen || s.tvGameOpen) return;
    if (s.dOpen) {
      this.d20Key(e);
      return;
    }
    if (s.skOpen) {
      if (k === 'Escape') {
        e.preventDefault();
        this.skClose();
      }
      return;
    }
    if (s.bootLog && this.curPage() === 'boot') {
      return;
    }
    if (k === 'Escape' && (s.recOpen || s.credOpen)) {
      e.preventDefault();
      if (s.recOpen) this.closeRec();
      else this.closeCredits();
      return;
    }
    if (k === 'F3') {
      e.preventDefault();
      this.toggleDebug();
      return;
    }
    if (this.curPage() === 'boot' || s.powering) return;
    const tg = e.target || {};
    const typing = tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || !!tg.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && (k === 'k' || k === 'K')) {
      e.preventDefault();
      this.togglePal();
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.worldOn() && this.worldKey(e)) return;
    if (this.curPage() === 'quarto' && !s.paused && !s.palOpen && !s.achOpen && !s.recOpen && !s.credOpen && !s.transitioning && !s.sleeping && !s.troOpen) {
      if (this.rmKey(e)) return;
    }
    if (k === 'Escape') {
      if (s.palOpen) this.closePal();
      else if (s.sleeping) return;
      else if (s.paused) this.setPause(false);
      else if (s.achOpen) this.closeAch();
      else if (s.troOpen) this.setState({ troOpen: false });
      else if (s.seis) this.setSeis(false);
      else this.setPause(true);
    } else if (k === '/') {
      e.preventDefault();
      this.openPal();
    } else if (k === 'm' || k === 'M') {
      this.toggleSnd();
    }
  }

  rootKeyUp(e) {
    if (this.curPage() === 'quarto') this.rmKeyUp(e);
    else this.worldKeyUp(e);
  }

  setPause(on) {
    const s = this.st();
    if (this.curPage() === 'boot' || s.powering) return;
    if (!!s.paused === !!on) return;
    this.sfx(on ? 'pause' : 'unpause');
    this._pauseEl = null;
    this.setState({ paused: !!on, palOpen: false, troOpen: false });
    if (!on) this.focusRoot();
  }

  openPal() {
    const s = this.st();
    if (this.curPage() === 'boot' || s.powering || s.palOpen) return;
    this._palInEl = null;
    this.sfx('open');
    this.setState({ palOpen: true, palQ: '', palSel: 0, paused: false, troOpen: false, achOpen: false });
  }

  closePal() {
    if (!this.st().palOpen) return;
    this.setState({ palOpen: false });
    this.focusRoot();
  }

  togglePal() {
    if (this.st().palOpen) this.closePal();
    else this.openPal();
  }

  blob(id) {
    const paths = { edd22477d30dbb43e2be37a46311d7f0: 'resume/hikaru-pt.pdf', b56625947d33ef537f96fff29a580728: 'resume/hikaru-en.pdf', e886952da59a2b1bb49133f618541672: 'resume/hikaru-ja.pdf' };
    return './' + (paths[id] || 'assets/images/portfolio-art.png');
  }

  palAll() {
    const d = this.data();
    const s = this.st();
    const got = this._got || {};
    const gotCount = d.trophies.filter((t) => got[t.id]).length;
    const L = [];
    d.nav.forEach((n, i) => L.push({ k: '0' + (i + 1), name: 'Ir pra ' + n[1], hint: 'tela', kw: n[0] + ' ir tela pagina', act: () => this.go(n[0]) }));
    L.push({ k: 'QRT', name: 'Voltar pro quarto', hint: 'jogo', kw: 'quarto room casa jogo porta', act: () => this.toRoom() });
    d.projects.forEach((p, i) => L.push({ k: p.num, name: 'Missão ' + p.num + ' · ' + p.title, hint: p.tags, kw: 'missao projeto ' + p.stack.join(' '), act: () => this.go('projetos', () => this.openProj(i)) }));
    const fN = this.fichaN();
    L.push({ k: '@', name: 'Copiar e-mail', hint: fN > 0 ? 'você tem ' + fN + (fN === 1 ? ' ficha' : ' fichas') : 'sem fichas', kw: 'email mail contato ficha', act: () => this.mailCoin() });
    L.push({ k: 'PT', name: 'Currículo em português', hint: 'PDF', kw: 'cv curriculo resume pdf', href: this.blob('edd22477d30dbb43e2be37a46311d7f0') });
    L.push({ k: 'EN', name: 'Currículo em inglês', hint: 'PDF', kw: 'cv curriculo resume pdf english', href: this.blob('b56625947d33ef537f96fff29a580728') });
    L.push({ k: 'JP', name: 'Currículo em japonês', hint: 'PDF', kw: 'cv curriculo resume pdf japones', href: this.blob('e886952da59a2b1bb49133f618541672') });
    L.push({ k: 'IN', name: 'LinkedIn', hint: '/in/hikaru-ogasawara', kw: 'linkedin rede social', href: 'https://www.linkedin.com/in/hikaru-ogasawara' });
    L.push({ k: 'GH', name: 'GitHub', hint: '/Hikaru-0gasawara', kw: 'github codigo repositorio', href: 'https://github.com/Hikaru-0gasawara' });
    L.push({ k: 'SND', name: s.snd ? 'Desligar o som' : 'Ligar o som', hint: 'tecla m', kw: 'som audio musica mute 8-bit', act: () => this.toggleSnd() });
    L.push({ k: 'TRO', name: 'Ver conquistas', hint: gotCount + '/' + d.trophies.length, kw: 'trofeus conquistas achievements', act: () => this.openAch() });
    L.push({ k: '?', name: 'Pedir uma dica', hint: 'terminal do lab', kw: 'dica hint ajuda segredo', act: () => this.go('lab', () => this.runCmd('dica')) });
    L.push({ k: 'II', name: 'Pausar', hint: 'esc', kw: 'pausa pause menu', act: () => this.setPause(true) });
    L.push({ k: 'RH', name: 'Modo recrutador', hint: 'resumo em 1 tela', kw: 'recrutador resumo cv rapido pressa vaga rh curriculo', act: () => this.openRec() });
    L.push({ k: 'PI', name: 'Jogar Packet Invaders', hint: 'fliperama', kw: 'jogo arcade fliperama packet invaders jogar game', act: () => this.openArcade() });
    this.tracks().forEach((tr, i) => L.push({ k: '♪' + (i + 1), name: 'Trilha ' + (i + 1) + ' · ' + tr.name, hint: this._track === i ? 'tocando' : 'música', kw: 'trilha musica som chiptune 8-bit', act: () => this.setTrack(i) }));
    L.push({ k: '♪0', name: 'Desligar a trilha', hint: 'música', kw: 'trilha musica parar desligar silencio', act: () => this.setTrack(-1) });
    L.push({ k: 'VID', name: 'Qualidade de vídeo', hint: this._qual === 'auto' ? 'auto' : this._qual, kw: 'video qualidade performance grafico fps economia', act: () => this.cycleQual() });
    L.push({ k: 'F3', name: s.debug ? 'Fechar o modo debug' : 'Modo debug', hint: 'F3', kw: 'debug f3 hitbox fps wireframe', act: () => this.toggleDebug() });
    L.push({ k: 'FIM', name: 'Créditos', hint: 'fim de jogo', kw: 'creditos credits fim zerar', act: () => this.openCredits() });
    L.push({ k: '???', name: 'Sentir o chão', hint: 'segredo', kw: 'toph', hidden: ['toph', 'sentir o chao'], act: (e) => this.seisAt(e, true) });
    return L;
  }

  palFiltered() {
    const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const q = norm(this.st().palQ);
    return this.palAll().filter((it) => {
      if (it.hidden) return it.hidden.indexOf(q) >= 0;
      if (!q) return true;
      const hay = norm(it.name + ' ' + it.hint + ' ' + (it.kw || ''));
      return q.split(/\s+/).every((w) => hay.indexOf(w) >= 0);
    });
  }

  palRun(it, e) {
    this.unlock('palette');
    if (it.href) {
      if (!e || e.type !== 'click') {
        try {
          window.open(it.href, '_blank', 'noopener');
        } catch (err) {
          this.sfx('error');
        }
        this.setState({ palOpen: false });
      } else {
        this._palT = setTimeout(() => this.setState({ palOpen: false }), 0);
      }
      return;
    }
    this.setState({ palOpen: false });
    this.focusRoot();
    if (it.act) it.act(e);
  }

  palKey(e) {
    const list = this.palFiltered();
    const n = list.length;
    let sel = Math.min(this.st().palSel || 0, Math.max(0, n - 1));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!n) return;
      sel = e.key === 'ArrowDown' ? (sel + 1) % n : (sel - 1 + n) % n;
      this._palScroll = true;
      this.sfx('blip');
      this.setState({ palSel: sel });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (list[sel]) this.palRun(list[sel], e);
      else this.sfx('error');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      this.closePal();
    }
  }

  // ---------------- the room: a small top-down RPG (24x14 tiles of 16 px) ----------------
  // the map is data: every object owns a tile rect; walls (rows 0-1) and furniture are solid;
  // the door mat (bottom) is walkable and walking out through it leaves for the regular site
  rmGrid() {
    if (this._rmG) return this._rmG;
    const d = this.data();
    const W = 24;
    const H = 14;
    const solid = [];
    const obj = [];
    for (let i = 0; i < W * H; i++) {
      solid.push(i < W * 2);
      obj.push(-1);
    }
    d.room.forEach((o, i) => {
      const t = o.t;
      for (let y = t[1]; y < t[1] + t[3]; y++) {
        for (let x = t[0]; x < t[0] + t[2]; x++) {
          obj[y * W + x] = i;
          if (!o.walk) solid[y * W + x] = true;
        }
      }
    });
    (d.roomDeco || []).forEach((t) => {
      for (let y = t[1]; y < t[1] + t[3]; y++) {
        for (let x = t[0]; x < t[0] + t[2]; x++) solid[y * W + x] = true;
      }
    });
    this._rmG = { W: W, H: H, solid: solid, obj: obj, door: d.room.findIndex((o) => o.door) };
    return this._rmG;
  }

  rmInit() {
    if (!this._rm) this._rm = { x: 11, y: 12, dir: 'u', moving: false, t: 0, from: [11, 12], to: [11, 12], step: 0, path: [], goal: -1, goalDir: '', held: [], turn: 0, bumpAt: 0, camX: 0, camY: 0, clock: 0 };
    return this._rm;
  }

  rmWalkIn() {
    const rm = this.rmInit();
    this._rmOut = null;
    this.tripSync();
    this.sfx('door');
    Object.assign(rm, { x: 11, y: 15, dir: 'u', moving: false, t: 0, from: [11, 15], to: [11, 15], path: [[11, 14], [11, 13], [11, 12]], goal: -1, goalDir: '', held: [], turn: 0, enter: true, exit: false });
  }

  // Every way out of the room (the door, an object that opens a page, the pause menu, the palette)
  // walks him to the door and down through it before the page changes. A key or a click skips the
  // walk. Returns false when there is nothing to animate (no room on screen, or he is still walking
  // in). The door walks play even with "reduce motion": they are how you get around, and they are short.
  rmExit(to, then) {
    if (this._rmOut) {
      this._rmOut = { to: to, then: then, run: !!this._rmOut.run };
      return true;
    }
    const rm = this._rm;
    if (!rm || !this._rmCv || rm.enter) return false;
    if (rm.sit) this.pcStand(true);
    const G = this.rmGrid();
    const t = G.door >= 0 ? this.data().room[G.door].t : [11, 13, 2, 1];
    const px = rm.moving ? rm.to[0] : rm.x;
    const py = rm.moving ? rm.to[1] : rm.y;
    const onMat = py === t[1] && px >= t[0] && px < t[0] + t[2];
    // he lines up in front of the door and walks straight down through it
    const goals = [];
    for (let x = t[0]; x < t[0] + t[2]; x++) goals.push([x, t[1] - 1]);
    const r = onMat ? { path: [], end: [px, py] } : this.rmPath(px, py, goals);
    if (!r) return false;
    const ex = r.end[0];
    rm.exit = true;
    rm.path = r.path.concat(onMat ? [] : [[ex, t[1]]], [[ex, t[1] + 1], [ex, t[1] + 2]]);
    rm.goal = -1;
    rm.held = [];
    rm.turn = 0;
    this._rmOut = { to: to, then: then, run: false };
    this.sfx('nav');
    this.setState({ rmDlg: false, rmSel: 0, rmIntro: false, rmHov: -1, paused: false, palOpen: false, achOpen: false, troOpen: false });
    this.tripSync();
    this.focusRoot();
    return true;
  }

  rmExitDone() {
    const o = this._rmOut;
    this._rmOut = null;
    this.tripSync();
    const rm = this._rm;
    if (rm) {
      rm.exit = false;
      rm.path = [];
      rm.moving = false;
    }
    if (!o || this.curPage() !== 'quarto') return;
    this._rmOutGo = true;
    this.go(o.to, o.then);
    this._rmOutGo = false;
  }

  rmFree(x, y) {
    const G = this.rmGrid();
    return x >= 0 && y >= 0 && x < G.W && y < G.H && !G.solid[y * G.W + x];
  }

  // breadth-first search on the tile grid; returns the steps after the start (empty if unreachable)
  rmPath(sx, sy, goals) {
    const G = this.rmGrid();
    const key = (x, y) => y * G.W + x;
    const want = {};
    goals.forEach((g) => { want[key(g[0], g[1])] = true; });
    if (want[key(sx, sy)]) return { path: [], end: [sx, sy] };
    const prev = {};
    prev[key(sx, sy)] = -1;
    const q = [[sx, sy]];
    while (q.length) {
      const c = q.shift();
      const nb = [[c[0], c[1] - 1], [c[0] + 1, c[1]], [c[0], c[1] + 1], [c[0] - 1, c[1]]];
      for (const n of nb) {
        const k = key(n[0], n[1]);
        if (!this.rmFree(n[0], n[1]) || prev[k] !== undefined) continue;
        prev[k] = key(c[0], c[1]);
        if (want[k]) {
          const path = [];
          let at = k;
          while (at !== key(sx, sy)) {
            path.unshift([at % G.W, Math.floor(at / G.W)]);
            at = prev[at];
          }
          return { path: path, end: n };
        }
        q.push(n);
      }
    }
    return null;
  }

  rmDirTo(ax, ay, bx, by) {
    if (bx > ax) return 'r';
    if (bx < ax) return 'l';
    if (by > ay) return 'd';
    return 'u';
  }

  // walk to an object (or a floor tile) picked with the mouse or a tap; pick overrides the tile's object
  rmGoTo(tx, ty, pick) {
    const G = this.rmGrid();
    const rm = this.rmInit();
    if (tx < 0 || ty < 0 || tx >= G.W || ty >= G.H) return;
    const oi = typeof pick === 'number' && pick >= 0 ? pick : G.obj[ty * G.W + tx];
    rm.held = [];
    if (oi >= 0 && !this.data().room[oi].walk) {
      const o = this.data().room[oi];
      const goals = [];
      const faces = {};
      for (let y = o.t[1]; y < o.t[1] + o.t[3]; y++) {
        for (let x = o.t[0]; x < o.t[0] + o.t[2]; x++) {
          [[x, y + 1, 'u'], [x - 1, y, 'r'], [x + 1, y, 'l'], [x, y - 1, 'd']].forEach((n) => {
            if (this.rmFree(n[0], n[1]) && (!o.face || o.face === n[2])) {
              goals.push([n[0], n[1]]);
              faces[n[1] * G.W + n[0]] = n[2];
            }
          });
        }
      }
      const px = rm.moving ? rm.to[0] : rm.x;
      const py = rm.moving ? rm.to[1] : rm.y;
      const r = this.rmPath(px, py, goals);
      if (!r) {
        this.sfx('error');
        return;
      }
      rm.path = r.path;
      rm.goal = oi;
      rm.goalDir = faces[r.end[1] * G.W + r.end[0]] || rm.dir;
      if (!rm.moving && !r.path.length) this.rmReach(rm);
      return;
    }
    if (!this.rmFree(tx, ty)) return;
    const px = rm.moving ? rm.to[0] : rm.x;
    const py = rm.moving ? rm.to[1] : rm.y;
    const r = this.rmPath(px, py, [[tx, ty]]);
    if (!r) return;
    rm.path = r.path;
    rm.goal = G.obj[ty * G.W + tx] >= 0 ? G.obj[ty * G.W + tx] : -1;
    rm.goalDir = rm.goal >= 0 ? 'd' : '';
    if (!rm.moving && !r.path.length && rm.goal >= 0) this.rmReach(rm);
  }

  // arrived next to the object picked with the pointer: face it and interact
  rmReach(rm) {
    const oi = rm.goal;
    rm.goal = -1;
    if (oi < 0) return;
    if (rm.goalDir) rm.dir = rm.goalDir;
    if (this.data().room[oi].door) this.rmOpen(oi);
    else this.rmInteract();
  }

  rmTryStep(rm, dir, quiet) {
    const D = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[dir];
    const G = this.rmGrid();
    rm.dir = dir;
    const nx = rm.x + D[0];
    const ny = rm.y + D[1];
    // walking down off the door mat leaves the room
    if (dir === 'd' && ny >= G.H && G.obj[rm.y * G.W + rm.x] === G.door) {
      rm.held = [];
      rm.path = [];
      this.rmOpen(G.door);
      return false;
    }
    if (!this.rmFree(nx, ny)) {
      rm.path = [];
      const now = Date.now();
      if (!quiet && now - rm.bumpAt > 320) {
        rm.bumpAt = now;
        this.sfx('bump');
      }
      return false;
    }
    rm.moving = true;
    rm.t = 0;
    rm.from = [rm.x, rm.y];
    rm.to = [nx, ny];
    return true;
  }

  rmUpdate(rm, dt, busy) {
    const G = this.rmGrid();
    const atDoor = (x, y) => y >= G.H || (y >= 0 && G.obj[y * G.W + x] === G.door);
    const dOpen = rm.enter || (rm.exit && (atDoor(rm.x, rm.y) || (rm.moving && atDoor(rm.to[0], rm.to[1]))));
    rm.doorT = Math.max(0, Math.min(1, (rm.doorT || 0) + (dOpen ? dt : -dt) / 220));
    // sitting at the PC: nothing moves; getting up is a little hop back
    if (rm.sit) {
      if (rm.sit.out && rm.clock - rm.sit.out >= 200) this.pcStand(true);
      return;
    }
    if (rm.moving) {
      const run = !!(this._rmOut && this._rmOut.run);
      rm.t += dt / (rm.exit ? (rm.to[1] >= 14 ? (run ? 120 : 200) : (run ? 80 : 150)) : rm.enter ? (rm.to[1] >= 14 ? 200 : 170) : 150);
      if (rm.t < 1) return;
      rm.moving = false;
      rm.t = 0;
      rm.x = rm.to[0];
      rm.y = rm.to[1];
      rm.step ^= 1;
      this.rmStepOn(rm);
      if (rm.exit && !rm.path.length) {
        this.rmExitDone();
        return;
      }
      if (rm.enter && !rm.path.length) {
        rm.enter = false;
        this.roomIntro();
        return;
      }
      if (!rm.path.length && rm.goal >= 0 && !busy) {
        this.rmReach(rm);
        return;
      }
    }
    if (busy) return;
    if (rm.exit) {
      const n = rm.path.shift();
      if (!n) {
        this.rmExitDone();
        return;
      }
      rm.dir = this.rmDirTo(rm.x, rm.y, n[0], n[1]);
      rm.moving = true;
      rm.t = 0;
      rm.from = [rm.x, rm.y];
      rm.to = [n[0], n[1]];
      if (n[1] === 14) this.sfx('door');
      return;
    }
    // walking in: the first steps are outside the picture, so they skip the floor check
    if (rm.enter) {
      const n = rm.path.shift();
      if (!n) {
        rm.enter = false;
        this.roomIntro();
        return;
      }
      rm.dir = 'u';
      rm.moving = true;
      rm.t = 0;
      rm.from = [rm.x, rm.y];
      rm.to = [n[0], n[1]];
      return;
    }
    if (rm.turn > 0) {
      rm.turn -= dt;
      return;
    }
    if (rm.path.length) {
      const n = rm.path.shift();
      if (!this.rmTryStep(rm, this.rmDirTo(rm.x, rm.y, n[0], n[1]))) rm.goal = -1;
      return;
    }
    // the newest held key leads; when that way is blocked he slides along in another held direction
    if (rm.held.length) {
      const lead = rm.held[rm.held.length - 1];
      if (!this.rmTryStep(rm, lead)) {
        for (let i = rm.held.length - 2; i >= 0; i--) {
          if (this.rmTryStep(rm, rm.held[i], true)) {
            rm.dir = lead;
            break;
          }
        }
      }
    }
  }

  // the tile in front of the player
  rmFront(rm) {
    const D = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[rm.dir];
    return [rm.x + D[0], rm.y + D[1]];
  }

  rmInteract() {
    const rm = this.rmInit();
    if (rm.moving) return;
    const G = this.rmGrid();
    const f = this.rmFront(rm);
    if (rm.dir === 'd' && f[1] >= G.H && G.obj[rm.y * G.W + rm.x] === G.door) {
      this.rmOpen(G.door);
      return;
    }
    if (f[0] < 0 || f[1] < 0 || f[0] >= G.W || f[1] >= G.H) return;
    const oi = G.obj[f[1] * G.W + f[0]];
    if (oi >= 0 && !this.data().room[oi].walk) this.rmOpen(oi);
  }

  rmOpen(i) {
    const rm = this.rmInit();
    const object = this.data().room[i];
    if (!object || (object.face && !this.roomFacing(object, rm))) return;
    rm.held = [];
    rm.path = [];
    this.look(i);
    this.setState({ rmDlg: true, rmSel: 0 });
  }

  rmClose() {
    if (!this.st().rmDlg) return;
    this.setState({ rmDlg: false, rmSel: 0, rmIntro: false });
    this.focusRoot();
  }

  rmActs() {
    const s = this.st();
    if (s.rmIntro) {
      if ((s.rmStep || 0) < this.rmIntroLines().length - 1) return [['Próxima', 'next'], ['Pular', 'close']];
      return [['Explorar o quarto', 'close'], ['Ir pro site comum', 'site']];
    }
    const o = typeof s.roomObj === 'number' ? this.data().room[s.roomObj] : null;
    return (o && o.acts ? o.acts : []).concat([['Fechar', 'close']]);
  }

  // keyboard: arrows/WASD walk, E/space/enter interact; inside the dialog they pick and confirm
  rmKey(e) {
    const k = e.key || '';
    const s = this.st();
    if (this._rmOut) {
      if (e.target && e.target.closest && e.target.closest('.trip-b')) return true;
      if (e.preventDefault) e.preventDefault();
      if (!e.repeat) this.tripPush();
      return true;
    }
    if (this._rm && this._rm.sit && !s.rmDlg) {
      if (e.preventDefault) e.preventDefault();
      return true;
    }
    const dirs = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', w: 'u', W: 'u', s: 'd', S: 'd', a: 'l', A: 'l', d: 'r', D: 'r' };
    // Enter/space on a focused button or link belong to that element, not to the room
    const tg = e.target;
    const onCtl = !!(tg && tg.closest && tg !== this._rootEl && tg.closest('button, a'));
    const act = k === 'e' || k === 'E' || ((k === ' ' || k === 'Enter') && !onCtl) || k === 'z' || k === 'Z';
    if (s.rmDlg) {
      const acts = this.rmActs();
      if (k === 'Escape') {
        e.preventDefault();
        this.rmClose();
        return true;
      }
      if (dirs[k]) {
        e.preventDefault();
        const step = dirs[k] === 'u' || dirs[k] === 'l' ? -1 : 1;
        this.sfx('key');
        this.setState({ rmSel: ((s.rmSel || 0) + step + acts.length) % acts.length });
        return true;
      }
      if (act) {
        e.preventDefault();
        if (e.repeat) return true;
        if (this._dlg && !this._dlg.done) {
          this._dlg.done = true;
          return true;
        }
        const a = acts[Math.min(s.rmSel || 0, acts.length - 1)];
        this.rmRun(a[1], e);
        return true;
      }
      return false;
    }
    const rm = this.rmInit();
    if (rm.enter && (dirs[k] || act)) {
      e.preventDefault();
      return true;
    }
    if (dirs[k]) {
      e.preventDefault();
      const dir = dirs[k];
      rm.path = [];
      rm.goal = -1;
      if (rm.held.indexOf(dir) < 0) rm.held.push(dir);
      if (!rm.moving && rm.dir !== dir && !e.repeat) {
        rm.dir = dir;
        rm.turn = 90;
      }
      return true;
    }
    if (act) {
      e.preventDefault();
      if (!e.repeat) this.rmInteract();
      return true;
    }
    return false;
  }

  rmKeyUp(e) {
    if (!this._rm) return;
    const dirs = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', w: 'u', W: 'u', s: 'd', S: 'd', a: 'l', A: 'l', d: 'r', D: 'r' };
    const dir = dirs[e.key || ''];
    if (dir) this._rm.held = this._rm.held.filter((x) => x !== dir);
  }

  rmRun(code, e) {
    if (code === 'close') {
      this.rmClose();
      return;
    }
    if (code === 'next') {
      this.sfx('key');
      this.rmIntroStep((this.st().rmStep || 0) + 1);
      return;
    }
    this.setState({ rmDlg: false, rmSel: 0, rmIntro: false });
    this.roomAct(code, e);
    this.focusRoot();
  }

  // pointer -> room pixel / tile, through the camera and the CSS scaling
  rmPxAt(e) {
    const cv = this._rmCv;
    const rm = this.rmInit();
    if (!cv || !cv.getBoundingClientRect) return null;
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return [(e.clientX - r.left) * (cv.width / r.width) + rm.camX, (e.clientY - r.top) * (cv.height / r.height) + rm.camY];
  }

  rmTileAt(e) {
    const p = this.rmPxAt(e);
    return p ? [Math.floor(p[0] / 16), Math.floor(p[1] / 16)] : null;
  }

  // the box an object is drawn in: its tiles, or its own art box (v, room px) when the art is wider
  // than its tiles, like the arcade cabinets
  rmObjRect(o) {
    return o.v ? o.v : [o.t[0] * 16, o.t[1] * 16, o.t[2] * 16, o.t[3] * 16];
  }

  // the object under a room pixel: art boxes first, then the tile map
  rmObjAt(px, py) {
    const d = this.data();
    for (let i = 0; i < d.room.length; i++) {
      const v = d.room[i].v;
      if (v && px >= v[0] && px < v[0] + v[2] && py >= v[1] && py < v[1] + v[3]) return i;
    }
    const G = this.rmGrid();
    const tx = Math.floor(px / 16);
    const ty = Math.floor(py / 16);
    if (tx < 0 || ty < 0 || tx >= G.W || ty >= G.H) return -1;
    return G.obj[ty * G.W + tx];
  }

  rmPointer(e) {
    const s = this.st();
    if (s.transitioning) return;
    if (this._rmOut) {
      if (e.preventDefault) e.preventDefault();
      this.tripPush();
      return;
    }
    if (s.rmDlg) {
      if (this._dlg && !this._dlg.done) this._dlg.done = true;
      else this.rmClose();
      return;
    }
    const p = this.rmPxAt(e);
    if (!p || (this._rm && (this._rm.enter || this._rm.sit))) return;
    if (e.preventDefault) e.preventDefault();
    this.focusRoot();
    this.rmGoTo(Math.floor(p[0] / 16), Math.floor(p[1] / 16), this.rmObjAt(p[0], p[1]));
  }

  rmHover(e) {
    const p = this.rmPxAt(e);
    const oi = p ? this.rmObjAt(p[0], p[1]) : -1;
    if (oi !== (this.st().rmHov === undefined ? -1 : this.st().rmHov)) this.setState({ rmHov: oi });
  }

  // fit the canvas into the stage: whole room when it fits at >= 1.9x, otherwise a camera window
  rmFit() {
    const box = this._rmBox;
    const cv = this._rmCv;
    const wrap = this._rmWrap;
    if (!box || !cv || !wrap) return;
    const aw = box.clientWidth;
    const ah = box.clientHeight;
    if (!aw || !ah) return;
    if (this._rmFitK === aw + 'x' + ah && cv.width) return;
    this._rmFitK = aw + 'x' + ah;
    const RW = 384;
    const RH = 224;
    let sc = Math.min(aw / RW, ah / RH);
    let vw = RW;
    let vh = RH;
    if (sc < 1.9) {
      sc = Math.max(1.9, Math.min(2.6, ah / RH, aw / 150));
      vw = Math.min(RW, Math.floor(aw / sc));
      vh = Math.min(RH, Math.floor(ah / sc));
    }
    if (cv.width !== vw) cv.width = vw;
    if (cv.height !== vh) cv.height = vh;
    wrap.style.width = Math.floor(vw * sc) + 'px';
    wrap.style.height = Math.floor(vh * sc) + 'px';
  }

  // Preloaded at mount; a failed request is retried instead of leaving the room without its atlas.
  rmImg() {
    if (this._rmAtlas) return this._rmAtlas;
    if (this._rmAtlasReq || typeof Image === 'undefined' || Date.now() < (this._rmAtlasRetry || 0)) return null;
    try {
      const img = new Image();
      this._rmAtlasReq = img;
      img.onload = () => { this._rmAtlas = img; this._rmAtlasReq = null; };
      img.onerror = () => { this._rmAtlasReq = null; this._rmAtlasRetry = Date.now() + 1500; };
      img.src = this.blob(this.data().roomAtlas);
    } catch (err) {
      this._rmAtlasReq = null;
    }
    return null;
  }

  loopRoom(dt) {
    const cv = this._rmCv;
    if (!cv || this.curPage() !== 'quarto') return;
    this.rmFit();
    const rm = this.rmInit();
    const s = this.state || {};
    rm.clock += dt;
    const busy = !!(s.paused || s.palOpen || s.achOpen || s.recOpen || s.arcOpen || s.pcOpen || s.deOpen || s.tvGameOpen || s.dOpen || s.skOpen || s.credOpen || s.sleeping || s.rmDlg || s.transitioning || s.powering || s.shooterOpen || s.languageOpen || this._deckGrab);
    this.rmUpdate(rm, dt, busy);
    this.rmDraw(cv, rm);
  }

  rmDraw(cv, rm) {
    const ctx = cv.getContext ? cv.getContext('2d') : null;
    if (!ctx) return;
    const ael = this._rmAtlasEl;
    const img = ael && ael.complete && ael.naturalWidth ? ael : (this._rmAtlas || this.rmImg());
    const vw = cv.width;
    const vh = cv.height;
    let fx = rm.moving ? rm.from[0] + (rm.to[0] - rm.from[0]) * rm.t : rm.x;
    let fy = rm.moving ? rm.from[1] + (rm.to[1] - rm.from[1]) * rm.t : rm.y;
    // sitting at the PC: a little hop onto the chair (and back off it when he gets up)
    let sitK = 0;
    let hop = 0;
    if (rm.sit) {
      const e = rm.sit.out ? 200 - (rm.clock - rm.sit.out) : rm.clock - rm.sit.t0;
      sitK = Math.max(0, Math.min(1, e / 200));
      hop = Math.round(Math.sin(sitK * Math.PI) * 4);
      fx = rm.sit.back[0] + (rm.sit.at[0] - rm.sit.back[0]) * sitK;
      fy = rm.sit.back[1] + (rm.sit.at[1] - rm.sit.back[1]) * sitK;
    }
    const focusI = this.rmIntroTarget();
    const focusO = focusI >= 0 ? this.data().room[focusI] : null;
    const cxw = focusO ? (focusO.t[0] + focusO.t[2] / 2) * 16 : fx * 16 + 8;
    const cyw = focusO ? (focusO.t[1] + focusO.t[3] / 2) * 16 : fy * 16 + 8;
    rm.camX = Math.round(Math.max(0, Math.min(384 - vw, cxw - vw / 2)));
    rm.camY = Math.round(Math.max(0, Math.min(224 - vh, cyw - vh / 2)));
    // Without the atlas there is nothing to paint; keep the previous frame until the retry lands.
    if (!img) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#050706';
    ctx.fillRect(0, 0, vw, vh);
    ctx.drawImage(img, rm.camX, rm.camY, vw, vh, 0, 0, vw, vh);
    const X = (x) => x - rm.camX;
    const Y = (y) => y - rm.camY;
    const s = this.state || {};
    const tt = rm.clock;
    const now = Date.now();
    if (!this._nightAt || now - this._nightAt > 5000) {
      this._nightAt = now;
      this._night = this.isNight();
    }
    if (!this._night) ctx.drawImage(img, 0, 224, 48, 26, X(16), Y(3), 48, 26);
    // little lights: rack LEDs, monitor cursor, arcade attract mode, TV game, soldering tip, ESP32 LED
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = Math.floor(tt / (260 + i * 90)) % 3 !== 0 ? '#8FD3A6' : '#1B3326';
      ctx.fillRect(X(371), Y(14 + i * 8), 1, 1);
    }
    ctx.fillStyle = '#F0CE6A';
    if (Math.floor(tt / 530) % 2) ctx.fillRect(X(335), Y(24), 3, 1);
    if (rm.sit && rm.sit.kind !== 'puff' && !this._desktopSession) {
      // Standalone runner fallback; the desktop session paints its live DOM on this glass.
      ctx.fillStyle = '#0E2A1C';
      ctx.fillRect(X(327), Y(14), 22, 14);
      ctx.fillStyle = '#D8B24A';
      ctx.fillRect(X(327), Y(25), 22, 1);
      const ox = 348 - Math.floor(((tt % 1400) / 1400) * 23);
      ctx.fillStyle = '#9EC0F0';
      ctx.fillRect(X(ox), Y(23), 1, 2);
      const jp = ox >= 329 && ox <= 334 ? 3 : 0;
      ctx.fillStyle = '#C8CED2';
      ctx.fillRect(X(331), Y(22 - jp), 2, 3);
      ctx.fillStyle = Math.floor(tt / 300) % 2 ? '#E04A3A' : '#F0CE6A';
      ctx.fillRect(X(331), Y(21 - jp), 1, 1);
    }
    // things you just examined get a moment in the spotlight (ms since, or -1)
    const fxs = this._rmFx || {};
    const hot = (id, dur) => {
      const t0 = fxs[id];
      if (typeof t0 !== 'number') return -1;
      const e = tt - t0;
      return e >= 0 && e < (dur || 2600) ? e : -1;
    };
    const px = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(X(x), Y(y), w, h);
    };
    // confetti: n bits thrown up from (x, y), e ms ago (no state: every bit's path comes from its index)
    const CONF = ['#FFE08A', '#FFFFFF', '#F0CE6A', '#8FD3A6', '#E04A3A', '#7FB2DA'];
    const burst = (x, y, e, n) => {
      const k = e / 1000;
      if (k > 0.9) return;
      ctx.globalAlpha = Math.max(0, 1 - k / 0.9);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * (2.2 / n);
        const v = 38 + ((i * 37) % 23);
        px(Math.round(x + Math.cos(a) * v * k), Math.round(y + Math.sin(a) * v * k + 70 * k * k), 1, 1, CONF[i % CONF.length]);
      }
      ctx.globalAlpha = 1;
    };
    // a cabinet you just looked at: confetti, a glow on the floor, the marquee blinks and sparks float up
    const cabHot = (id, x0, y0) => {
      const e = hot(id);
      if (e < 0) return false;
      const gl = 0.22 * (1 - e / 2600) * (0.7 + 0.3 * Math.sin(e / 90));
      ctx.fillStyle = 'rgba(240,206,106,' + gl.toFixed(3) + ')';
      ctx.fillRect(X(x0 - 3), Y(y0 + 44), 26, 4);
      ctx.fillRect(X(x0 - 1), Y(y0 + 48), 22, 2);
      burst(x0 + 10, y0 + 2, e, 12);
      if (Math.floor(e / 110) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,240,0.45)';
        ctx.fillRect(X(x0 + 1), Y(y0 + 1), 18, 5);
      }
      if (e < 180) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - e / 180)).toFixed(2) + ')';
        ctx.fillRect(X(x0 + 3), Y(y0 + 9), 14, 10);
      }
      for (let i = 0; i < 3; i++) {
        const k = ((e / 900) + i / 3) % 1;
        px(x0 + 4 + i * 6 + Math.round(Math.sin(e / 160 + i) * 1.5), y0 - 2 - Math.round(k * 10), 1, 1, k < 0.5 ? '#FFE08A' : '#F0CE6A');
      }
      return true;
    };
    // ---- row 1 ----
    // Packet Invaders: the attract mode (invaders sway, the ship waits)
    const inv = Math.floor((hot('fliperama') >= 0 ? tt * 2.5 : tt) / 400) % 4;
    px(147, 73, 14, 10, '#10261A');
    ctx.fillStyle = '#8FD3A6';
    [[148, 75], [152, 75], [156, 75], [152, 78]].forEach((p) => ctx.fillRect(X(p[0] + (inv < 2 ? inv : 4 - inv) - 1), Y(p[1]), 3, 2));
    px(153, 81, 2, 1, '#F0CE6A');
    cabHot('fliperama', 144, 64);
    // the fighting cabinet: two fighters trade blows under their life bars
    const fsp = hot('fliperama-luta') >= 0 ? 90 : 220;
    const ft = Math.floor(tt / fsp) % 8;
    const hitL = ft === 2 || ft === 3;
    const hitR = ft === 6 || ft === 7;
    px(167, 73, 14, 10, '#140E24');
    px(168, 74, 5 - (Math.floor(tt / 1760) % 5), 1, '#F0CE6A');
    const lifeR = 5 - (Math.floor(tt / 2640) % 5);
    px(180 - lifeR, 74, lifeR, 1, '#8FD3A6');
    px(167, 82, 14, 1, '#2A2440');
    [[170, '#D8B24A', hitL, 1], [176, '#62B37F', hitR, -1]].forEach((f) => {
      ctx.fillStyle = '#E8BE98';
      ctx.fillRect(X(f[0]), Y(77), 2, 1);
      if (f[2]) ctx.fillRect(X(f[3] > 0 ? f[0] + 2 : f[0] - 2), Y(78), 2, 1);
      px(f[0], 78, 2, 2, f[1]);
      px(f[0], 80, 1, 2, '#26282A');
      px(f[0] + 1, 80, 1, 2, '#26282A');
    });
    cabHot('fliperama-luta', 164, 64);
    // the shooter: stars scroll down, the ship sways and fires
    const ssp = hot('fliperama-nave') >= 0 ? 3 : 1;
    px(187, 73, 14, 10, '#06081A');
    ctx.fillStyle = '#C8D2E6';
    for (let i = 0; i < 7; i++) ctx.fillRect(X(187 + ((i * 5 + 2) % 14)), Y(73 + ((Math.floor(tt * ssp / 90) + i * 7) % 10)), 1, 1);
    px(187 + (Math.floor(tt / 300) % 13), 74, 2, 1, '#E04A3A');
    const shx = 192 + Math.round(3 * Math.sin(tt / 600));
    px(shx, 81, 3, 1, '#8FD3A6');
    px(shx + 1, 80, 1, 1, '#8FD3A6');
    if (Math.floor(tt * ssp / 250) % 2) px(shx + 1, 77 + (Math.floor(tt / 60) % 3), 1, 1, '#F0CE6A');
    cabHot('fliperama-nave', 184, 64);
    // the pinball: bumpers flash in turn, the score ticks, the ball runs around the top; examined, it goes wild
    const pbe = hot('pinball');
    const pb = Math.floor(tt / (pbe >= 0 ? 90 : 260)) % 3;
    [[209, 85], [215, 85], [212, 89]].forEach((b, i) => {
      if (i !== pb && !(pbe >= 0 && Math.floor(tt / 120) % 2)) return;
      px(b[0] - 1, b[1] - 1, 3, 3, '#FFE08A');
      px(b[0], b[1], 1, 1, '#E8E4D4');
    });
    px(207, 66, 12, 6, '#0A0812');
    ctx.fillStyle = '#F0CE6A';
    const sd = Math.floor(tt / (pbe >= 0 ? 60 : 200));
    for (let i = 0; i < 5; i++) {
      const v = (sd * (i + 3) + i * 5) % 7;
      ctx.fillRect(X(208 + i * 2), Y(67), 1, 1);
      if (v > 1) ctx.fillRect(X(208 + i * 2), Y(68), 1, 1);
      if (v > 3) ctx.fillRect(X(208 + i * 2), Y(69), 1, 1);
      if (v !== 2) ctx.fillRect(X(208 + i * 2), Y(70), 1, 1);
    }
    const bsp = pbe >= 0 ? 3 : 1;
    px(Math.round(212 + 4.2 * Math.cos(tt * bsp / 480)), Math.round(86.5 + 2.6 * Math.sin(tt * bsp / 370)), 1, 1, '#E8E4D4');
    if (pbe >= 0 && Math.floor(tt / 150) % 2) {
      px(208, 99, 3, 1, '#F0CE6A');
      px(214, 99, 3, 1, '#F0CE6A');
    }
    if (pbe >= 0) {
      burst(212, 66, pbe, 12);
      ctx.fillStyle = 'rgba(240,206,106,' + (0.22 * (1 - pbe / 2600)).toFixed(3) + ')';
      ctx.fillRect(X(202), Y(108), 22, 4);
    }
    // ---- row 2 ----
    // run and gun: the soldier fires, the ground scrolls, something blows up
    const rge = hot('fliperama-slug');
    px(147, 137, 14, 10, '#2A3320');
    px(147, 144, 14, 3, '#5A4A2E');
    for (let i = 0; i < 4; i++) px(147 + ((i * 4 + 40 - (Math.floor(tt / 120) % 14)) % 14), 145, 1, 1, '#7A6440');
    px(149, 140, 1, 1, '#E8BE98');
    px(149, 141, 1, 2, '#3A6ACB');
    px(149, 143, 1, 1, '#26282A');
    px(150 + (Math.floor(tt / (rge >= 0 ? 30 : 60)) % 9), 141, 1, 1, '#F0CE6A');
    const boom = (tt % (rge >= 0 ? 500 : 1200)) / (rge >= 0 ? 500 : 1200);
    if (boom < 0.35) {
      const r = Math.round(boom * 8);
      ctx.fillStyle = boom < 0.15 ? '#FFF1B0' : '#F08A3C';
      ctx.fillRect(X(157 - r), Y(141 - r / 2), 1 + r, 1 + r);
    }
    cabHot('fliperama-slug', 144, 128);
    // falling blocks: a piece drops onto the stack, a full line flashes
    const fbe = hot('fliperama-blocos');
    px(167, 137, 14, 10, '#080A18');
    const BC = ['#DC463C', '#F0BE3C', '#50BE6E', '#3C96DC', '#AA5AC8'];
    const cyc = Math.floor(tt / (fbe >= 0 ? 400 : 1200));
    for (let c = 0; c < 6; c++) {
      const hgt = 1 + ((c * 7 + cyc) % 3);
      for (let r = 0; r < hgt; r++) px(168 + c * 2, 146 - r, 2, 1, BC[(c + r + cyc) % 5]);
    }
    const fp = (tt % (fbe >= 0 ? 400 : 1200)) / (fbe >= 0 ? 400 : 1200);
    px(170 + (cyc % 4) * 2, 137 + Math.floor(fp * 5), 4, 2, BC[cyc % 5]);
    if (fp > 0.85) px(167, 146, 14, 1, '#FFFFFF');
    cabHot('fliperama-blocos', 164, 128);
    // racing: the road rushes by, the car sways
    const rce = hot('fliperama-corrida');
    px(187, 137, 14, 3, '#3C78BE');
    px(187, 140, 14, 7, '#2E4A2A');
    const rsp = rce >= 0 ? 40 : 110;
    for (let y = 140; y <= 146; y++) {
      const w = 2 + (y - 140) * 2;
      const x0 = 194 - Math.floor(w / 2);
      px(x0, y, w, 1, '#50545A');
      const stripe = (y + Math.floor(tt / rsp)) % 2 ? '#E04A3A' : '#E8E4D4';
      px(x0 - 1, y, 1, 1, stripe);
      px(x0 + w, y, 1, 1, stripe);
      if ((y + Math.floor(tt / rsp)) % 3 === 0) px(193, y, 1, 1, '#E8E4D4');
    }
    px(192 + Math.round(1.5 * Math.sin(tt / 400)), 145, 3, 2, '#C83C32');
    cabHot('fliperama-corrida', 184, 128);
    // pachinko: the header lights chase, steel balls rattle down through the pins, the reels spin
    const pke = hot('pachinko', 3200);
    const lit = Math.floor(tt / (pke >= 0 ? 60 : 140)) % 6;
    for (let i = 0; i < 6; i++) px(207 + i * 2, 131, 1, 1, i === lit || (pke >= 0 && Math.floor(tt / 100) % 2) ? '#FFFFFF' : '#F0CE6A');
    const nb = pke >= 0 ? 10 : 4;
    for (let i = 0; i < nb; i++) {
      const ph = ((tt * (pke >= 0 ? 1.8 : 1)) + i * 457) % 1800 / 1800;
      const bx = 208 + ((i * 3 + Math.floor(ph * 12)) % 10);
      px(bx, 136 + Math.floor(ph * 21), 1, 1, '#F4F6FA');
    }
    const REEL = ['#DC463C', '#F0BE3C', '#50BE6E', '#3C96DC', '#FFFFFF'];
    for (let i = 0; i < 3; i++) {
      const c = pke >= 0 && pke > 1400 ? '#F0CE6A' : REEL[(Math.floor(tt / (80 + i * 30)) + i) % 5];
      px(210 + i * 2, 142, 2, 2, c);
    }
    if (pke >= 0) {
      burst(213, 130, pke, 14);
      ctx.fillStyle = 'rgba(240,206,106,' + (0.22 * (1 - pke / 3200)).toFixed(3) + ')';
      ctx.fillRect(X(202), Y(172), 22, 4);
      for (let i = 0; i < 4; i++) {
        const k = ((pke / 700) + i / 4) % 1;
        px(207 + i * 4, 128 - Math.round(k * 8), 1, 1, '#FFE08A');
      }
    }
    // the TV: a little platformer, or whichever console you just switched on
    const tvY = 117;
    const cons = ['jogos-snes', 'snes', 'wii', 'xboxone'];
    let on = '';
    let onE = -1;
    cons.forEach((id) => {
      const e = hot(id, 3200);
      if (e >= 0 && (onE < 0 || e < onE)) {
        on = id;
        onE = e;
      }
    });
    const tve = hot('tv', 1100);
    if (!on && tve >= 0) {
      // the TV itself: the picture opens from a bright line, then a moment of snow
      px(79, tvY, 20, 13, '#050505');
      const hh = Math.max(1, Math.min(13, Math.round((tve / 320) * 13)));
      px(79, tvY + Math.round((13 - hh) / 2), 20, hh, tve < 320 ? '#E8F0F4' : '#1A1E22');
      if (tve >= 320) {
        for (let i = 0; i < 30; i++) px(79 + Math.floor(Math.random() * 20), tvY + Math.floor(Math.random() * 13), 1, 1, Math.random() < 0.5 ? '#C8D0D4' : '#5A6268');
      }
    } else if (!on) {
      const hx = 80 + Math.floor(((tt % 5200) / 5200) * 18);
      const hy = hx === 84 ? 2 : (hx === 83 || hx === 85 ? 1 : 0);
      if (hx < 84) px(84, tvY + 3, 1, 2, Math.floor(tt / 300) % 2 ? '#F0CE6A' : '#D8B24A');
      px(hx, tvY + 6 - hy, 2, 1, '#E8BE98');
      px(hx, tvY + 7 - hy, 2, 1, '#62B37F');
      px(hx + (Math.floor(tt / 150) % 2), tvY + 8 - hy, 1, 1, '#26282A');
    } else {
      const e = onE;
      const cx = 88;
      const cy = tvY + 6;
      if (on === 'snes' || on === 'jogos-snes') {
        const band = ['#DC463C', '#F08A3C', '#F0BE3C', '#50BE6E', '#3C96DC', '#6A5ACD', '#AA5AC8'];
        const sh = Math.floor(e / (on === 'snes' ? 90 : 45));
        for (let y = 0; y < 13; y++) px(79, tvY + y, 20, 1, band[(Math.floor(y / 2) + sh) % 7]);
        if (on === 'snes' && e > 1200) {
          px(cx - 3, cy, 7, 1, '#FFFFFF');
          px(cx, cy - 3, 1, 7, '#FFFFFF');
          px(cx - 1, cy - 1, 3, 3, '#FFFFFF');
        }
      } else if (on === 'wii') {
        px(79, tvY, 20, 13, '#F4F6F8');
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const lead = (Math.floor(e / 110) % 8) === i;
          px(Math.round(cx + Math.cos(a) * 4), Math.round(cy + Math.sin(a) * 4), 1, 1, lead ? '#3CA0E6' : '#A8D4F0');
        }
      } else {
        px(79, tvY, 20, 13, '#050505');
        const r = Math.min(5, e / 200);
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8), 1, 1, e > 1400 ? '#7CDC5A' : '#FFFFFF');
        }
      }
      // confetti over the console that was switched on, and a spark that keeps floating up
      const where = { 'jogos-snes': [72, 146], snes: [88, 146], wii: [70, 128], xboxone: [104, 128] }[on];
      burst(where[0], where[1], e, 10);
      const k = (e % 600) / 600;
      px(where[0], where[1] - 4 - Math.round(k * 8), 1, 1, '#FFE08A');
    }
    // the robot from the blueprint, fresh off the workbench: rolls back and forth, blinks, waves;
    // switched on, it hops, throws its arms up and flashes
    {
      const re = hot('robo', 2400);
      const rx = 309 + Math.round(2 * Math.sin(tt / 900)) + (re >= 0 ? Math.round(Math.sin(re / 70)) : 0);
      const by = 81 - (re >= 0 ? Math.round(Math.abs(Math.sin(re / 120)) * 3) : 0);
      const up = re >= 0 ? Math.floor(re / 150) % 2 === 0 : (Math.floor(tt / 1600) % 3 === 0 && Math.floor(tt / 200) % 2 === 0);
      ctx.fillStyle = '#101214';
      ctx.fillRect(X(rx - 1), Y(by - 2), 11, 3);
      ctx.fillRect(X(rx), Y(by - 7), 9, 6);
      ctx.fillRect(X(rx + 1), Y(by - 12), 7, 6);
      px(rx, by - 1, 9, 1, '#2A2C30');
      ctx.fillStyle = '#6A6E72';
      for (let i = 0; i < 4; i++) ctx.fillRect(X(rx + 1 + i * 2 + (Math.floor(tt / 150) % 2)), Y(by - 1), 1, 1);
      px(rx + 1, by - 6, 7, 4, '#C8CED2');
      px(rx + 1, by - 2, 7, 1, '#8E969C');
      px(rx + 2, by - 5, 1, 1, '#F0CE6A');
      px(rx + 4, by - 4, 3, 1, re >= 0 && Math.floor(re / 100) % 2 ? '#F0CE6A' : '#62B37F');
      const ay = up ? by - 9 : by - 6;
      px(rx - 1, ay, 1, 3, '#8E969C');
      px(rx + 9, ay, 1, 3, '#8E969C');
      px(rx + 4, by - 7, 1, 1, '#8E969C');
      px(rx + 2, by - 11, 5, 4, '#C8CED2');
      const eye = re >= 0 ? (Math.floor(re / 90) % 2 ? '#F0CE6A' : '#8FD3A6') : (tt % 2300 < 140 ? '#C8CED2' : '#8FD3A6');
      px(rx + 3, by - 10, 1, 1, eye);
      px(rx + 5, by - 10, 1, 1, eye);
      px(rx + 4, by - 13, 1, 2, '#8E969C');
      px(rx + 4, by - 14, 1, 1, Math.floor(tt / (re >= 0 ? 80 : 400)) % 2 ? '#E04A3A' : '#F0CE6A');
      if (re >= 0) {
        for (let i = 0; i < 3; i++) {
          const k = ((re / 700) + i / 3) % 1;
          px(rx + 10 + i * 2, by - 10 - Math.round(k * 8), 1, 2, '#8FD3A6');
          px(rx + 11 + i * 2, by - 11 - Math.round(k * 8), 1, 1, '#8FD3A6');
        }
      } else if (Math.floor(tt / 700) % 3 === 0) {
        px(rx + 10, by - 13, 1, 3, '#FFF4C8');
        px(rx + 9, by - 12, 3, 1, '#FFF4C8');
      }
    }
    // soldering desk: a wisp of flux smoke drifts into the fume extractor, whose fan spins
    {
      const ph = (tt % 1800) / 1800;
      ctx.fillStyle = 'rgba(220,226,230,' + (0.6 * (1 - ph)).toFixed(2) + ')';
      const wx = 328 + Math.round(ph * 6);
      const wy = 151 - Math.round(ph * 3);
      ctx.fillRect(X(wx), Y(wy), 1, 1);
      ctx.fillRect(X(wx + (Math.floor(tt / 220) % 2)), Y(wy - 1), 1, 1);
      const fb = Math.floor(tt / 90) % 4;
      ctx.fillStyle = '#9AA0A4';
      ctx.fillRect(X([338, 339, 341, 339][fb]), Y([153, 152, 154, 156][fb]), 1, 1);
      ctx.fillRect(X([341, 340, 338, 340][fb]), Y([155, 156, 154, 152][fb]), 1, 1);
    }
    ctx.fillStyle = Math.floor(tt / 180) % 2 ? '#FF7828' : '#FFAA3C';
    ctx.fillRect(X(362), Y(104), 2, 1);
    ctx.fillStyle = Math.floor(tt / 700) % 2 ? '#78FF96' : '#1E3A28';
    ctx.fillRect(X(349), Y(105), 1, 1);
    // the save star by the bed: it turns and twinkles (and bursts when you save)
    {
      const se = hot('estrela', 1600);
      const scx = 40;
      const scy = 88;
      const tw = Math.floor(tt / 220) % 4;
      const col = tw === 0 ? '#FFF4C8' : '#F0CE6A';
      const r = tw === 1 ? 3 : 2;
      px(scx - r, scy, r * 2 + 1, 1, col);
      px(scx, scy - r, 1, r * 2 + 1, col);
      px(scx - 1, scy - 1, 3, 3, '#FFE08A');
      px(scx, scy, 1, 1, '#FFFFFF');
      if (se >= 0) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const d = 2 + (se / 1600) * 12;
          px(Math.round(scx + Math.cos(a) * d), Math.round(scy + Math.sin(a) * d * 0.7), 1, 1, i % 2 ? '#FFFFFF' : '#F0CE6A');
        }
      }
    }
    // the giant teddy (tile 5,3) is a sprite drawn in depth order: over the player when he walks behind it
    this.drawRoomProps(ctx, rm);
    const teddy = () => this.drawLargePlush(ctx, X(75), Y(34));
    const behind = fy < 3;
    if (!behind) teddy();
    // hover / debug outlines
    const G = this.rmGrid();
    const d = this.data();
    const hov = typeof s.rmHov === 'number' ? s.rmHov : -1;
    if (focusO) {
      const t = focusO.t;
      const pulseA = 0.55 + 0.45 * Math.abs(Math.sin(tt / 260));
      ctx.strokeStyle = 'rgba(240,206,106,' + pulseA.toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.strokeRect(X(t[0] * 16) - 1, Y(t[1] * 16) - 1, t[2] * 16 + 2, t[3] * 16 + 2);
      ctx.lineWidth = 1;
    }
    if (hov >= 0 && !s.rmDlg && d.room[hov]) {
      const r = this.rmObjRect(d.room[hov]);
      ctx.strokeStyle = 'rgba(240,206,106,0.9)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(X(r[0]) + 0.5, Y(r[1]) + 0.5, r[2] - 1, r[3] - 1);
      ctx.setLineDash([]);
    }
    if (s.debug) {
      for (let y = 0; y < G.H; y++) {
        for (let x = 0; x < G.W; x++) {
          const i = y * G.W + x;
          if (G.solid[i]) {
            ctx.fillStyle = G.obj[i] >= 0 ? 'rgba(143,211,166,0.28)' : 'rgba(224,74,58,0.22)';
            ctx.fillRect(X(x * 16), Y(y * 16), 16, 16);
          }
          ctx.strokeStyle = 'rgba(143,211,166,0.18)';
          ctx.strokeRect(X(x * 16) + 0.5, Y(y * 16) + 0.5, 15, 15);
        }
      }
      rm.path.forEach((p) => {
        ctx.fillStyle = 'rgba(240,206,106,0.6)';
        ctx.fillRect(X(p[0] * 16 + 6), Y(p[1] * 16 + 6), 4, 4);
      });
    }
    // the bedroom door (bottom edge): hallway light spills in while it is open
    if (rm.doorT > 0) {
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = 'rgba(240,206,106,' + (0.3 * rm.doorT * (1 - i / 14)).toFixed(3) + ')';
        ctx.fillRect(X(177 - i), Y(223 - i), 30 + 2 * i, 1);
      }
      ctx.fillStyle = 'rgba(5,7,6,' + (0.9 * rm.doorT).toFixed(2) + ')';
      ctx.fillRect(X(179), Y(222), 26, 2);
    }
    // the player: 16x24 frame, feet on the tile
    const order = { d: 0, u: 3, l: 6, r: 9 };
    const mid = rm.moving && rm.t > 0.12 && rm.t < 0.88;
    const fr = rm.sit ? order.u : order[rm.dir] + (mid ? (rm.step ? 2 : 1) : 0);
    const sx = Math.round(fx * 16 + (rm.alignX || 0));
    const sy = Math.round(fy * 16) - 8 - hop - Math.round(sitK * 3);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    if (!rm.sit) ctx.fillRect(X(sx + 3), Y(sy + 22), 10, 2);
    this.drawRoomObstacle(ctx, rm);
    this.drawRoomPlayer(ctx, img, fr, X(sx), Y(sy), rm);
    // seated, the back of the chair covers him up to the shoulders
    if (rm.sit && rm.sit.kind !== 'puff' && sitK > 0.5) ctx.drawImage(img, 268, 224, 16, 17, X(rm.sit.at[0] * 16), Y(46), 16, 17);
    if (behind) teddy();
    // "!" above the head when something interesting is right in front
    const over = !!(s.paused || s.palOpen || s.achOpen || s.recOpen || s.arcOpen || s.pcOpen || s.deOpen || s.tvGameOpen || s.dOpen || s.skOpen || s.credOpen);
    if (!rm.moving && !rm.sit && !rm.portalTravel && !s.rmDlg && !over) {
      const f = this.rmFront(rm);
      const onDoor = rm.dir === 'd' && f[1] >= G.H && G.obj[rm.y * G.W + rm.x] === G.door;
      const oi = f[0] >= 0 && f[1] >= 0 && f[0] < G.W && f[1] < G.H ? G.obj[f[1] * G.W + f[0]] : -1;
      if (onDoor || (oi >= 0 && !d.room[oi].walk && (!d.room[oi].face || this.roomFacing(d.room[oi],rm)))) {
        const bob = Math.floor(tt / 300) % 2;
        ctx.fillStyle = '#050706';
        ctx.fillRect(X(sx + 5), Y(sy - 9 - bob), 7, 8);
        ctx.fillStyle = '#F0CE6A';
        ctx.fillRect(X(sx + 6), Y(sy - 8 - bob), 5, 6);
        ctx.fillStyle = '#050706';
        ctx.fillRect(X(sx + 8), Y(sy - 7 - bob), 1, 2);
        ctx.fillRect(X(sx + 8), Y(sy - 4 - bob), 1, 1);
      }
    }
  }

  calm() {
    if (this._calm === undefined) {
      try {
        this._calm = !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      } catch (err) {
        this._calm = false;
      }
    }
    return this._calm;
  }

  // ---- the portfolio as a top-down floor ----
  // The regular site's pages are rooms in a row. Each one has a door on the left and on the right
  // edge of the screen, at the height of its big title: Início's left door is the bedroom's, and
  // Contato only has the left one. The little guy walks with WASD only (the arrows and the mouse
  // stay with the page), E uses the clickable he is standing on, and walking into a door takes him
  // to the next page, where he comes out of the facing door. Units are sprite pixels (u): 32u is the
  // cap height of the HIKARU heading, so he is the same size on every page.
  worldPages() {
    return ['inicio', 'projetos', 'sobre', 'contato'];
  }

  worldOn() {
    return this.worldPages().indexOf(this.curPage()) >= 0 && !this.st().backRoom;
  }

  worldDoorTo(page, side) {
    const P = this.worldPages();
    const i = P.indexOf(page);
    if (i < 0) return '';
    if (side === 'L') return i === 0 ? 'quarto' : P[i - 1];
    return i < P.length - 1 ? P[i + 1] : '';
  }

  worldTip(page, side) {
    const to = this.worldDoorTo(page, side);
    return {
      quarto: 'Voltar pro quarto',
      inicio: 'Voltar pro Início',
      projetos: side === 'L' ? 'Voltar pros Projetos' : 'Ir pros Projetos',
      sobre: side === 'L' ? 'Voltar pro Sobre' : 'Ir pro Sobre',
      contato: 'Ir pro Contato'
    }[to] || '';
  }

  // the screen box, the sprite unit and the door line of the current page (content coordinates, px)
  worldGeo() {
    const sc = this.screenEl();
    const wl = this._wEl;
    if (!sc || !wl || !sc.clientWidth || typeof getComputedStyle === 'undefined') return null;
    const now = Date.now();
    let c = this._wGeo;
    if (!c || c.sc !== sc || now - c.at > 300) {
      const u = (parseFloat(getComputedStyle(wl).fontSize) || 148) * 0.02104;
      // the doors sit at the title's capitals (the title line box starts at the cap height)
      let dy = 60;
      const ln = sc.querySelector('h1 .ln');
      if (ln) {
        const tfs = parseFloat(getComputedStyle(ln).fontSize) || u / 0.02104;
        const lr = ln.getBoundingClientRect();
        const sr = sc.getBoundingClientRect();
        dy = lr.top - sr.top + (sc.scrollTop || 0) + tfs * 0.02 + (tfs * 0.673) / 2 - 16 * u;
      }
      c = { sc: sc, at: now, u: u, dy: Math.max(8 * u, dy) };
      this._wGeo = c;
    }
    return { sc: sc, u: c.u, dy: c.dy, W: sc.clientWidth, H: sc.clientHeight, CH: Math.max(sc.scrollHeight || 0, sc.clientHeight), top: sc.scrollTop || 0 };
  }

  worldDoorTween(side, open, dur) {
    const cur = this.worldDoorAng(side);
    this._wDoor = this._wDoor || {};
    this._wDoor[side] = { a0: cur, a1: open ? 0 : 90, t: 0, dur: dur || 230 };
  }

  worldDoorAng(side) {
    const d = (this._wDoor || {})[side];
    if (!d) return 90;
    const p = Math.max(0, Math.min(1, d.t / d.dur));
    return d.a0 + (d.a1 - d.a0) * p * p * (3 - 2 * p);
  }

  // he shows up on a page by walking out of one of its doors (or stays out of sight on touch screens,
  // where nothing can steer him, except for the first entrance)
  worldSpawn(page, g) {
    const en = this._wEnter && this._wEnter.page === page ? this._wEnter : { side: 'L', flourish: false };
    this._wEnter = null;
    const L = en.side !== 'R' || !this.worldDoorTo(page, 'R');
    const u = g.u;
    const wk = { page: page, x: L ? -8 * u : g.W + 8 * u, y: g.dy + 24 * u, dir: L ? 'r' : 'l', walk: 0, moving: false, hidden: false, anim: null };
    if (this.coarse() && !en.flourish) wk.hidden = true;
    else wk.anim = { kind: 'out', side: L ? 'L' : 'R', t: -120, flourish: !!en.flourish };
    this._wk = wk;
    this._wKeys = {};
    this._wHit = null;
    this._wPoke = null;
    this._wRing = null;
    wk.flo = null;
    wk.act = null;
    return wk;
  }

  // a door was clicked (or the pause menu asked for the bedroom from Início): he walks over to it and
  // goes in. Only when he is hidden (touch screens) does he pop up in front of it instead.
  worldUseDoor(side) {
    const s = this.st();
    if (s.transitioning || !this.worldOn()) return;
    const page = this.curPage();
    const to = this.worldDoorTo(page, side);
    if (!to) return;
    const g = this.worldGeo();
    const wk = this._wk;
    if (!g || !wk) {
      this.worldTravel(to);
      return;
    }
    if (!wk.hidden && wk.page === page) {
      this.worldGo(to);
      return;
    }
    if (wk.anim && wk.anim.kind === 'in') return;
    if (s.doorTip) this.setState({ doorTip: false });
    const u = g.u;
    const fx = side === 'L' ? 18 * u : g.W - 18 * u;
    const fy = g.dy + 24 * u;
    const near = !wk.hidden && !wk.anim && Math.abs(wk.x - fx) < 10 * u && Math.abs(wk.y - fy) < 8 * u;
    wk.anim = { kind: 'in', side: side, t: near ? 250 : 0, to: to, from: near ? wk.x : fx };
    wk.hidden = false;
    wk.x = near ? wk.x : fx;
    wk.y = fy;
    wk.dir = side === 'L' ? 'l' : 'r';
    this.sfx(near ? 'door' : 'poof');
    if (near) this.worldDoorTween(side, true);
  }

  worldTravel(to) {
    this._wk = null;
    const trip = this._wTrip;
    let then = null;
    if (trip && trip.to === to) {
      then = trip.then;
      this.setTrip(null);
    }
    if (to === 'quarto') this.enterRoomDoor();
    else this.go(to, then || undefined);
  }

  // Walking trips: the logo, the top bar and the doors send him on foot. He walks to the door on the
  // side of the destination, goes through it, comes out on the next page and keeps walking door to
  // door until he gets there (Sobre -> Início crosses Projetos). He strolls; the "» Acelerar" chip,
  // any key or the same button again make him run (the old brisk pace), and a second push skips the
  // walk. With no one on screen to walk (touch screens, the bedroom, room mode) it is a plain page change.
  navGo(to, then) {
    if (this.worldOn()) this.worldGo(to, then);
    else this.go(to, then);
  }

  worldTripSide(page, to) {
    const P = this.worldPages();
    if (to === 'quarto') return 'L';
    return P.indexOf(to) < P.indexOf(page) ? 'L' : 'R';
  }

  worldGo(to, then) {
    const s = this.st();
    const page = this.curPage();
    const wk = this._wk;
    const cur = this._wTrip;
    if (to === page) {
      this.setTrip(null);
      if (wk) wk.auto = null;
      this.go(to, then);
      return;
    }
    // asked again for the same place: hurry up (run, then skip)
    if (cur && cur.to === to && !then) {
      this.tripPush();
      return;
    }
    if (s.transitioning) {
      if (cur) this.setTrip({ to: to, then: then || null, fast: cur.fast, run: cur.run });
      return;
    }
    if (!this.worldOn() || !wk || wk.hidden || wk.page !== page || !this.worldGeo()) {
      this.setTrip(null);
      if (to === 'quarto') this.enterRoomDoor();
      else this.go(to, then);
      return;
    }
    this.setTrip({ to: to, then: then || null, fast: false, run: !!(cur && cur.run) });
    this._wKeys = {};
    if (s.troOpen || s.palOpen || s.paused || s.achOpen || s.doorTip || s.wkHint) this.setState({ troOpen: false, palOpen: false, paused: false, achOpen: false, doorTip: false, wkHint: false });
    // standing around after coming out of a door: he can leave right away
    if (wk.anim && wk.anim.kind === 'out' && wk.anim.t >= 580) {
      const d = (this._wDoor || {})[wk.anim.side];
      if (d && d.a1 === 0) this.worldDoorTween(wk.anim.side, false, 200);
      wk.anim = null;
      wk.bang = false;
    }
    wk.auto = wk.anim ? null : { side: this.worldTripSide(page, to) };
    this.sfx('select');
  }

  worldTripSkip() {
    const t = this._wTrip;
    this.setTrip(null);
    if (this._wk) this._wk.auto = null;
    if (!t) return;
    if (this.st().transitioning) {
      this.setTrip(Object.assign({}, t, { fast: true }));
      return;
    }
    if (t.to === this.curPage()) return;
    this._wk = null;
    if (t.to === 'quarto') this.enterRoomDoor();
    else this.go(t.to, t.then || undefined);
  }

  // the trip in progress ({ to, then, fast, run }); the chip at the bottom of the screen follows it
  setTrip(t) {
    this._wTrip = t;
    if (t) this.worldPokeCancel();
    this.tripSync();
  }

  // 0: no walk on screen, 1: strolling (chip: Acelerar), 2: running (chip: Pular)
  tripSync() {
    const w = this._wTrip;
    const o = this._rmOut;
    const v = w && !w.fast ? (w.run ? 2 : 1) : (o ? (o.run ? 2 : 1) : 0);
    if ((this.state || {}).trip !== v) this.setState({ trip: v });
  }

  // "» Acelerar": the first push makes him run, the second skips the walk (in the room too)
  tripPush() {
    const o = this._rmOut;
    if (o) {
      if (!o.run) {
        this._rmOut = Object.assign({}, o, { run: true });
        this.sfx('whoosh');
        this.tripSync();
      } else this.rmExitDone();
      return;
    }
    const t = this._wTrip;
    if (!t) return;
    if (!t.run && !t.fast) {
      this.setTrip(Object.assign({}, t, { run: true }));
      this.sfx('whoosh');
      return;
    }
    this.worldTripSkip();
  }

  // to the door of the trip (strolling, or running when asked), then in through it
  worldAutoMove(wk, dt, g) {
    const u = g.u;
    const side = wk.auto.side;
    const tx = side === 'L' ? 8 * u : g.W - 8 * u;
    const ty = g.dy + 20 * u;
    if (!wk.auto.route) wk.auto.route = this.worldRoute(wk, { x: tx, y: ty }, g);
    if (this.worldRouteStep(wk, wk.auto.route, dt, g)) return true;
    const dx = tx - wk.x;
    const dy = ty - wk.y;
    const dist = Math.hypot(dx, dy);
    const run = !!(this._wTrip && this._wTrip.run);
    const sp = (run ? 0.3 : 0.15) * u * dt * this.worldFloSpeed(wk);
    if (dist <= Math.max(sp, u)) {
      wk.x = tx;
      wk.y = ty;
      wk.auto = null;
      wk.dir = side === 'L' ? 'l' : 'r';
      this.worldEnter(wk, side, g);
      return true;
    }
    wk.x += (dx / dist) * sp;
    wk.y += (dy / dist) * sp;
    this.worldCurve(wk, dt, u, dx, dy, dist);
    wk.dir = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'l' : 'r') : (dy < 0 ? 'u' : 'd');
    wk.moving = true;
    wk.walk += dt * (run ? 2 : 1.5);
    return true;
  }

  // ---- little accidents on the way ----
  // Now and then (rarely: about once in half a minute of walking) he trips, does a somersault, or
  // takes a small curve on an automatic walk. A trip stops him for half a second; a somersault
  // carries him forward; the curve is a sideways bulge that ends back on course. Nothing happens
  // while he is running (a hurried trip) or in the middle of a tap.
  worldFlourish(wk, dt, auto) {
    if (wk.flo || wk.anim || !wk.moving) return;
    wk.floAt = (wk.floAt || 0) + dt;
    if (wk.floAt < 1500) return;
    if (this._wTrip && this._wTrip.run) return;
    if (Math.random() >= dt * 0.00003) return;
    const r = Math.random();
    const kind = r < 0.5 ? 'trip' : (r < 0.85 || !auto ? 'roll' : 'curve');
    wk.floAt = 0;
    wk.flo = { kind: kind, t: 0, dur: kind === 'trip' ? 560 : (kind === 'roll' ? 480 : 760), dir: wk.dir, side: Math.random() < 0.5 ? -1 : 1 };
    this.sfx(kind === 'trip' ? 'bump' : (kind === 'roll' ? 'whoosh' : 'blip'));
  }

  // advances the accident; true while a trip holds him in place
  worldFloStep(wk, dt) {
    const f = wk.flo;
    if (!f) return false;
    f.t += dt;
    if (f.t >= f.dur) {
      if (f.kind === 'trip') wk.poof = 0;
      wk.flo = null;
      return false;
    }
    if (f.kind === 'trip') {
      wk.moving = false;
      return true;
    }
    return false;
  }

  worldFloSpeed(wk) {
    const f = wk.flo;
    return f && f.kind === 'roll' ? 1.4 : 1;
  }

  // the curve: a sideways bulge, perpendicular to the way he is going, that returns to the line
  worldCurve(wk, dt, u, dx, dy, dist) {
    const f = wk.flo;
    if (!f || f.kind !== 'curve' || !dist) return;
    const k0 = Math.sin(Math.PI * Math.max(0, f.t - dt) / f.dur);
    const k1 = Math.sin(Math.PI * Math.min(f.dur, f.t) / f.dur);
    const amp = 14 * u * f.side;
    wk.x += (-dy / dist) * amp * (k1 - k0);
    wk.y += (dx / dist) * amp * (k1 - k0);
  }

  // ---- he does the clicking ----
  // On the regular site, a mouse click on the page (anything but the top bar) is acted out: the
  // click is held, he walks over to what was clicked, does his thing on it, and it happens as he
  // finishes. What he does depends on what it is: buttons get pressed (a squash), links a hop, the
  // coin slot a high jump, bubbles a stomp (or a somersault onto them when they are close), the
  // page-changing buttons and cards a twirl, inventory slots a crouch-and-grab. Rapid clicks queue
  // up; things within reach are done at once (the snake's d-pad stays playable); WASD cancels what
  // is still queued. Keyboard activations, touch screens (he is hidden there) and replays go straight
  // through. Links that open a new tab and mailto open at once (browsers block late pop-ups); the
  // walk is still acted out.
  pokeStyle(el) {
    const ps = el.getAttribute ? el.getAttribute('data-poke') : '';
    if (ps) return ps;
    if (el.closest?.('.pad,.jpad,.n64,.mpad,.hitbox,.sys-row')) return 'stomp';
    const has = (c) => !!(el.classList && typeof el.classList.contains === 'function' && el.classList.contains(c));
    if (has('bb')) return 'stomp';
    if (el.tagName === 'A' || has('poke')) return 'hop';
    if (has('eq-s') || has('bag-i') || has('slot') || has('tk-i')) return 'grab';
    if (has('btn') || has('card') || has('sel-sec') || has('q-a') || has('nav-back') || has('rec-opt')) return 'twirl';
    return 'press';
  }

  pokeCapture(e) {
    if (!e || !e.isTrusted || e.defaultPrevented || !e.detail) return;
    if ((e.button !== undefined && e.button !== 0) || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const t = e.target;
    if (!t || !t.closest || !this.worldOn()) return;
    const sc = this.screenEl();
    if (!sc || !sc.contains(t)) return;
    const el = t.closest('a[href], button, [role="button"], .poke');
    if (!el || !sc.contains(el) || el.disabled || t.closest('.glass, [data-nopoke]')) return;
    if (t.closest('.m3d') && this._dragEnd && Date.now() - this._dragEnd < 400) return;
    const s = this.st();
    if (s.transitioning || s.powering || s.paused || s.palOpen || s.achOpen || s.troOpen || s.recOpen || s.credOpen || s.arcOpen || s.pcOpen || s.deOpen || s.tvGameOpen || s.dOpen || s.skOpen) return;
    const wk = this._wk;
    if (!wk || wk.hidden || wk.page !== this.curPage() || (wk.anim && wk.anim.kind === 'in')) return;
    const hold = () => {
      e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      e.stopPropagation();
    };
    // on a walking trip, a click hurries him up like a key does
    if (this._wTrip) {
      hold();
      this.tripPush();
      return;
    }
    const href = el.tagName === 'A' ? el.getAttribute('href') || '' : '';
    const now = (el.tagName === 'A' && (el.getAttribute('target') === '_blank' || el.hasAttribute('download') || /^mailto:/i.test(href))) || !!(el.hasAttribute && el.hasAttribute('data-now'));
    if (!now) hold();
    // he heads for the spot that was clicked (content coordinates), not just the middle of it
    let pt = null;
    if (typeof e.clientX === 'number' && typeof e.clientY === 'number' && (e.clientX || e.clientY)) {
      const sr = sc.getBoundingClientRect();
      pt = [e.clientX - sr.left, e.clientY - sr.top + (sc.scrollTop || 0)];
    }
    this.worldPoke(el, !now, pt, this.pokeStyle(el));
  }

  worldPoke(el, fire, pt, style) {
    const wk = this._wk;
    if (!wk) return;
    const P = this._wPoke || (this._wPoke = { q: [], cur: null });
    if (P.q.length >= 32) return;
    P.q.push({ el: el, fire: fire, path: this.pokePath(el), pt: pt || null, style: style || 'press' });
    // just out of a door: he can go at once
    if (wk.anim && wk.anim.kind === 'out' && wk.anim.t >= 580) {
      const d = (this._wDoor || {})[wk.anim.side];
      if (d && d.a1 === 0) this.worldDoorTween(wk.anim.side, false, 200);
      wk.anim = null;
      wk.bang = false;
    }
    if (this.st().wkHint) this.setState({ wkHint: false });
    this.sfx('blip');
  }

  // where a clicked element sits under the page (child indexes), to find it again if it was re-rendered
  pokePath(el) {
    const sc = this.screenEl();
    const path = [];
    let n = el;
    while (n && n !== sc && n.parentNode) {
      const p = n.parentNode;
      path.unshift(Array.prototype.indexOf.call(p.children || [], n));
      n = p;
    }
    return sc && n === sc ? path : null;
  }

  pokeFind(path) {
    let n = this.screenEl();
    if (!n || !path) return null;
    for (let i = 0; i < path.length; i++) {
      n = n.children ? n.children[path[i]] : null;
      if (!n) return null;
    }
    return n;
  }

  worldPokeCancel() {
    this._wPoke = null;
    if (this._wk) {
      this._wk.hop = 0;
      this._wk.act = null;
    }
  }

  // how long each act takes (ms)
  pokeDur(style) {
    return { press: 300, hop: 260, jump: 440, stomp: 320, roll: 420, twirl: 380, grab: 340 }[style] || 300;
  }

  // one frame of the poke queue; false when there is nothing to do
  worldPokeStep(wk, dt, g) {
    const P = this._wPoke;
    if (!P) return false;
    const u = g.u;
    if (!P.cur) {
      const nx = P.q.shift();
      if (!nx) {
        this.worldPokeCancel();
        return false;
      }
      let el = nx.el;
      if (el && el.isConnected === false) el = this.pokeFind(nx.path);
      if (!el || !g.sc.contains(el) || !el.getBoundingClientRect) return true;
      const r = el.getBoundingClientRect();
      const sr = g.sc.getBoundingClientRect();
      const box = [r.left - sr.left, r.top - sr.top + g.top, r.width, r.height];
      // he stands on it: feet a little below the clicked spot (or its middle), where E would find it
      const ax = nx.pt ? Math.max(box[0] + 2, Math.min(box[0] + box[2] - 2, nx.pt[0])) : box[0] + box[2] / 2;
      const ay = nx.pt ? Math.max(box[1] + 2, Math.min(box[1] + box[3] - 2, nx.pt[1])) : box[1] + box[3] / 2;
      const tx = Math.max(8 * u, Math.min(g.W - 8 * u, ax));
      const ty = Math.max(24 * u, Math.min(g.CH - 2 * u, ay + 3 * u));
      // out of sight (the page scrolled away from him): he steps in from the nearest edge
      const vis0 = g.top + 26 * u;
      const vis1 = g.top + g.H - 2 * u;
      if (wk.y < vis0 || wk.y > vis1) wk.y = Math.max(vis0, Math.min(vis1, wk.y));
      const dist = Math.hypot(tx - wk.x, ty - wk.y);
      const near = Math.abs(tx - wk.x) < 20 * u && Math.abs(ty - wk.y) < 14 * u;
      // a bubble within reach gets a somersault onto it instead of a walk
      let style = nx.style;
      if (style === 'stomp' && near) style = 'roll';
      const walk = dist > u && style !== 'roll';
      P.cur = { el: el, path: nx.path, fire: nx.fire, tx: tx, ty: ty, box: box, phase: walk ? 'walk' : 'act', t: 0, style: style, dur: this.pokeDur(style), x0: wk.x, y0: wk.y, from: dist };
      P.cur.route = walk ? this.worldRoute(wk, { x: tx, y: ty }, g) : [];
      if (!walk) wk.dir = Math.abs(tx - wk.x) > Math.abs(ty - wk.y) ? (tx < wk.x ? 'l' : 'r') : (ty < wk.y ? 'u' : 'd');
    }
    const c = P.cur;
    if (c.phase === 'walk') {
      if (this.worldRouteStep(wk, c.route, dt, g)) return true;
      const dx = c.tx - wk.x;
      const dy = c.ty - wk.y;
      const dist = Math.hypot(dx, dy);
      // an unhurried pace, eased at both ends: never faster than a run, never slower than a stroll
      const done = c.from - dist;
      const ease = 0.45 + 0.55 * Math.min(1, Math.max(0, Math.min(done, dist)) / (24 * u));
      const sp = Math.min(0.24 * u, Math.max(0.13 * u, c.from / 2200)) * dt * ease * this.worldFloSpeed(wk);
      if (dist <= Math.max(sp, u)) {
        wk.x = c.tx;
        wk.y = c.ty;
        wk.moving = false;
        c.phase = 'act';
        c.t = 0;
        c.x0 = wk.x;
        c.y0 = wk.y;
        return true;
      }
      wk.x += (dx / dist) * sp;
      wk.y += (dy / dist) * sp;
      this.worldCurve(wk, dt, u, dx, dy, dist);
      wk.dir = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'l' : 'r') : (dy < 0 ? 'u' : 'd');
      wk.moving = true;
      wk.walk += dt * 1.5;
      return true;
    }
    // the act itself: a pose that the drawing reads from wk.act; it happens as the act ends
    c.t += dt;
    wk.moving = false;
    const k = Math.min(1, c.t / c.dur);
    if (c.style === 'roll') {
      wk.x = c.x0 + (c.tx - c.x0) * k + (c.from < 2 * u ? Math.sin(k * Math.PI) * 6 * u : 0);
      wk.y = c.y0 + (c.ty - c.y0) * k;
    }
    wk.act = { style: c.style, k: k, side: c.tx < c.x0 ? -1 : 1 };
    if (c.t < c.dur) return true;
    wk.act = null;
    wk.hop = 0;
    P.cur = null;
    this._wRing = { box: c.box, t: 0 };
    if (c.style === 'stomp' || c.style === 'jump') this.sfx('land');
    let el = c.el;
    if (el && el.isConnected === false) el = this.pokeFind(c.path);
    if (el) {
      try {
        if (el.classList) {
          el.classList.add('wk-poke');
          setTimeout(() => { if (el.classList) el.classList.remove('wk-poke'); }, 220);
        }
        if (c.fire) el.click();
      } catch (err) {
        c.fire = false;
      }
    }
    return true;
  }

  // the pose for the current act or accident: a lift (u), a rotation (rad), a squash (sx, sy) and,
  // for the twirl, which way he faces
  worldPose(wk) {
    const pose = { lift: 0, rot: 0, sx: 1, sy: 1, dir: '' };
    const a = wk.act;
    if (a) {
      const k = a.k;
      const arc = Math.sin(k * Math.PI);
      if (a.style === 'press') {
        const p = Math.sin(Math.min(1, Math.max(0, (k - 0.15) / 0.55)) * Math.PI);
        pose.sx = 1 + 0.2 * p;
        pose.sy = 1 - 0.26 * p;
      } else if (a.style === 'hop') pose.lift = 5 * arc;
      else if (a.style === 'jump') {
        pose.lift = 11 * arc;
        pose.rot = a.side * 0.18 * arc;
      } else if (a.style === 'stomp') {
        pose.lift = k < 0.8 ? 8 * Math.sin((k / 0.8) * Math.PI) : 0;
        const l = k >= 0.8 ? Math.sin(((k - 0.8) / 0.2) * Math.PI) : 0;
        pose.sx = 1 + 0.18 * l;
        pose.sy = 1 - 0.2 * l;
      } else if (a.style === 'roll') {
        pose.rot = a.side * Math.PI * 2 * k;
        pose.lift = 4 * arc;
      } else if (a.style === 'twirl') {
        pose.lift = 3 * arc;
        pose.dir = ['d', 'l', 'u', 'r'][Math.floor(k * 8) % 4];
      } else if (a.style === 'grab') {
        if (k < 0.5) {
          const c = Math.sin((k / 0.5) * Math.PI);
          pose.sx = 1 + 0.12 * c;
          pose.sy = 1 - 0.22 * c;
        } else pose.lift = 4 * Math.sin(((k - 0.5) / 0.5) * Math.PI);
      }
    }
    const f = wk.flo;
    if (f) {
      const k = Math.min(1, f.t / f.dur);
      if (f.kind === 'trip') {
        const fall = Math.sin(Math.min(1, k / 0.45) * Math.PI / 2);
        const up = k > 0.55 ? Math.sin(((k - 0.55) / 0.45) * Math.PI / 2) : 0;
        const tilt = fall * (1 - up);
        pose.rot += (f.dir === 'l' ? -1 : 1) * 0.5 * tilt;
        pose.lift -= 2 * tilt;
      } else if (f.kind === 'roll') pose.rot += (f.dir === 'l' ? -1 : 1) * Math.PI * 2 * k;
    }
    return pose;
  }

  // every "back to the room" from Início goes through its left door
  toRoom() {
    if (this.curPage() === 'inicio' && !this.st().transitioning && this.worldOn()) {
      this.setState({ paused: false, palOpen: false, troOpen: false, achOpen: false, recOpen: false });
      this.worldUseDoor('L');
      return;
    }
    this.go('quarto');
  }

  enterRoomDoor() {
    this.setState({ backRoom: false, doorTip: false });
    this.go('quarto');
  }

  // choreography for walking out of / into a door; returns false when it is over
  worldAnim(wk, dt, g) {
    const a = wk.anim;
    const t0 = a.t;
    a.t += dt;
    const t = a.t;
    const u = g.u;
    const L = a.side === 'L';
    const hit = (ms) => t0 < ms && t >= ms;
    const edgeX = (v) => (L ? v * u : g.W - v * u);
    wk.bang = false;
    wk.poof = -1;
    if (a.kind === 'out') {
      if (hit(0)) {
        this.worldDoorTween(a.side, true, 240);
        this.sfx('door');
      }
      if (t < 200) wk.hidden = true;
      else if (t < 580) {
        wk.hidden = false;
        const p = (t - 200) / 380;
        wk.x = edgeX(-8 + 26 * p);
        wk.dir = L ? 'r' : 'l';
        wk.moving = true;
        wk.walk += dt;
      } else {
        wk.x = edgeX(18);
        wk.moving = false;
        if (hit(700)) {
          this.worldDoorTween(a.side, false, 200);
          this.sfx('doorShut');
        }
        if (!a.flourish) {
          if (t >= 900) return false;
          wk.dir = L ? 'r' : 'l';
        } else {
          // first time out of the bedroom: he looks around, "!"
          wk.dir = t < 700 ? (L ? 'r' : 'l') : (t < 1000 ? 'd' : (t < 1250 ? (L ? 'l' : 'r') : (t < 1500 ? (L ? 'r' : 'l') : 'd')));
          wk.bang = t >= 1560 && t < 2100;
          if (hit(1560)) this.sfx('blip');
          if (t >= 2100) {
            // teach the way back: the text box shows for a moment; on touch screens he steps out of sight
            this.setState({ doorTip: true });
            clearTimeout(this._doorTipT);
            this._doorTipT = setTimeout(() => this.setState({ doorTip: false }), 2600);
            if (!this.coarse() && !this._wkHinted) {
              this._wkHinted = true;
              this.setState({ wkHint: true });
              clearTimeout(this._wkHintT);
              this._wkHintT = setTimeout(() => this.setState({ wkHint: false }), 6000);
            }
            if (this.coarse()) {
              wk.anim = { kind: 'poof', t: 0 };
              this.sfx('poof');
              return true;
            }
            return false;
          }
        }
      }
      return true;
    }
    if (a.kind === 'poof') {
      wk.poof = Math.floor(t / 70);
      if (t >= 70) wk.hidden = true;
      return t < 350;
    }
    // 'in': pop up (if needed), the door opens, he walks into the wall, the door shuts, off we go
    if (t < 250) {
      wk.poof = Math.floor(t / 60);
      wk.hidden = t < 90;
      wk.dir = L ? 'l' : 'r';
      return true;
    }
    if (hit(250)) {
      this.worldDoorTween(a.side, true, 230);
      this.sfx('door');
    }
    if (t < 480) {
      wk.dir = L ? 'l' : 'r';
      return true;
    }
    if (t < 860) {
      const p = (t - 480) / 380;
      const x1 = edgeX(-10);
      wk.x = a.from + (x1 - a.from) * p;
      wk.dir = L ? 'l' : 'r';
      wk.moving = true;
      wk.walk += dt;
      return true;
    }
    wk.hidden = true;
    wk.moving = false;
    if (hit(900)) this.worldDoorTween(a.side, false, 200);
    if (hit(1100)) this.sfx('doorShut');
    if (t >= 1200) {
      this.worldTravel(a.to);
      return false;
    }
    return true;
  }

  worldKey(e) {
    const k = (e.key || '').toLowerCase();
    const s = this.st();
    const wk = this._wk;
    // on a walking trip, any key hurries him up (run, then skip); the chip handles its own keys
    if (this._wTrip) {
      if (e.target && e.target.closest && e.target.closest('.trip-b')) return true;
      if (e.preventDefault) e.preventDefault();
      if (!e.repeat) this.tripPush();
      return true;
    }
    if (!wk || wk.hidden || s.paused || s.palOpen || s.achOpen || s.troOpen || s.recOpen || s.credOpen || s.transitioning) return false;
    const dirs = { w: 'u', a: 'l', s: 'd', d: 'r' };
    if (dirs[k] && k.length === 1) {
      e.preventDefault();
      if (this._wPoke) this.worldPokeCancel();
      this._wKeys = Object.assign({}, this._wKeys || {});
      this._wKeys[k] = true;
      this._wLast = dirs[k];
      if (s.wkHint) this.setState({ wkHint: false });
      // right after walking out he can be steered already (the door still shuts behind him)
      if (wk.anim && wk.anim.kind === 'out' && wk.anim.t >= 580) {
        const d = (this._wDoor || {})[wk.anim.side];
        if (d && d.a1 === 0) this.worldDoorTween(wk.anim.side, false, 200);
        wk.anim = null;
        wk.bang = false;
      }
      return true;
    }
    if (k === 'e' && this._wHit && !wk.anim) {
      e.preventDefault();
      if (!e.repeat) this._wHit.click();
      return true;
    }
    return false;
  }

  worldKeyUp(e) {
    const k = (e.key || '').toLowerCase();
    if (!this._wKeys || !this._wKeys[k]) return;
    this._wKeys = Object.assign({}, this._wKeys);
    this._wKeys[k] = false;
    const dirs = { w: 'u', a: 'l', s: 'd', d: 'r' };
    if (this._wLast === dirs[k]) this._wLast = ['w', 'a', 's', 'd'].filter((x) => this._wKeys[x]).map((x) => dirs[x])[0] || '';
  }

  worldMove(wk, dt, g) {
    const K = this._wKeys || {};
    const vx = (K.d ? 1 : 0) - (K.a ? 1 : 0);
    const vy = (K.s ? 1 : 0) - (K.w ? 1 : 0);
    if (!vx && !vy) {
      wk.moving = false;
      wk.walk = 0;
      return false;
    }
    const u = g.u;
    const n = Math.hypot(vx, vy);
    const sp = 0.1 * u * dt * this.worldFloSpeed(wk);
    let nx = wk.x + (vx / n) * sp;
    let ny = wk.y + (vy / n) * sp;
    wk.dir = this._wLast || (vx ? (vx > 0 ? 'r' : 'l') : (vy > 0 ? 'd' : 'u'));
    wk.moving = true;
    wk.walk += dt;
    // the screen edges are walls, except through a door
    const inDoor = ny >= g.dy + 12 * u && ny <= g.dy + 28 * u;
    const page = this.curPage();
    if (nx < 8 * u) {
      nx = 8 * u;
      if (vx < 0 && inDoor && this.worldDoorTo(page, 'L')) this.worldEnter(wk, 'L', g);
    }
    if (nx > g.W - 8 * u) {
      nx = g.W - 8 * u;
      if (vx > 0 && inDoor && this.worldDoorTo(page, 'R')) this.worldEnter(wk, 'R', g);
    }
    wk.x = nx;
    wk.y = Math.max(24 * u, Math.min(g.CH - 2 * u, ny));
    return true;
  }

  // walked into a door
  worldEnter(wk, side, g) {
    const to = this.worldDoorTo(this.curPage(), side);
    if (!to || wk.anim) return;
    this._wKeys = {};
    wk.y = Math.max(g.dy + 16 * g.u, Math.min(g.dy + 26 * g.u, wk.y));
    wk.anim = { kind: 'in', side: side, t: 250, to: to, from: wk.x };
    this.worldDoorTween(side, true, 230);
    this.sfx('door');
  }

  loopWorld(dt) {
    const cv = this._wCv;
    if (!cv || !this.worldOn()) {
      if (!this.worldOn()) this._wk = null;
      return;
    }
    const s = this.state || {};
    const g = this.worldGeo();
    if (!g) return;
    const page = this.curPage();
    Object.keys(this._wDoor || {}).forEach((k) => { this._wDoor[k].t += dt; });
    let wk = this._wk;
    this.worldButtons(g);
    if (!wk || wk.page !== page) {
      if (s.transitioning || s.powering) return this.worldDraw(cv, g, null);
      // a trip that was skipped during the page change finishes at once
      const tp = this._wTrip;
      if (tp && tp.fast && tp.to !== page) {
        this.setTrip(null);
        if (tp.to === 'quarto') this.enterRoomDoor();
        else this.go(tp.to, tp.then || undefined);
        return this.worldDraw(cv, g, null);
      }
      wk = this.worldSpawn(page, g);
    }
    const busy = !!(s.paused || s.palOpen || s.achOpen || s.recOpen || s.arcOpen || s.dOpen || s.skOpen || s.credOpen || s.transitioning || s.powering || s.languageOpen || s.galleryLarge || s.shooterOpen || s.deOpen || s.tvGameOpen);
    let moved = false;
    // a trip in progress: once he is out of the door, on to the next one (or done)
    const trip = this._wTrip;
    if (trip && !wk.anim && !wk.auto && !wk.hidden) {
      if (trip.to === page) {
        this.setTrip(null);
        if (trip.then) trip.then();
      } else wk.auto = { side: this.worldTripSide(page, trip.to) };
    }
    if (wk.anim && !busy) {
      if (!this.worldAnim(wk, dt, g)) wk.anim = null;
      if (this._wk !== wk) return;
    } else if (!busy && !wk.hidden) {
      if (this.worldFloStep(wk, dt)) moved = false;
      else {
        moved = wk.auto ? this.worldAutoMove(wk, dt, g) : (this.worldPokeStep(wk, dt, g) || this.worldMove(wk, dt, g));
        if (moved && wk.moving && !(this._wPoke && this._wPoke.cur && this._wPoke.cur.phase === 'act')) this.worldFlourish(wk, dt, !!(wk.auto || this._wPoke));
      }
    } else wk.moving = false;
    // the camera follows him on pages that scroll
    if (moved) {
      const m = Math.min(110, g.H * 0.2);
      const head = wk.y - 26 * g.u - g.top;
      const feet = wk.y - g.top;
      if (feet > g.H - m) g.sc.scrollTop = g.top + (feet - (g.H - m));
      else if (head < m) g.sc.scrollTop = Math.max(0, g.top - (m - head));
      g.top = g.sc.scrollTop || 0;
    }
    // what he is standing on: something clickable (E uses it), or the buried ficha
    this._wHitAt = (this._wHitAt || 0) + dt;
    if (!wk.hidden && !wk.anim && !wk.auto && (moved || this._wHitAt > 200)) {
      this._wHitAt = 0;
      let el = null;
      try {
        const sr = g.sc.getBoundingClientRect();
        el = document.elementFromPoint(sr.left + wk.x, sr.top + wk.y - g.top - 3 * g.u);
        el = el && el.closest ? el.closest('a[href], button') : null;
      } catch (err) {
        el = null;
      }
      this._wHit = el && g.sc.contains(el) ? el : null;
    } else if (wk.hidden || wk.anim || wk.auto) this._wHit = null;
    const a = this._coinSpot;
    if (s.seis && a && !a.tile && a.page === page && !wk.hidden && !wk.anim) {
      const p = this.coinXY(a, g.sc);
      if (Math.abs(p.x + 15 - wk.x) < 10 * g.u && Math.abs(p.y + 15 - (wk.y - 6 * g.u)) < 10 * g.u) this.coinTake();
    }
    this.worldDraw(cv, g, wk);
  }

  worldDraw(cv, g, wk) {
    const ctx = cv.getContext ? cv.getContext('2d') : null;
    if (!ctx) return;
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const Wd = Math.round(g.W * dpr);
    const Hd = Math.round(g.H * dpr);
    if (cv.width !== Wd) cv.width = Wd;
    if (cv.height !== Hd) cv.height = Hd;
    const cw = g.W + 'px';
    const ch = g.H + 'px';
    if (cv.style.width !== cw) cv.style.width = cw;
    if (cv.style.height !== ch) cv.style.height = ch;
    ctx.clearRect(0, 0, Wd, Hd);
    ctx.imageSmoothingEnabled = false;
    const u = g.u;
    const top = g.top;
    const clock = (this._wClock = (this._wClock || 0) + 16);
    // art-pixel rectangles anchored at (ox, oy) in content px, optionally mirrored (right door)
    const pen = (ox, oy, mir) => (ax, ay, aw, ah, col) => {
      const xa = mir ? -(ax + aw) : ax;
      const X0 = Math.round((ox + xa * u) * dpr);
      const X1 = Math.round((ox + (xa + aw) * u) * dpr);
      const Y0 = Math.round((oy + ay * u - top) * dpr);
      const Y1 = Math.round((oy + (ay + ah) * u - top) * dpr);
      if (X1 <= 0 || Y1 <= 0 || X0 >= Wd || Y0 >= Hd) return;
      ctx.fillStyle = col;
      ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    };
    const A = (al, fn) => {
      ctx.globalAlpha = al;
      fn();
      ctx.globalAlpha = 1;
    };
    const page = this.curPage();
    ['L', 'R'].forEach((side) => {
      if (!this.worldDoorTo(page, side)) return;
      const hov = this._wHov === side && !(wk && wk.anim);
      let ang = this.worldDoorAng(side);
      if (hov && ang >= 89) ang = 58;
      this.worldDrawDoor(pen(side === 'L' ? 0 : g.W, g.dy, side === 'R'), A, ang, hov, clock, g.W < 600);
    });
    // what he just tapped: a gold ring opens out around it
    const rg = this._wRing;
    if (rg) {
      rg.t += 16;
      const k = rg.t / 360;
      if (k >= 1) this._wRing = null;
      else {
        const pd = 3 + k * 10;
        ctx.strokeStyle = 'rgba(240,206,106,' + (0.9 * (1 - k)).toFixed(2) + ')';
        ctx.lineWidth = Math.max(1, Math.round(2 * dpr));
        ctx.strokeRect(Math.round((rg.box[0] - pd) * dpr), Math.round((rg.box[1] - top - pd) * dpr), Math.round((rg.box[2] + pd * 2) * dpr), Math.round((rg.box[3] + pd * 2) * dpr));
      }
    }
    if (!wk || wk.hidden) {
      if (wk && wk.poof >= 0) this.worldPoof(pen(wk.x, wk.y, false), A, wk.poof);
      return;
    }
    // what E would use: a dashed outline around it and a "!" over his head
    const hitEl = this._wHit;
    if (hitEl && hitEl.getBoundingClientRect) {
      const r = hitEl.getBoundingClientRect();
      const sr = g.sc.getBoundingClientRect();
      ctx.strokeStyle = 'rgba(240,206,106,0.9)';
      ctx.lineWidth = Math.max(1, Math.round(dpr * 1.5));
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.strokeRect(Math.round((r.left - sr.left - 3) * dpr), Math.round((r.top - sr.top - 3) * dpr), Math.round((r.width + 6) * dpr), Math.round((r.height + 6) * dpr));
      ctx.setLineDash([]);
    }
    const img = this.worldImg();
    const P = pen(wk.x, wk.y, false);
    const pose = this.worldPose(wk);
    A(0.3 * (1 - Math.min(1, Math.abs(pose.lift) / 14)), () => P(-5, -1, 10, 1, '#000000'));
    if (img) {
      const order = { d: 0, u: 3, l: 6, r: 9 };
      const ph = Math.floor(wk.walk / 130) % 4;
      const fr = order[pose.dir || wk.dir] + (wk.moving ? [0, 1, 0, 2][ph] : 0);
      const hp = ((wk.hop || 0) + pose.lift) * u;
      const w = 16 * u * dpr;
      const h = 24 * u * dpr;
      // drawn around the feet, so a squash sits on the ground and a somersault turns about the middle
      ctx.save();
      ctx.translate(Math.round(wk.x * dpr), Math.round((wk.y - top - hp) * dpr));
      if (pose.rot) {
        ctx.translate(0, -h / 2);
        ctx.rotate(pose.rot);
        ctx.translate(0, h / 2);
      }
      if (pose.sx !== 1 || pose.sy !== 1) ctx.scale(pose.sx, pose.sy);
      ctx.drawImage(img, 48 + fr * 16, 224, 16, 24, Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h));
      this.drawCharacterCare?.(ctx, u * dpr, pose.dir || wk.dir);
      ctx.restore();
    }
    if (wk.bang || (hitEl && !wk.anim && !this._wPoke)) {
      const by = -34 - (Math.floor(clock / 300) % 2);
      P(-3, by, 7, 8, '#050706');
      P(-2, by + 1, 5, 6, '#F0CE6A');
      P(0, by + 2, 1, 2, '#050706');
      P(0, by + 5, 1, 1, '#050706');
    }
    if (wk.poof >= 0) this.worldPoof(P, A, wk.poof);
  }

  worldImg() {
    const ael = this._doorImg;
    return ael && ael.complete && ael.naturalWidth ? ael : (this._rmAtlas || this.rmImg());
  }

  // one door in the page wall, top-down like the room: closed, the leaf lies along the wall;
  // open (0°), it swings out into the page. Art coordinates from the screen edge and the door line.
  worldDrawDoor(R, A, ang, hov, clock, narrow) {
    // the same exit mat the bedroom has at its door, the arrow pointing in (slimmer on phones,
    // where the page margin is thin)
    const mw = narrow ? 4 : 8;
    R(5, 7, mw, 20, '#100C0A');
    R(6, 8, mw - 2, 18, '#6E4C32');
    for (let y = 9; y < 26; y += 3) R(6, y, mw - 2, 1, '#8C6440');
    const gold = !hov || Math.floor(clock / 400) % 2 === 0 ? '#F0CE6A' : '#9C7F3A';
    if (narrow) {
      R(7, 14, 1, 6, gold);
      R(6, 16, 1, 2, gold);
    } else {
      R(10, 13, 1, 8, gold);
      R(9, 14, 1, 6, gold);
      R(8, 15, 1, 4, gold);
      R(7, 16, 1, 2, gold);
    }
    R(4, 8, 1, 18, '#968C78');
    // the room's light on the page floor while it is open
    const spill = (90 - ang) / 90;
    if (spill > 0) {
      for (let x = 4; x < 22; x++) {
        const k = Math.floor((x - 4) / 4);
        A(spill * 0.24 * (1 - (x - 4) / 18), () => R(x, 9 - k, 1, 16 + 2 * k, '#F0CE6A'));
      }
    }
    // the wall: top face along the screen edge, the jamb end and its front face (3/4 view)
    A(0.35, () => R(4, 1, 1, 36, '#000000'));
    [[0, 6], [26, 32]].forEach((w) => {
      R(0, w[0], 4, w[1] - w[0], '#3B4B41');
      R(0, w[0], 1, w[1] - w[0], '#2A362F');
      R(3, w[0], 1, w[1] - w[0], '#62796A');
    });
    R(0, 0, 4, 1, '#7E9786');
    R(0, 32, 4, 5, '#222C26');
    R(0, 36, 4, 1, '#161D19');
    if (ang < 89) {
      R(0, 8, 4, 18, '#6E5033');
      R(1, 8, 1, 18, '#5A4029');
      A(0.35, () => R(0, 8, 4, 18, '#F0CE6A'));
    }
    R(0, 6, 4, 2, '#222C26');
    const rad = ang * Math.PI / 180;
    const cs = Math.cos(rad);
    const sn = Math.sin(rad);
    for (let i = 0; i < 18; i++) R(Math.round(2 + cs * i), Math.round(8 + sn * i), 2, 2, '#8A6240');
    for (let i = 1; i < 18; i += 4) R(Math.round(2 + cs * i + sn), Math.round(8 + sn * i - cs), 1, 1, '#5E4128');
    R(Math.round(2 + cs * 15 + sn * 2), Math.round(8 + sn * 15 - cs * 2), 1, 1, '#F0CE6A');
    if (ang >= 89) A(0.35 + 0.3 * Math.sin(clock / 650), () => R(4, 9, 1, 16, '#F0CE6A'));
  }

  worldPoof(R, A, i) {
    if (i < 0 || i > 4) return;
    const r = 3 + i * 2.4;
    const sz = Math.max(1, 4 - i);
    A(Math.max(0.25, 1 - i * 0.17), () => {
      for (let k = 0; k < 8; k++) {
        const an = k * Math.PI / 4 + i * 0.25;
        R(Math.round(Math.cos(an) * r - sz / 2), Math.round(-12 + Math.sin(an) * r * 1.1 - sz / 2), sz, sz, k % 2 ? '#A3AD9F' : '#E8E4D4');
      }
      if (i < 2) R(-3 + i, -15 + i, 6 - 2 * i, 6 - 2 * i, '#E8E4D4');
    });
  }

  // position the door buttons over the doors (they scroll away with the page)
  worldButtons(g) {
    const put = (el, x, y, w, h) => {
      if (!el) return;
      const v = [Math.round(x) + 'px', Math.round(y) + 'px', Math.round(w) + 'px', Math.round(h) + 'px'];
      if (el.style.left !== v[0]) el.style.left = v[0];
      if (el.style.top !== v[1]) el.style.top = v[1];
      if (el.style.width !== v[2]) el.style.width = v[2];
      if (el.style.height !== v[3]) el.style.height = v[3];
    };
    const u = g.u;
    const wk = this._wk;
    const hint = this._wkHintEl;
    if (hint && wk) {
      const hl = Math.max(4, Math.min(g.W - (hint.offsetWidth || 220) - 4, wk.x - (hint.offsetWidth || 220) / 2));
      const ht = wk.y - 40 * u - g.top - (hint.offsetHeight || 30);
      const v = [Math.round(hl) + 'px', Math.round(ht) + 'px'];
      if (hint.style.left !== v[0]) hint.style.left = v[0];
      if (hint.style.top !== v[1]) hint.style.top = v[1];
    }
    put(this._wdL, 0, g.dy + 4 * u - g.top, 16 * u, 24 * u);
    put(this._wdR, g.W - 16 * u, g.dy + 4 * u - g.top, 16 * u, 24 * u);
  }

  isNight() {
    try {
      if (!this._hourFmt) this._hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hourCycle: 'h23' });
      const h = parseInt(this._hourFmt.format(Date.now()), 10);
      return h >= 18 || h < 6;
    } catch (err) {
      return true;
    }
  }

  say(text, who) {
    this._dlg = { text: text, t0: 0, shown: 0, done: false, who: who || '' };
    this.setState({ dlgText: text, dlgWho: who || '' });
  }

  roomTotal() {
    return this.data().room.filter((o) => !o.door).length;
  }

  roomSeenN() {
    const seen = this._roomSeen || {};
    return this.data().room.filter((o) => !o.door && seen[o.id]).length;
  }

  look(i) {
    const d = this.data();
    const o = d.room[i];
    if (!o.door) {
      this._roomSeen = Object.assign({}, this._roomSeen || {});
      this._roomSeen[o.id] = true;
    }
    const n = this.roomSeenN();
    // arcades, consoles, the TV and the robot answer with a jingle and a little show (drawn in rmDraw)
    if (o.jingle) this.rmFxOn(o.id);
    this.sfx(o.jingle || 'look');
    if (o.talk) this.say(this.robotLine(), o.name);
    else this.say(o.text || (this.isNight() ? o.night : o.day));
    this.setState({ roomObj: i, roomSeenN: n, rmIntro: false });
    if (n >= this.roomTotal()) this.unlock('room');
    this.persistSoon();
  }

  rmFxOn(id) {
    const add = {};
    add[id] = this.rmInit().clock;
    this._rmFx = Object.assign({}, this._rmFx || {}, add);
  }

  // the robot never repeats itself twice in a row; the very first time, it says hello
  robotLine() {
    const L = this.data().robotLines;
    let k = typeof this._robotLast === 'number' ? Math.floor(Math.random() * L.length) : 0;
    if (L.length > 1 && k === this._robotLast) k = (k + 1) % L.length;
    this._robotLast = k;
    return L[k];
  }

  // the save star by the bed (a nod to Undertale): saves for real, with a sparkle
  saveStar() {
    this.rmFxOn('estrela');
    this.sfx('save');
    const ok = this.persist(true);
    const i = this.data().room.findIndex((o) => o.id === 'estrela');
    this.say(ok ? 'Arquivo salvo. Progresso guardado, HP cheio e a DETERMINAÇÃO lá em cima.' : 'A estrela brilhou, mas o navegador não deixou salvar. A DETERMINAÇÃO ficou, pelo menos.');
    this.setState({ rmDlg: true, rmSel: 0, rmIntro: false, roomObj: i });
  }

  roomAct(code, e) {
    if (code === 'sleep') this.sleep();
    else if (code === 'savestar') this.saveStar();
    else if (code === 'd20') this.d20Open();
    else if (code === 'skills') this.skOpen();
    else if (code === 'pcgame') this.pcSit();
    else if (code === 'robot') {
      const i = this.data().room.findIndex((o) => o.id === 'robo');
      if (i >= 0) this.rmOpen(i);
    }
    else if (code === 'arcade') this.openArcade();
    else if (code === 'seis') this.seisAt(e, false);
    else if (code === 'site') {
      this.setState({ backRoom: false });
      this.go('inicio');
    } else if (code.indexOf('go:') === 0) {
      const to = code.slice(3);
      this.setState({ backRoom: to !== 'lab' });
      this.go(to);
    } else if (code.indexOf('proj:') === 0) {
      const n = parseInt(code.slice(5), 10);
      this.setState({ backRoom: true });
      this.go('projetos', () => this.openProj(n));
    }
  }

  // first time in the room this session: five short lines, in order: how to play, then where
  // Início, Projetos, Sobre and Contato live (everything else is left to be discovered)
  rmIntroLines() {
    const touch = this.coarse();
    return [
      { label: 'Quarto', target: '', text: touch
        ? 'Esse é o meu quarto! Pode explorar e mexer em tudo: toca no chão pra andar e toca nas coisas pra interagir.'
        : 'Esse é o meu quarto! Pode explorar e mexer em tudo: anda com WASD ou as setas (ou clica no chão) e interage com E, espaço ou clicando nas coisas.' },
      { label: 'Início', target: 'porta', text: 'O Início fica lá fora: a porta aqui embaixo leva pro site comum. De lá, a portinha do lado do meu nome te traz de volta pra cá.' },
      { label: 'Projetos', target: 'quadro', text: 'Os Projetos estão no quadro de missões, ali na parede. Cada papel preso é uma missão que eu concluí.' },
      { label: 'Sobre', target: 'espelho', text: 'O Sobre fica no espelho: é só se olhar nele pra ver a ficha do personagem.' },
      { label: 'Contato', target: 'celular', text: 'E o Contato tá no celular, no criado-mudo do lado da cama. O resto do quarto é por sua conta: fuça tudo!' }
    ];
  }

  roomIntro() {
    if (this._rmIntroShown) return;
    this._rmIntroShown = true;
    this.rmIntroStep(0);
    this.persistSoon();
  }

  rmIntroStep(i) {
    const L = this.rmIntroLines();
    const n = Math.max(0, Math.min(L.length - 1, i));
    this.say(L[n].text);
    this.setState({ rmDlg: true, rmSel: 0, rmIntro: true, rmStep: n, roomObj: null });
  }

  rmIntroTarget() {
    const s = this.state || {};
    if (!s.rmIntro || !s.rmDlg) return -1;
    const L = this.rmIntroLines();
    const t = (L[s.rmStep || 0] || {}).target;
    return t ? this.data().room.findIndex((o) => o.id === t) : -1;
  }

  coarse() {
    if (this._coarse === undefined) {
      try {
        this._coarse = !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
      } catch (err) {
        this._coarse = false;
      }
    }
    return this._coarse;
  }

  sleep() {
    if (this.st().sleeping) return;
    clearTimeout(this._zzT);
    clearTimeout(this._zzT2);
    this.sfx('sleep');
    this.setState({ sleeping: 1 });
    this._zzT = setTimeout(() => this.setState({ sleeping: 2 }), 1500);
    this._zzT2 = setTimeout(() => {
      const bed = this.data().room.findIndex((o) => o.id === 'cama');
      this.say('Save concluído. HP e MP restaurados. Bora de volta pro terminal?');
      this.setState({ sleeping: 0, rmDlg: this.curPage() === 'quarto', rmSel: 0, rmIntro: false, roomObj: bed });
      this.unlock('rest');
    }, 3200);
  }

  seisAt(e, center) {
    let x = 720;
    let y = 450;
    try {
      const t = e && e.currentTarget;
      const root = this._rootEl || (t && t.closest ? t.closest('.okr') : null);
      if (root) {
        const rr = root.getBoundingClientRect();
        x = Math.round(rr.width / 2);
        y = Math.round(rr.height / 2);
        if (!center && t && t.getBoundingClientRect) {
          const br = t.getBoundingClientRect();
          x = Math.round(br.left + br.width / 2 - rr.left);
          y = Math.round(br.top + br.height / 2 - rr.top);
        }
      }
    } catch (err) {
      x = 720;
    }
    clearTimeout(this._seisT);
    this._seisT = setTimeout(() => this.setSeis(true, x, y), 300);
  }

  popBubble(i) {
    const b = Object.assign({}, this.st().bub || {});
    if (b[i]) return;
    b[i] = true;
    this.sfx('pop');
    this.setState({ bub: b });
    if (i === this._bubCoin) this.fichaGain('bolha');
    if (Object.keys(b).length >= 24) this.unlock('bubbles');
  }

  bubRefill() {
    this.sfx('refill');
    this._bubCoin = Math.floor(Math.random() * 24);
    this.setState({ bub: {} });
  }

  noiseBuf() {
    const ac = this._ac;
    if (!ac) return null;
    if (!this._nb) {
      const len = Math.floor(ac.sampleRate * 0.8);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      this._nb = buf;
    }
    return this._nb;
  }

  tracks() {
    if (this._tracks) return this._tracks;
    const build = (name, bpm, fn) => {
      const ev = [];
      for (let i = 0; i < 64; i++) ev.push([]);
      const put = (step, v) => { ev[step % 64].push(v); };
      fn(put);
      return { name: name, bpm: bpm, len: 64, ev: ev };
    };
    const T = [];
    T.push(build('Press Start', 136, (put) => {
      const ch = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]];
      const arp = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3];
      ch.forEach((c, b) => {
        for (let s = 0; s < 16; s++) put(b * 16 + s, { m: c[arp[s]] + 12, len: 1, type: 'square', vol: 0.016 });
        for (let s = 0; s < 16; s += 2) put(b * 16 + s, { m: c[0] - 24 + (s % 4 === 2 ? 12 : 0), len: 2, type: 'triangle', vol: 0.09 });
        [0, 8].forEach((s) => put(b * 16 + s, { drum: 'kick' }));
        [4, 12].forEach((s) => put(b * 16 + s, { drum: 'snare' }));
        for (let s = 2; s < 16; s += 4) put(b * 16 + s, { drum: 'hat' });
      });
      [[0, 76, 2], [2, 79, 2], [4, 84, 4], [8, 83, 2], [10, 79, 2], [12, 76, 4], [16, 81, 4], [20, 79, 2], [22, 76, 2], [24, 72, 4], [28, 76, 4], [32, 77, 2], [34, 81, 2], [36, 84, 4], [40, 81, 2], [42, 77, 2], [44, 81, 4], [48, 79, 2], [50, 83, 2], [52, 86, 4], [56, 83, 2], [58, 79, 2], [60, 74, 4]]
        .forEach((n) => put(n[0], { m: n[1], len: n[2], type: 'square', vol: 0.032 }));
    }));
    T.push(build('Bancada', 88, (put) => {
      const ch = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]];
      ch.forEach((c, b) => {
        c.forEach((n) => put(b * 16, { m: n, len: 15, type: 'triangle', vol: 0.018, atk: 0.12 }));
        for (let s = 0; s < 16; s += 2) put(b * 16 + s, { m: c[(s / 2) % 4] + 12, len: 1, type: 'sine', vol: 0.024 });
        put(b * 16, { m: c[0] - 12, len: 7, type: 'triangle', vol: 0.08 });
        put(b * 16 + 8, { m: c[0] - 12, len: 6, type: 'triangle', vol: 0.07 });
        [0, 10].forEach((s) => put(b * 16 + s, { drum: 'kick', vol: 0.6 }));
        put(b * 16 + 8, { drum: 'snare', vol: 0.45 });
        [0, 3, 4, 7, 8, 11, 12, 15].forEach((s) => put(b * 16 + s, { drum: 'hat', vol: 0.45 }));
      });
      [[2, 76, 3], [6, 72, 2], [10, 74, 5], [18, 72, 3], [22, 69, 2], [26, 72, 5], [34, 67, 3], [38, 71, 2], [42, 72, 5], [50, 74, 3], [54, 71, 2], [58, 67, 6]]
        .forEach((n) => put(n[0], { m: n[1], len: n[2], type: 'sine', vol: 0.04 }));
    }));
    T.push(build('Madrugada', 74, (put) => {
      const ch = [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67]];
      ch.forEach((c, b) => {
        c.forEach((n) => put(b * 16, { m: n, len: 16, type: 'triangle', vol: 0.014, atk: 0.4 }));
        [0, 3, 6, 10, 13].forEach((s, k) => put(b * 16 + s, { m: c[k % 4] + 12, len: 2, type: 'sine', vol: 0.02 }));
        put(b * 16, { m: c[0] - 24, len: 12, type: 'sine', vol: 0.09, atk: 0.05 });
        for (let s = 2; s < 16; s += 4) put(b * 16 + s, { drum: 'shaker' });
      });
      [[0, 81, 6], [16, 79, 6], [32, 76, 8], [48, 76, 4], [56, 74, 6]].forEach((n) => put(n[0], { m: n[1], len: n[2], type: 'sine', vol: 0.03, atk: 0.02 }));
    }));
    this._tracks = T;
    return T;
  }

  mNote(f, dur, type, vol, at, atk) {
    const ac = this._ac;
    const bus = this._mus;
    if (!ac || !bus) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    const a = Math.max(0.005, atk || 0.008);
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + a);
    g.gain.setValueAtTime(vol, Math.max(at + a, at + dur * 0.7));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.02);
    o.connect(g);
    g.connect(bus);
    o.start(at);
    o.stop(at + dur + 0.06);
  }

  mDrum(kind, at, vol) {
    const ac = this._ac;
    const bus = this._mus;
    if (!ac || !bus) return;
    const v = vol == null ? 1 : vol;
    if (kind === 'kick') {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, at);
      o.frequency.exponentialRampToValueAtTime(42, at + 0.12);
      g.gain.setValueAtTime(0.22 * v, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
      o.connect(g);
      g.connect(bus);
      o.start(at);
      o.stop(at + 0.2);
      return;
    }
    const buf = this.noiseBuf();
    if (!buf) return;
    const cfg = kind === 'snare' ? [1800, 'bandpass', 0.11 * v, 0.12] : (kind === 'hat' ? [7000, 'highpass', 0.045 * v, 0.04] : [5200, 'highpass', 0.028 * v, 0.07]);
    const src = ac.createBufferSource();
    const fl = ac.createBiquadFilter();
    const g = ac.createGain();
    src.buffer = buf;
    fl.type = cfg[1];
    fl.frequency.setValueAtTime(cfg[0], at);
    g.gain.setValueAtTime(cfg[2], at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + cfg[3]);
    src.connect(fl);
    fl.connect(g);
    g.connect(bus);
    src.start(at, Math.random() * 0.5);
    src.stop(at + cfg[3] + 0.02);
  }

  startMusic(i) {
    this.stopMusic();
    if (!this._snd) return;
    const ac = this.audio();
    if (!ac || !this._mix) return;
    const tr = this.tracks()[i];
    if (!tr) return;
    try {
      const bus = ac.createGain();
      bus.gain.setValueAtTime(0.0001, ac.currentTime);
      bus.gain.exponentialRampToValueAtTime(0.85, ac.currentTime + 0.6);
      bus.connect(this._mix);
      this._mus = bus;
      this._mTrack = tr;
      this._mNext = ac.currentTime + 0.08;
      this._mStep = 0;
    } catch (err) {
      this._mus = null;
    }
    this.startLoop();
  }

  stopMusic() {
    const bus = this._mus;
    const ac = this._ac;
    this._mus = null;
    this._mTrack = null;
    if (!bus || !ac) return;
    try {
      bus.gain.cancelScheduledValues(ac.currentTime);
      bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), ac.currentTime);
      bus.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25);
      setTimeout(() => {
        try {
          bus.disconnect();
        } catch (err) {
          return;
        }
      }, 400);
    } catch (err) {
      this._mus = null;
    }
  }

  loopMusic() {
    const tr = this._mTrack;
    const ac = this._ac;
    if (!tr || !ac || !this._mus) return;
    const spb = 60 / tr.bpm / 4;
    if (this._mNext < ac.currentTime - 0.3) this._mNext = ac.currentTime + 0.05;
    let guard = 0;
    while (this._mNext < ac.currentTime + 0.15 && guard < 16) {
      guard += 1;
      const at = this._mNext;
      tr.ev[this._mStep].forEach((ev) => {
        if (ev.drum) this.mDrum(ev.drum, at, ev.vol);
        else this.mNote(440 * Math.pow(2, (ev.m - 69) / 12), ev.len * spb, ev.type, ev.vol, at, ev.atk);
      });
      this._mNext += spb;
      this._mStep = (this._mStep + 1) % tr.len;
    }
  }

  setTrack(i) {
    this._track = i;
    if (i >= 0) {
      if (!this._snd) {
        this._snd = true;
        this.audio();
      }
      this.startMusic(i);
      this._heard = Object.assign({}, this._heard || {});
      this._heard[i] = true;
      if (Object.keys(this._heard).length >= 3) this.unlock('dj');
    } else {
      this.stopMusic();
    }
    this.setState({ track: i, snd: !!this._snd });
    this.persistSoon();
  }

  cycleTrack() {
    const cur = typeof this._track === 'number' ? this._track : -1;
    this.setTrack(cur >= 2 ? -1 : cur + 1);
  }

  openArcade() {
    if (this.st().arcOpen) return;
    this._arcWrap = null;
    this._arc = this.arcNew();
    this.sfx('coin');
    this.setState({ arcOpen: true, arcMode: 'title', paused: false, palOpen: false, troOpen: false, achOpen: false, recOpen: false });
    this.startLoop();
  }

  arcFocus() {
    const w = this._arcWrap;
    if (!w || !w.focus) return;
    try {
      w.focus({ preventScroll: true });
    } catch (err) {
      return;
    }
  }

  arcPlay() {
    const a = this._arc;
    if (!a) return;
    if (a.mode === 'title' || a.mode === 'over') this.arcStart();
    this.arcFocus();
  }

  closeArcade() {
    if (!this.st().arcOpen) return;
    this._arc = null;
    this._arcCv = null;
    this.setState({ arcOpen: false });
    this.focusRoot();
    this.persistSoon();
  }

  arcNew() {
    return { mode: 'title', score: 0, lives: 3, wave: 1, resolved: 0, pk: [], bl: [], fx: [], px: 160, cd: 0, spawn: 1, keys: {}, msg: '', msgT: 0, t: 0, ini: [0, 0, 0], iniPos: 0, rank: -1, paused: false, flash: 0 };
  }

  arcStart() {
    const a = this._arc;
    if (!a) return;
    Object.assign(a, { mode: 'play', score: 0, lives: 3, wave: 1, resolved: 0, pk: [], bl: [], fx: [], px: 160, cd: 0, spawn: 0.8, msg: 'ONDA 1', msgT: 1.6, paused: false, flash: 0, keys: {}, fk: 0 });
    this.sfx('start');
    this.setState({ arcMode: 'play' });
  }

  arcMap(k) {
    return { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ' ': 'f', ArrowUp: 'f', w: 'f', W: 'f' }[k] || '';
  }

  arcKey(e) {
    const a = this._arc;
    if (!a) return;
    const k = e.key || '';
    const stop = () => {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    };
    if (k === 'Escape') {
      stop();
      this.closeArcade();
      return;
    }
    // right after a game over, ignore held/auto-repeated keys so the result screen can't be skipped by accident
    const held = a.t < (a.lockT || 0) || (!!e.repeat && (k === 'Enter' || k === ' '));
    if (a.mode === 'ini') {
      stop();
      if (!held) this.arcIniKey(k);
      return;
    }
    if (k === 'p' || k === 'P') {
      stop();
      if (a.mode === 'play') {
        a.paused = !a.paused;
        this.sfx(a.paused ? 'pause' : 'unpause');
      }
      return;
    }
    if (a.mode !== 'play' && (k === 'Enter' || k === ' ')) {
      stop();
      if (!held) this.arcPlay();
      return;
    }
    const m = this.arcMap(k);
    if (m) {
      stop();
      a.keys[m] = true;
    }
  }

  arcKeyUp(e) {
    const a = this._arc;
    if (!a) return;
    const m = this.arcMap(e.key || '');
    if (m) a.keys[m] = false;
  }

  arcBtn(m, down) {
    const a = this._arc;
    if (!a) return;
    if (!down) {
      a.keys[m] = false;
      return;
    }
    if (a.mode !== 'play' && a.t < (a.lockT || 0)) return;
    if (a.mode === 'ini') {
      this.arcIniKey(m);
      return;
    }
    if (a.mode !== 'play') {
      if (m === 'f') this.arcPlay();
      return;
    }
    a.keys[m] = true;
  }

  arcStep(a, s) {
    const W = 320;
    const H = 240;
    if (a.keys.l) a.px -= 170 * s;
    if (a.keys.r) a.px += 170 * s;
    a.px = Math.max(14, Math.min(W - 14, a.px));
    a.cd -= s;
    if (a.keys.f && a.cd <= 0) {
      a.bl.push({ x: a.px, y: H - 34 });
      a.cd = 0.26;
      this.sfx('shoot');
    }
    a.bl.forEach((b) => { b.y -= 280 * s; });
    a.bl = a.bl.filter((b) => b.y > -8);
    a.spawn -= s;
    if (a.spawn <= 0) {
      a.spawn = Math.max(0.32, 1.15 - a.wave * 0.11) * (0.7 + Math.random() * 0.6);
      const r = Math.random();
      const kind = r < 0.035 ? 'hp' : (r < 0.72 ? 'bad' : 'good');
      const BAD = ['SQLi', 'XSS', 'DDoS', '0DAY', 'BOT', 'RCE', 'MITM', 'WORM'];
      const GOOD = ['DNS', 'ACK', 'TLS', 'NTP', 'SSH', 'HTTP'];
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      a.pk.push({ x: 18 + Math.random() * (W - 36), y: -8, vy: 20 + a.wave * 6 + Math.random() * 12, kind: kind, lab: kind === 'hp' ? '+HP' : (kind === 'bad' ? pick(BAD) : pick(GOOD)), ph: Math.random() * 6.28, amp: kind === 'bad' ? 6 + Math.random() * 10 : 3 });
    }
    for (let i = a.pk.length - 1; i >= 0; i--) {
      const p = a.pk[i];
      p.y += p.vy * s;
      p.ph += s * 2;
      const x = Math.max(16, Math.min(W - 16, p.x + Math.sin(p.ph) * p.amp));
      p.cx = x;
      let hit = false;
      for (let j = a.bl.length - 1; j >= 0; j--) {
        const b = a.bl[j];
        if (Math.abs(b.x - x) < 16 && Math.abs(b.y - p.y) < 9) {
          a.bl.splice(j, 1);
          hit = true;
          break;
        }
      }
      if (hit) {
        a.pk.splice(i, 1);
        if (p.kind === 'bad') {
          a.score += 100;
          a.resolved += 1;
          this.arcBurst(a, x, p.y, '#F0CE6A');
          this.sfx('hit');
        } else if (p.kind === 'good') {
          a.score = Math.max(0, a.score - 150);
          a.resolved += 1;
          a.msg = 'FALSO POSITIVO −150';
          a.msgT = 1.1;
          a.flash = 0.25;
          this.arcBurst(a, x, p.y, '#8FD3A6');
          this.sfx('error');
        } else {
          a.lives = Math.min(5, a.lives + 1);
          a.score += 50;
          a.msg = 'PATCH APLICADO +1 ESCUDO';
          a.msgT = 1.2;
          this.arcBurst(a, x, p.y, '#E8E4D4');
          this.sfx('unlock');
        }
        continue;
      }
      if (p.y > H - 16) {
        a.pk.splice(i, 1);
        if (p.kind === 'bad') {
          a.lives -= 1;
          a.resolved += 1;
          a.flash = 0.45;
          a.msg = 'VAZOU: ' + p.lab;
          a.msgT = 1.1;
          this.sfx('breach');
        } else if (p.kind === 'good') {
          a.score += 25;
          a.resolved += 1;
        }
        continue;
      }
      if (p.kind === 'bad' && p.y > H - 38 && Math.abs(x - a.px) < 20) {
        a.pk.splice(i, 1);
        a.lives -= 1;
        a.resolved += 1;
        a.flash = 0.45;
        a.msg = 'IMPACTO!';
        a.msgT = 1;
        this.arcBurst(a, x, p.y, '#E04A3A');
        this.sfx('breach');
      }
    }
    if (a.resolved >= a.wave * 22) {
      a.wave += 1;
      a.msg = 'ONDA ' + a.wave;
      a.msgT = 1.6;
      this.sfx('ready');
    }
    a.fx.forEach((f) => {
      f.x += f.vx * s;
      f.y += f.vy * s;
      f.vy += 160 * s;
      f.life -= s;
    });
    a.fx = a.fx.filter((f) => f.life > 0);
    if (a.msgT > 0) a.msgT -= s;
    if (a.flash > 0) a.flash -= s;
    const fk = Math.min(3, Math.floor(a.score / 1000));
    while ((a.fk || 0) < fk) {
      a.fk = (a.fk || 0) + 1;
      if (this.fichaGain('arcade')) {
        a.msg = '+1 FICHA';
        a.msgT = 1.2;
      }
    }
    if (a.score >= 3000) this.unlock('arcade');
    if (a.lives <= 0) this.arcOver(a);
  }

  arcBurst(a, x, y, c) {
    for (let i = 0; i < 10; i++) a.fx.push({ x: x, y: y, vx: (Math.random() - 0.5) * 140, vy: (Math.random() - 0.9) * 110, life: 0.45 + Math.random() * 0.3, c: c });
  }

  arcOver(a) {
    a.mode = 'over';
    a.keys = {};
    a.lockT = a.t + 0.9;
    this.sfx('gameover');
    const rank = this.arcHi().findIndex((r) => a.score > r[1]);
    if (a.score > 0 && rank >= 0) {
      a.mode = 'ini';
      a.rank = rank;
      a.ini = [0, 0, 0];
      a.iniPos = 0;
    }
    this.setState({ arcMode: a.mode });
    this.persistSoon();
  }

  arcIniKey(k) {
    const a = this._arc;
    if (!a) return;
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    if (k === 'ArrowUp' || k === 'r') a.ini[a.iniPos] = (a.ini[a.iniPos] + 1) % L.length;
    else if (k === 'ArrowDown' || k === 'l') a.ini[a.iniPos] = (a.ini[a.iniPos] + L.length - 1) % L.length;
    else if (k === 'ArrowLeft') a.iniPos = Math.max(0, a.iniPos - 1);
    else if (k === 'ArrowRight' || k === 'Enter' || k === ' ' || k === 'f') {
      if (a.iniPos < 2) a.iniPos += 1;
      else {
        this.arcSaveIni(a);
        return;
      }
    } else if (k.length === 1 && L.indexOf(k.toUpperCase()) >= 0) {
      a.ini[a.iniPos] = L.indexOf(k.toUpperCase());
      if (a.iniPos < 2) a.iniPos += 1;
    } else return;
    this.sfx('key');
  }

  arcSaveIni(a) {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const name = a.ini.map((i) => L.charAt(i)).join('');
    const hi = this.arcHi().slice();
    hi.splice(a.rank, 0, [name, a.score]);
    this._arcHi = hi.slice(0, 5);
    a.mode = 'over';
    a.rank = -1;
    a.lockT = a.t + 0.4;
    this.sfx('coin');
    this.persist(true);
    this.setState({ arcMode: 'over', arcTick: Date.now() });
  }

  loopArcade(dt) {
    const a = this._arc;
    if (!a) return;
    const s = Math.min(0.05, Math.max(0, dt) / 1000);
    if (a.mode === 'play' && !a.paused) this.arcStep(a, s);
    a.t += s;
    if (this._arcCv) this.arcDraw(a, this._arcCv);
  }

  arcDraw(a, cv) {
    const ctx = cv.getContext ? cv.getContext('2d') : null;
    if (!ctx) return;
    const S = cv.width / 320;
    const font = (px) => px + 'px "DotGothic16", "JetBrains Mono", monospace';
    const pad = (n) => String(n).padStart(6, '0');
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.fillStyle = '#050806';
    ctx.fillRect(0, 0, 320, 240);
    ctx.strokeStyle = 'rgba(143,211,166,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= 320; x += 20) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, 240); }
    for (let y = 0; y <= 240; y += 20) { ctx.moveTo(0, y + 0.5); ctx.lineTo(320, y + 0.5); }
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(98,179,127,0.7)';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, 224.5);
    ctx.lineTo(320, 224.5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = font(7);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(143,211,166,0.8)';
    this.canvasText(ctx, 'LAN 10.0.0.0/24', 4, 232);
    const blink = Math.floor(a.t * 2.4) % 2 === 0;
    const hiTable = (y0) => {
      ctx.font = font(9);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#A3AD9F';
      this.canvasText(ctx, 'RECORDES', 160, y0);
      this.arcHi().forEach((r, i) => {
        ctx.fillStyle = i === 0 ? '#F0CE6A' : '#E8E4D4';
        this.canvasText(ctx, (i + 1) + '.  ' + r[0] + '   ' + pad(r[1]), 160, y0 + 13 + i * 11);
      });
    };
    if (a.mode === 'title') {
      ctx.textAlign = 'center';
      ctx.font = font(22);
      ctx.fillStyle = '#F0CE6A';
      this.canvasText(ctx, 'PACKET INVADERS', 160, 34);
      ctx.font = font(9);
      ctx.fillStyle = '#E8E4D4';
      this.canvasText(ctx, 'defenda a LAN: derrube o malicioso, deixe passar o legítimo', 160, 54);
      hiTable(82);
      return;
    }
    a.pk.forEach((p) => {
      const x = (p.cx != null ? p.cx : p.x) - 15;
      const y = p.y - 6;
      const c = p.kind === 'bad' ? ['#3A2A0C', '#F0CE6A'] : (p.kind === 'good' ? ['#10301D', '#8FD3A6'] : ['#2A2A2A', '#E8E4D4']);
      ctx.fillStyle = c[0];
      ctx.fillRect(x, y, 30, 12);
      ctx.strokeStyle = c[1];
      ctx.strokeRect(x + 0.5, y + 0.5, 29, 11);
      ctx.fillStyle = c[1];
      ctx.font = font(8);
      ctx.textAlign = 'center';
      this.canvasText(ctx, p.lab, x + 15, y + 6.5);
    });
    ctx.fillStyle = '#F0CE6A';
    a.bl.forEach((b) => ctx.fillRect(b.x - 1, b.y - 4, 2, 6));
    if (a.mode === 'play') {
      const px = a.px;
      const py = 212;
      ctx.fillStyle = '#62B37F';
      ctx.beginPath();
      ctx.moveTo(px, py - 9);
      ctx.lineTo(px + 11, py - 5);
      ctx.lineTo(px + 11, py + 2);
      ctx.lineTo(px, py + 8);
      ctx.lineTo(px - 11, py + 2);
      ctx.lineTo(px - 11, py - 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0A0F0B';
      ctx.fillRect(px - 3, py - 3, 6, 5);
      ctx.fillStyle = '#F0CE6A';
      ctx.fillRect(px - 1, py - 15, 2, 7);
    }
    a.fx.forEach((f) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2));
      ctx.fillStyle = f.c;
      ctx.fillRect(f.x, f.y, 2, 2);
    });
    ctx.globalAlpha = 1;
    ctx.font = font(9);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#E8E4D4';
    this.canvasText(ctx, 'SCORE ' + pad(a.score), 6, 9);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#F0CE6A';
    this.canvasText(ctx, 'HI ' + pad(Math.max(a.score, this.arcHi()[0][1])), 314, 9);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8FD3A6';
    this.canvasText(ctx, 'ONDA ' + a.wave, 160, 9);
    for (let i = 0; i < Math.max(0, a.lives); i++) {
      ctx.fillStyle = '#62B37F';
      ctx.fillRect(6 + i * 9, 17, 6, 5);
    }
    if (a.msgT > 0 && a.mode === 'play') {
      ctx.globalAlpha = Math.min(1, a.msgT * 2);
      ctx.font = font(12);
      ctx.fillStyle = '#F0CE6A';
      this.canvasText(ctx, a.msg, 160, 110);
      ctx.globalAlpha = 1;
    }
    if (a.flash > 0) {
      ctx.fillStyle = 'rgba(224,74,58,' + Math.min(0.35, a.flash).toFixed(2) + ')';
      ctx.fillRect(0, 0, 320, 240);
    }
    if (a.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, 320, 240);
      ctx.font = font(18);
      ctx.fillStyle = '#F0CE6A';
      this.canvasText(ctx, 'PAUSADO', 160, 112);
      ctx.font = font(9);
      ctx.fillStyle = '#E8E4D4';
      this.canvasText(ctx, 'P volta ao jogo', 160, 132);
    }
    if (a.mode === 'over' || a.mode === 'ini') {
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(0, 0, 320, 240);
      ctx.textAlign = 'center';
      ctx.font = font(18);
      ctx.fillStyle = a.mode === 'ini' ? '#F0CE6A' : '#E04A3A';
      this.canvasText(ctx, a.mode === 'ini' ? 'NOVO RECORDE!' : 'A LAN CAIU', 160, 40);
      ctx.font = font(10);
      ctx.fillStyle = '#E8E4D4';
      this.canvasText(ctx, 'pontos ' + pad(a.score) + ' · onda ' + a.wave, 160, 60);
      if (a.mode === 'ini') {
        const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        this.canvasText(ctx, 'suas iniciais', 160, 88);
        a.ini.forEach((ci, i) => {
          const x = 136 + i * 24;
          ctx.font = font(20);
          ctx.fillStyle = i === a.iniPos ? (blink ? '#F0CE6A' : '#8A7A40') : '#E8E4D4';
          this.canvasText(ctx, L.charAt(ci), x, 114);
          if (i === a.iniPos) ctx.fillRect(x - 7, 126, 14, 2);
        });
        ctx.font = font(9);
        ctx.fillStyle = '#A3AD9F';
        this.canvasText(ctx, '↑ ↓ ou os botões de seta trocam a letra', 160, 150);
        this.canvasText(ctx, 'ENTER ou ATIRAR confirma', 160, 164);
      } else {
        hiTable(92);
      }
    }
  }

  // ---- the other controllers on Sobre, each with its own little game on the LCD ----
  // Everything is played with the mouse, one click per input: the joystick crosses a road, the two-button
  // The classic board keeps crossing and crate puzzles; new cartridges live in pocket-games.js.
  ctlList() {
    return [
      { k: 'gb', name: 'Game Boy', game: 'Blocos de bolso', hint: '' },
      { k: 'atari', name: 'Joystick clássico', game: 'Travessia', hint: 'stick anda · botão começa' },
      { k: 'sms', name: 'Pad 8-bit', game: 'Empurra-caixa', hint: 'direcional empurra · 1 reinicia · 2 avança' },
      { k: 'n64', name: 'Analógico (estilo N64)', game: 'Melodia 64', hint: '' },
      { k: 'pad', name: 'Pad moderno', game: 'Estrada', hint: '' }
    ];
  }

  ctlIdx() {
    const k = this.st().ctl || 'hitbox';
    const i = this.ctlList().findIndex((c) => c.k === k);
    return i < 0 ? 0 : i;
  }

  ctlStep(dir) {
    const L = this.ctlList();
    const k = L[(this.ctlIdx() + dir + L.length) % L.length].k;
    this.ctlSet(k);
  }

  ctlSet(k) {
    if ((this.st().ctl || 'hitbox') === k) return;
    if (this._snake && this._snake.mode !== 'off') this._snake.mode = 'off';
    this._menuResume = false;
    this._mini = ['atari','sms'].includes(k) ? this.miniNew(k) : null;
    this._pad = [];
    this.sfx('select');
    this.setState({ ctl: k, lcdMenu: false, lcdList: false, padFx: null, padSeq: [], snakeMode: 'off', miniMode: this._mini ? this._mini.mode : 'off' });
    this.startLoop();
  }

  miniHi(k) {
    return (this._miniHi || {})[k] || 0;
  }

  miniSetHi(k, v) {
    if (v <= this.miniHi(k)) return;
    const add = {};
    add[k] = v;
    this._miniHi = Object.assign({}, this._miniHi || {}, add);
    this.persistSoon();
  }

  miniNew(k) {
    const g = { kind: k, mode: 'title', t: 0, flash: 0, score: 0, msg: '', msgT: 0 };
    if (k === 'atari') Object.assign(g, { frog: [10, 9], lives: 3, lanes: this.frogLanes(1) });
    else if (k === 'sms') Object.assign(g, this.sokoLoad(0));
    return g;
  }

  miniStart() {
    const g = this._mini;
    if (!g) return;
    const k = g.kind;
    this._mini = this.miniNew(k);
    this._mini.mode = 'play';
    this.sfx('start');
    this.setState({ miniMode: 'play' });
    this.startLoop();
  }

  miniOver(g, msg) {
    g.mode = 'over';
    g.msg = msg || '';
    g.flash = 0.5;
    g.lockT = g.t + 0.6;
    this.miniSetHi(g.kind, g.kind === 'sms' ? g.level + 1 : (g.kind === 'pad' ? g.round : g.score));
    this.sfx('gameover');
    this.setState({ miniMode: 'over' });
  }

  // every button of the four pads lands here: U D L R, A B (fire / 1 / 2 / face buttons), S (start)
  miniIn(k) {
    const g = this._mini;
    if (!g) return;
    if (g.mode !== 'play') {
      if (g.t < (g.lockT || 0)) return;
      const starts = { atari: 'A', sms: 'A', n64: 'A', pad: 'S' }[g.kind];
      if (k === starts || (g.kind === 'sms' && k === 'B') || (g.kind === 'pad' && g.mode === 'title' && k === 'S')) {
        if (g.kind === 'sms' && g.mode === 'win') {
          this.sokoNext();
          return;
        }
        this.miniStart();
      } else this.sfx('key');
      return;
    }
    if (g.kind === 'atari') this.frogIn(g, k);
    else if (g.kind === 'sms') this.sokoIn(g, k);
  }

  loopMini(dt) {
    const g = this._mini;
    if (!g || (this.st().ctl || 'hitbox') === 'gb') return;
    const s = this.state || {};
    const step = Math.min(0.05, Math.max(0, dt) / 1000);
    if (g.mode === 'play' && !s.paused && this.curPage() === 'sobre') {
      if (g.kind === 'atari') this.frogStep(g, step);
    }
    g.t += step;
    if (g.flash > 0) g.flash -= step;
    if (g.msgT > 0) g.msgT -= step;
    if (this._lcdCv) this.miniDraw(g, this._lcdCv);
  }

  // ---- Travessia: a frog, eight lanes of traffic, one hop per click ----
  frogLanes(round) {
    const L = [];
    for (let i = 0; i < 8; i++) {
      const y = 1 + i;
      const dir = i % 2 ? -1 : 1;
      const speed = (14 + (i * 7) % 20) * (1 + (round - 1) * 0.12);
      const w = i % 3 === 1 ? 3 : 2;
      const cars = [];
      const n = 2 + (i % 2);
      for (let c = 0; c < n; c++) cars.push((c * 160) / n + (i * 23) % 40);
      L.push({ y: y, dir: dir, speed: speed, w: w, cars: cars, col: ['#E04A3A', '#7FB2DA', '#F0CE6A', '#E8E4D4', '#C8A0E0'][i % 5] });
    }
    return L;
  }

  frogIn(g, k) {
    const D = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[k];
    if (!D) {
      this.sfx('key');
      return;
    }
    const nx = Math.max(0, Math.min(19, g.frog[0] + D[0]));
    const ny = Math.max(0, Math.min(9, g.frog[1] + D[1]));
    g.frog = [nx, ny];
    this.sfx('blip');
    if (ny === 0) {
      g.score += 1;
      g.msg = 'ATRAVESSOU!';
      g.msgT = 0.9;
      g.frog = [10, 9];
      g.lanes = this.frogLanes(1 + g.score);
      this.sfx(g.score % 5 === 0 ? 'coin' : 'pop');
      if (g.score === 5) this.fichaGain('mini');
    }
  }

  frogStep(g, s) {
    g.lanes.forEach((ln) => {
      ln.cars = ln.cars.map((x) => {
        let v = x + ln.dir * ln.speed * s;
        if (v > 160 + ln.w * 8) v -= 160 + ln.w * 8 + 8;
        if (v < -ln.w * 8 - 8) v += 160 + ln.w * 8 + 8;
        return v;
      });
    });
    const fx0 = g.frog[0] * 8 + 1;
    const fx1 = fx0 + 6;
    const ln = g.lanes.find((l) => l.y === g.frog[1]);
    if (ln && ln.cars.some((x) => fx0 < x + ln.w * 8 - 1 && fx1 > x + 1)) {
      g.lives -= 1;
      g.flash = 0.4;
      g.frog = [10, 9];
      this.sfx('hit');
      if (g.lives <= 0) this.miniOver(g, 'ATROPELADO');
    }
  }

  // ---- Empurra-caixa: tiny sokoban levels, one push per click ----
  sokoLevels() {
    return [
      ['#######', '#  .  #', '#  $  #', '#  @  #', '#     #', '#######'],
      ['#######', '#.   .#', '# $ $ #', '#  @  #', '#     #', '#######'],
      ['#######', '#  .  #', '#  $  #', '# $@$ #', '# . . #', '#######'],
      ['#######', '#.  # #', '# $$  #', '#  @ .#', '# #   #', '#######'],
      ['#######', '# .   #', '# #$# #', '#  @$.#', '#     #', '#######']
    ];
  }

  sokoLoad(i) {
    const L = this.sokoLevels()[i];
    const walls = {};
    const goals = [];
    const boxes = [];
    let pl = [1, 1];
    L.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row.charAt(x);
        if (c === '#') walls[x + ',' + y] = true;
        if (c === '.' || c === '*') goals.push([x, y]);
        if (c === '$' || c === '*') boxes.push([x, y]);
        if (c === '@') pl = [x, y];
      }
    });
    return { level: i, walls: walls, goals: goals, boxes: boxes, pl: pl, moves: 0, w: L[0].length, h: L.length };
  }

  sokoIn(g, k) {
    const D = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[k];
    if (k === 'A') {
      Object.assign(g, this.sokoLoad(g.level));
      this.sfx('select');
      return;
    }
    if (!D) {
      this.sfx('key');
      return;
    }
    const nx = g.pl[0] + D[0];
    const ny = g.pl[1] + D[1];
    if (g.walls[nx + ',' + ny]) {
      this.sfx('bump');
      return;
    }
    const bi = g.boxes.findIndex((b) => b[0] === nx && b[1] === ny);
    if (bi >= 0) {
      const bx = nx + D[0];
      const by = ny + D[1];
      if (g.walls[bx + ',' + by] || g.boxes.some((b) => b[0] === bx && b[1] === by)) {
        this.sfx('bump');
        return;
      }
      g.boxes = g.boxes.map((b, i) => (i === bi ? [bx, by] : b));
    }
    g.pl = [nx, ny];
    g.moves += 1;
    this.sfx(bi >= 0 ? 'key' : 'blip');
    if (g.goals.every((q) => g.boxes.some((b) => b[0] === q[0] && b[1] === q[1]))) {
      g.mode = 'win';
      g.lockT = g.t + 0.4;
      g.msg = 'NÍVEL ' + (g.level + 1) + ' OK';
      this.miniSetHi('sms', g.level + 1);
      this.sfx(g.level + 1 >= this.sokoLevels().length ? 'trophy' : 'unlock');
      if (g.level + 1 >= this.sokoLevels().length) this.fichaGain('mini');
      this.setState({ miniMode: 'win' });
    }
  }

  sokoNext() {
    const g = this._mini;
    if (!g || g.kind !== 'sms') return;
    const n = (g.level + 1) % this.sokoLevels().length;
    Object.assign(g, this.sokoLoad(n), { mode: 'play', msg: '', flash: 0 });
    this.sfx('start');
    this.setState({ miniMode: 'play' });
  }

  

  

  

  

  

  

  miniDraw(g, cv) {
    const ctx = cv.getContext ? cv.getContext('2d') : null;
    if (!ctx) return;
    const S = cv.width / 160;
    const font = (px) => px + 'px "DotGothic16", "JetBrains Mono", monospace';
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.clearRect(0, 0, 160, 96);
    const hud = (l, r) => {
      ctx.textBaseline = 'middle';
      ctx.font = font(7);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#A3AD9F';
      this.canvasText(ctx, l, 2, 4.5);
      ctx.textAlign = 'right';
      this.canvasText(ctx, r, 158, 4.5);
    };
    const R = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };
    if (g.mode === 'title') return;
    if (g.kind === 'atari') {
      hud('TRAVESSIAS ' + g.score + ' · VIDAS ' + g.lives, 'RECORDE ' + Math.max(this.miniHi('atari'), g.score));
      R(0, 8, 160, 8, 'rgba(143,211,166,0.12)');
      for (let i = 0; i < 5; i++) R(8 + i * 32, 10, 12, 4, '#62B37F');
      R(0, 80, 160, 8, 'rgba(232,228,212,0.08)');
      g.lanes.forEach((ln) => {
        R(0, 8 + ln.y * 8, 160, 8, ln.y % 2 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.12)');
        for (let x = ((g.t * 10) % 16); x < 160; x += 16) R(x, 8 + ln.y * 8 + 3.5, 6, 1, 'rgba(232,228,212,0.12)');
        ln.cars.forEach((x) => {
          R(x + 1, 8 + ln.y * 8 + 1, ln.w * 8 - 2, 6, ln.col);
          R(ln.dir > 0 ? x + ln.w * 8 - 3 : x + 1, 8 + ln.y * 8 + 2, 2, 4, '#050706');
        });
      });
      const fx = g.frog[0] * 8;
      const fy = 8 + g.frog[1] * 8;
      R(fx + 1, fy + 1, 6, 6, g.flash > 0 ? '#E04A3A' : '#8FD3A6');
      R(fx + 2, fy + 2, 1, 1, '#050706');
      R(fx + 5, fy + 2, 1, 1, '#050706');
    } else if (g.kind === 'sms') {
      hud('NÍVEL ' + (g.level + 1) + '/' + this.sokoLevels().length + ' · ' + g.moves + ' PASSOS', 'MELHOR NÍVEL ' + Math.max(this.miniHi('sms'), g.level + (g.mode === 'win' ? 1 : 0)));
      const cs = 12;
      const ox = Math.floor((160 - g.w * cs) / 2);
      const oy = 10 + Math.floor((76 - g.h * cs) / 2);
      for (let y = 0; y < g.h; y++) {
        for (let x = 0; x < g.w; x++) {
          if (g.walls[x + ',' + y]) {
            R(ox + x * cs, oy + y * cs, cs, cs, '#1B3326');
            R(ox + x * cs + 1, oy + y * cs + 1, cs - 2, cs - 2, '#2A4A38');
          } else R(ox + x * cs, oy + y * cs, cs, cs, 'rgba(143,211,166,0.05)');
        }
      }
      g.goals.forEach((q) => {
        R(ox + q[0] * cs + 4, oy + q[1] * cs + 4, cs - 8, cs - 8, 'rgba(240,206,106,0.45)');
      });
      g.boxes.forEach((b) => {
        const on = g.goals.some((q) => q[0] === b[0] && q[1] === b[1]);
        R(ox + b[0] * cs + 1, oy + b[1] * cs + 1, cs - 2, cs - 2, on ? '#F0CE6A' : '#B8863C');
        R(ox + b[0] * cs + 3, oy + b[1] * cs + 3, cs - 6, cs - 6, on ? '#D8B24A' : '#8C6430');
      });
      R(ox + g.pl[0] * cs + 2, oy + g.pl[1] * cs + 2, cs - 4, cs - 4, '#8FD3A6');
      R(ox + g.pl[0] * cs + 4, oy + g.pl[1] * cs + 4, 1, 1, '#050706');
      R(ox + g.pl[0] * cs + 7, oy + g.pl[1] * cs + 4, 1, 1, '#050706');
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (g.msgT > 0 && g.mode === 'play') {
      ctx.font = font(9);
      ctx.fillStyle = '#F0CE6A';
      this.canvasText(ctx, g.msg, 80, 50);
    }
    if (g.mode === 'over' || g.mode === 'win') {
      R(0, 8, 160, 80, 'rgba(5,8,6,0.74)');
      ctx.font = font(11);
      ctx.fillStyle = g.mode === 'win' ? '#8FD3A6' : '#E04A3A';
      this.canvasText(ctx, g.mode === 'win' ? g.msg : 'FIM DE JOGO', 80, 40);
      ctx.font = font(7);
      ctx.fillStyle = '#E8E4D4';
      this.canvasText(ctx, g.mode === 'win' ? (g.level + 1 >= this.sokoLevels().length ? 'todos os níveis · 2 recomeça' : '2 vai pro próximo') : g.msg + ' · ' + { atari: 'botão', sms: '1', n64: 'A', pad: 'start' }[g.kind] + ' de novo', 80, 55);
    }
    if (g.flash > 0) {
      ctx.fillStyle = 'rgba(224,74,58,' + Math.min(0.4, g.flash).toFixed(2) + ')';
      ctx.fillRect(0, 0, 160, 96);
    }
  }

  // ---- the skill tree (Sobre, and the chart on the room wall) ----
  skOpen() {
    if (this.st().skOpen) return;
    this._skWrap = null;
    this.setState({ skOpen: true, rmDlg: false, paused: false, palOpen: false, troOpen: false, achOpen: false, recOpen: false });
    this.sfx('open');
  }

  skClose() {
    if (!this.st().skOpen) return;
    this.setState({ skOpen: false });
    this.focusRoot();
  }

  skPick(k) {
    if (this.st().skSel === k) return;
    this.sfx('blip');
    this.setState({ skSel: k });
  }

  // node positions: the root on top, one column per branch, the dark node at the foot of each
  skLayout() {
    if (this._skL) return this._skL;
    const S = this.data().skills;
    const nodes = [];
    const links = [];
    const heads = [];
    const cols = [55, 165, 275, 385];
    const rootX = 220;
    const rootY = 20;
    nodes.push({ k: 'root', x: rootX, y: rootY, label: S.root.label, full: S.root.full, desc: S.root.desc, cls: 'is-root', tx: 16, ta: 'start' });
    S.branches.forEach((b, bi) => {
      const x = cols[bi];
      heads.push({ x: x, y: 64, t: b.name });
      links.push({ d: 'M' + rootX + ' ' + (rootY + 10) + ' V44 H' + x + ' V54', cls: 'is-on' });
      links.push({ d: 'M' + x + ' 72 V82', cls: 'is-on' });
      b.nodes.forEach((n, i) => {
        const y = 92 + i * 44;
        nodes.push({ k: n.k, x: x, y: y, label: n.label, full: n.full, desc: n.desc, cls: 'is-on', tx: 16, ta: 'start' });
        if (i > 0) links.push({ d: 'M' + x + ' ' + (y - 34) + ' V' + (y - 10), cls: 'is-on' });
      });
      const ly = 92 + b.nodes.length * 44;
      nodes.push({ k: b.k + '-next', x: x, y: ly, label: S.locked.label, full: S.locked.full, desc: S.locked.desc, cls: 'is-lock', tx: 16, ta: 'start' });
      links.push({ d: 'M' + x + ' ' + (ly - 34) + ' V' + (ly - 10), cls: 'is-lock' });
    });
    // the last column's labels run off the right edge: they go on the left of the node
    nodes.forEach((n) => { if (n.x === cols[3]) { n.tx = -16; n.ta = 'end'; } });
    this._skL = { nodes: nodes, links: links, heads: heads };
    return this._skL;
  }

  // ---- the d20 on the Magic table: a tabletop skill check, Baldur's Gate rules ----
  // The PO hands over a task with a difficulty (DC). Okaru's areas give a bonus (up to +3) or a
  // penalty (down to -3); some situations grant advantage (two dice, keep the higher) or
  // disadvantage (keep the lower). A natural 20 is a critical success and a natural 1 a critical
  // failure, whatever the numbers say; modifiers are not applied to either.
  d20Open() {
    if (this.st().dOpen) return;
    this._dWrap = null;
    this._dTask = this.d20Pick();
    this.setState({ dOpen: true, dRoll: null, dTask: this._dTask, dOpener: Math.floor(Math.random() * this.data().d20Openers.length), paused: false, palOpen: false, troOpen: false, achOpen: false, recOpen: false, rmDlg: false });
    this.sfx('open');
    this.startLoop();
  }

  d20Close() {
    if (!this.st().dOpen) return;
    clearTimeout(this._dT);
    this.setState({ dOpen: false, dRoll: null });
    this.focusRoot();
  }

  d20Pick() {
    const T = this.data().d20Tasks;
    let k = Math.floor(Math.random() * T.length);
    if (T.length > 1 && k === this._dLast) k = (k + 1) % T.length;
    this._dLast = k;
    return k;
  }

  d20Mod(task) {
    const a = this.data().d20Areas[task.area];
    return Math.max(-3, Math.min(3, a ? a[1] : 0));
  }

  // rolls (two dice with advantage or disadvantage); the faces flicker for a moment before settling
  d20Roll() {
    const s = this.st();
    if (!s.dOpen) return;
    if (s.dRoll && s.dRoll.phase === 'rolling') return;
    if (s.dRoll && s.dRoll.phase === 'done') {
      this._dTask = this.d20Pick();
      this.setState({ dRoll: null, dTask: this._dTask, dOpener: Math.floor(Math.random() * this.data().d20Openers.length) });
      this.sfx('key');
      return;
    }
    const task = this.data().d20Tasks[this._dTask];
    const two = task.adv !== 0 && task.adv !== undefined;
    const a = 1 + Math.floor(Math.random() * 20);
    const b = two ? 1 + Math.floor(Math.random() * 20) : 0;
    const use = two ? (task.adv > 0 ? Math.max(a, b) : Math.min(a, b)) : a;
    const mod = this.d20Mod(task);
    const crit = use === 20 ? 1 : (use === 1 ? -1 : 0);
    const total = crit ? use : use + mod;
    const ok = crit === 1 || (crit === 0 && total >= task.dc);
    const final = { phase: 'rolling', a: a, b: b, two: two, use: use, mod: mod, total: total, ok: ok, crit: crit, dc: task.dc, fa: a, fb: b, tick: 0 };
    this.sfx('dice');
    this.setState({ dRoll: final });
    clearTimeout(this._dT);
    const spin = (n) => {
      this._dT = setTimeout(() => {
        const r = this.st().dRoll;
        if (!r || r.phase !== 'rolling') return;
        if (n >= 12) {
          this.d20Land(Object.assign({}, r, { phase: 'done', fa: a, fb: b }));
          return;
        }
        this.setState({ dRoll: Object.assign({}, r, { fa: 1 + Math.floor(Math.random() * 20), fb: 1 + Math.floor(Math.random() * 20), tick: n }) });
        if (n % 3 === 0) this.sfx('blip');
        spin(n + 1);
      }, 55 + n * 9);
    };
    spin(1);
  }

  d20Land(r) {
    this.setState({ dRoll: r, dReact: Math.floor(Math.random() * 3) });
    if (r.crit === 1) {
      this.sfx('trophy');
      this.unlock('nat20');
    } else if (r.crit === -1) this.sfx('gameover');
    else this.sfx(r.ok ? 'unlock' : 'error');
  }

  d20Key(e) {
    const k = e.key || '';
    if (k === 'Escape') {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      this.d20Close();
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'r' || k === 'R') {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      if (!e.repeat) this.d20Roll();
    }
  }

  // ---- the PC: sit in the chair and play SEM CONEXÃO ----
  // An offline runner (a nod to the browser's no-internet game): the little robot from the workbench
  // runs along a circuit board, jumps resistors, LEDs, capacitors and chips, ducks the flying bugs and
  // grabs stray Wi-Fi for points. Every 100 points pings, the board goes dark at 700, and 500 points
  // pay one ficha (once per save).
  pcSit() {
    if (this.curPage() !== 'quarto' || this.st().pcOpen) return;
    const rm = this.rmInit();
    const c = this.data().room.find((o) => o.id === 'cadeira');
    rm.held = [];
    rm.path = [];
    rm.goal = -1;
    if (!rm.sit) rm.sit = { back: [rm.x, rm.y, rm.dir], at: c ? [c.t[0], c.t[1]] : [21, 3], t0: rm.clock, out: 0 };
    this.sfx('sit');
    clearTimeout(this._pcT);
    this._pcT = setTimeout(() => this.openPc(), 480);
  }

  openPc() {
    if (this.st().pcOpen || this.curPage() !== 'quarto') return;
    this._pcWrap = null;
    this._pc = this.pcNew();
    this.setState({ pcOpen: true, rmDlg: false, paused: false, palOpen: false, troOpen: false, achOpen: false, recOpen: false });
    this.startLoop();
  }

  closePc() {
    clearTimeout(this._pcT);
    this._pc = null;
    this._pcCv = null;
    if (this.st().pcOpen) this.setState({ pcOpen: false });
    this.pcStand(false);
    this.focusRoot();
    this.persistSoon();
  }

  // he hops back off the chair (now: at once, e.g. when he has to walk out of the room)
  pcStand(now) {
    const rm = this._rm;
    if (!rm || !rm.sit) return;
    if (now) {
      rm.dir = rm.sit.back[2] || rm.dir;
      rm.sit = null;
      return;
    }
    if (!rm.sit.out) {
      rm.sit.out = Math.max(1, rm.clock);
      this.sfx('sit');
    }
  }

  pcNew() {
    return { mode: 'title', t: 0, lockT: 0, score: 0, spd: 150, h: 0, vy: 0, air: false, duck: false, keys: {}, ob: [], sig: [], fx: [], next: 240, sigNext: 3, night: 0, pinged: 0, flash: 0, bg: 0, paused: false, msg: '', msgT: 0, ficha: false, newHi: false, dead: 0 };
  }

  pcStart() {
    const g = this._pc;
    if (!g) return;
    Object.assign(g, { mode: 'play', score: 0, spd: 150, h: 0, vy: 0, air: false, duck: false, keys: {}, ob: [], sig: [], fx: [], next: 240, sigNext: 3, pinged: 0, flash: 0, paused: false, msg: '', msgT: 0, newHi: false, dead: 0 });
    this.sfx('start');
  }

  pcMap(k) {
    return { ' ': 'j', Enter: 'j', ArrowUp: 'j', w: 'j', W: 'j', ArrowDown: 'd', s: 'd', S: 'd' }[k] || '';
  }

  // jump ('j') and duck ('d'), from the keyboard, the canvas and the touch buttons
  pcPress(m, down) {
    const g = this._pc;
    if (!g) return;
    if (!down) {
      g.keys[m] = false;
      // let go early for a short hop
      if (m === 'j' && g.air && g.vy > 190) g.vy = 190;
      if (m === 'd') g.duck = false;
      return;
    }
    if (g.mode !== 'play') {
      if (m === 'j' && g.t >= g.lockT) {
        this.pcStart();
        this.pcPress('j', true);
      }
      return;
    }
    if (g.paused) return;
    g.keys[m] = true;
    if (m === 'j' && !g.air) {
      g.air = true;
      g.vy = 430;
      g.duck = false;
      this.sfx('jump');
    }
    if (m === 'd') {
      if (!g.duck && !g.air) this.sfx('duck');
      g.duck = true;
    }
  }

  pcKey(e) {
    const g = this._pc;
    if (!g) return;
    const k = e.key || '';
    const stop = () => {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    };
    if (k === 'Escape') {
      stop();
      this.closePc();
      return;
    }
    if (k === 'p' || k === 'P') {
      stop();
      if (g.mode === 'play') {
        g.paused = !g.paused;
        g.keys = {};
        g.duck = false;
        this.sfx(g.paused ? 'pause' : 'unpause');
      }
      return;
    }
    const m = this.pcMap(k);
    if (!m) return;
    stop();
    if (!e.repeat) this.pcPress(m, true);
  }

  pcKeyUp(e) {
    const m = this.pcMap(e.key || '');
    if (m) this.pcPress(m, false);
  }

  pcStep(g, s) {
    const W = 300;
    g.spd = Math.min(340, g.spd + 4.5 * s);
    const dx = g.spd * s;
    g.bg += dx;
    g.score += dx * 0.1;
    // the jump: hold for a higher one, hold down to drop fast
    if (g.air) {
      g.vy -= (g.keys.d ? 3600 : 1600) * s;
      g.h += g.vy * s;
      if (g.h <= 0) {
        g.h = 0;
        g.vy = 0;
        g.air = false;
        g.duck = !!g.keys.d;
      }
    }
    // components roll in from the right; bugs fly in a little faster
    g.next -= dx;
    if (g.next <= 0) {
      const pool = ['res', 'led', 'cap'];
      if (g.score > 150) pool.push('ic', 'caps');
      let k = pool[Math.floor(Math.random() * pool.length)];
      if (g.score > 300 && Math.random() < 0.28) k = 'bug';
      // from 120 points on, a wire hangs down over the trace: too wide to jump, so he has to duck
      if (g.score > 120 && Math.random() < (g.score > 300 ? 0.22 : 0.3)) k = 'wire';
      const DIM = { res: [6, 15], led: [7, 13], cap: [10, 19], ic: [22, 10], caps: [22, 19], bug: [13, 8], wire: [40, 60] };
      const o = { k: k, x: W + 8, w: DIM[k][0], h: DIM[k][1], y: 0, fr: Math.random() * 10 };
      if (k === 'bug') o.y = [3, 12, 30][Math.floor(Math.random() * 3)];
      // the wire's box hangs from the top down to 11 px over the trace: standing (16) hits it, ducking (10) fits under
      if (k === 'wire') o.y = 11;
      g.ob.push(o);
      g.next = g.spd * (0.72 + Math.random() * 0.85) + 34 + (o.w > 12 ? 12 : 0) + (o.k === 'wire' ? 30 : 0);
      // now and then a stray Wi-Fi signal floats between two components
      g.sigNext -= 1;
      if (g.sigNext <= 0) {
        g.sigNext = 2 + Math.floor(Math.random() * 3);
        g.sig.push({ x: W + 8 + o.w + g.next * 0.45, y: 22 + Math.floor(Math.random() * 22), got: false });
      }
    }
    g.ob.forEach((o) => {
      o.x -= dx * (o.k === 'bug' ? 1.15 : 1);
      o.fr += s * 10;
    });
    g.ob = g.ob.filter((o) => o.x + o.w > -4);
    g.sig.forEach((q) => { q.x -= dx; });
    g.sig = g.sig.filter((q) => q.x > -12 && !q.got);
    // his box (heights above the ground), a couple of pixels forgiving
    const low = g.duck && !g.air;
    const bx0 = 38;
    const bx1 = 36 + (low ? 17 : 14) - 2;
    const by0 = g.h + 1;
    const by1 = g.h + (low ? 10 : 16) - 2;
    for (let i = 0; i < g.ob.length; i++) {
      const o = g.ob[i];
      if (o.k === 'wire') {
        // the wire only counts where it actually sags: its height over the trace at his x
        if (bx1 <= o.x || bx0 >= o.x + o.w) continue;
        let lowest = 99;
        for (let xx = Math.max(bx0, o.x); xx <= Math.min(bx1, o.x + o.w); xx++) {
          const sag = Math.sin(((xx - o.x) / o.w) * Math.PI);
          lowest = Math.min(lowest, 80 - (80 - o.y) * sag);
        }
        if (by1 > lowest + 1) {
          this.pcOver(g);
          return;
        }
        continue;
      }
      if (bx0 < o.x + o.w - 1 && bx1 > o.x + 1 && by0 < o.y + o.h - 1 && by1 > o.y + 1) {
        this.pcOver(g);
        return;
      }
    }
    g.sig.forEach((q) => {
      if (!q.got && bx1 > q.x - 1 && bx0 < q.x + 9 && by1 + 2 > q.y && by0 < q.y + 5) {
        q.got = true;
        g.score += 25;
        this.sfx('blip');
        g.fx.push({ txt: '+25', x: q.x + 4, y: 84 - q.y - 8, vx: 0, vy: -18, life: 0.8, c: '#F0CE6A' });
      }
    });
    const sc = Math.floor(g.score);
    if (Math.floor(sc / 100) > g.pinged) {
      g.pinged = Math.floor(sc / 100);
      g.flash = 0.9;
      this.sfx('ping');
    }
    if (!g.ficha && sc >= 500) {
      g.ficha = true;
      if (this.fichaGain('pc')) {
        g.msg = '+1 FICHA';
        g.msgT = 1.4;
      }
    }
    if (g.flash > 0) g.flash -= s;
    if (g.msgT > 0) g.msgT -= s;
  }

  pcFx(g, s) {
    const nightT = g.mode === 'play' && Math.floor(g.score / 700) % 2 === 1 ? 1 : (g.mode === 'play' ? 0 : g.night);
    g.night += (nightT - g.night) * Math.min(1, s * 2.5);
    g.fx.forEach((f) => {
      f.x += (f.vx || 0) * s;
      f.y += (f.vy || 0) * s;
      if (!f.txt) f.vy += 160 * s;
      f.life -= s;
    });
    g.fx = g.fx.filter((f) => f.life > 0);
  }

  pcOver(g) {
    g.mode = 'over';
    g.flash = 0;
    g.msgT = 0;
    g.lockT = g.t + 0.6;
    g.keys = {};
    g.duck = false;
    g.dead = g.t;
    const sc = Math.floor(g.score);
    g.newHi = sc > (this._pcHi || 0);
    if (g.newHi) this._pcHi = sc;
    for (let i = 0; i < 14; i++) g.fx.push({ x: 46, y: 84 - g.h - 10, vx: (Math.random() - 0.3) * 120, vy: -40 - Math.random() * 90, life: 0.5 + Math.random() * 0.4, c: i % 3 ? '#F0CE6A' : '#FFFFFF' });
    this.sfx('hit');
    this.sfx('gameover');
    this.persistSoon();
  }

  loopPc(dt) {
    const g = this._pc;
    if (!g) return;
    const s = Math.min(0.05, Math.max(0, dt) / 1000);
    if (g.mode === 'play' && !g.paused) this.pcStep(g, s);
    if (!g.paused) this.pcFx(g, s);
    g.t += s;
    if (this._pcCv) this.pcDraw(g, this._pcCv);
  }

  pcDraw(g, cv) {
    const ctx = cv.getContext ? cv.getContext('2d') : null;
    if (!ctx) return;
    const W = 300;
    const H = 100;
    const GY = 84;
    const S = cv.width / W;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const font = (px) => px + 'px "DotGothic16", "JetBrains Mono", monospace';
    const mono = (px) => '500 ' + px + 'px "JetBrains Mono", ui-monospace, monospace';
    const pad = (n) => String(Math.floor(n)).padStart(5, '0');
    const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const nk = Math.max(0, Math.min(1, g.night));
    const mix = (a, b) => {
      const A = hex(a);
      const B = hex(b);
      return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * nk)).join(',') + ')';
    };
    const C = { bg: mix('#0E2A1C', '#040907'), tr: mix('#1B4630', '#0F2A1C'), via: mix('#B8963C', '#6E5A24'), silk: mix('#5E8A70', '#2E4A3A'), cu: mix('#D8B24A', '#F0CE6A'), tx: mix('#E8E4D4', '#8FD3A6'), dim: mix('#A3AD9F', '#5E8A70') };
    const R = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    };
    R(0, 0, W, H, C.bg);
    // the board: traces, vias and silkscreen labels, drifting slower than the ground
    const par = g.bg * 0.35;
    const T0 = Math.floor(par / 60);
    ctx.font = font(6);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    for (let i = T0; i <= T0 + 7; i++) {
      const hs = Math.imul(i + 7, 2654435761) >>> 0;
      const x0 = i * 60 - par;
      const ty = 12 + (hs % 6) * 12;
      const ty2 = 12 + ((hs >>> 8) % 6) * 12;
      const vx = x0 + 8 + ((hs >>> 4) % 44);
      R(x0, ty, vx - x0, 1, C.tr);
      R(vx, Math.min(ty, ty2), 1, Math.abs(ty2 - ty) + 1, C.tr);
      R(vx, ty2, x0 + 60 - vx, 1, C.tr);
      R(vx - 1, ty2 - 1, 3, 3, C.via);
      R(vx, ty2, 1, 1, C.bg);
      if ((hs >>> 12) % 3 === 0) {
        ctx.fillStyle = C.silk;
        this.canvasText(ctx, ['R', 'C', 'U', 'Q', 'D', 'L'][(hs >>> 14) % 6] + (1 + ((hs >>> 17) % 48)), x0 + 24, Math.min(ty, ty2) + 8);
      }
    }
    // at night the board's little LEDs twinkle
    if (nk > 0.05) {
      for (let i = 0; i < 14; i++) {
        const tw = (Math.sin(g.t * 3 + i * 1.7) + 1) / 2;
        R((i * 67 + 13 - par * 0.2) % W + (((i * 67 + 13 - par * 0.2) % W) < 0 ? W : 0), 6 + ((i * 29) % 62), 1, 1, 'rgba(143,211,166,' + (nk * tw * 0.9).toFixed(2) + ')');
      }
    }
    // the ground: a fat copper trace with solder pads
    R(0, GY, W, 2, C.cu);
    const go = g.bg % 24;
    for (let x = -go; x < W; x += 24) {
      R(x, GY + 2, 4, 2, C.cu);
      R(x + 12, GY + 6, 1, 1, C.via);
    }
    R(0, GY + 10, W, 1, C.tr);
    // stray Wi-Fi
    const WIFI = ['..xxxxx..', '.x.....x.', 'x..xxx..x', '..x...x..', '....x....'];
    g.sig.forEach((q) => {
      const top = GY - q.y - 5 + Math.round(Math.sin(g.t * 5 + q.x * 0.07));
      WIFI.forEach((row, r) => {
        for (let c = 0; c < 9; c++) if (row.charAt(c) === 'x') R(q.x + c, top + r, 1, 1, r === 4 ? '#FFFFFF' : '#F0CE6A');
      });
    });
    // the components
    const cap = (x, b) => {
      R(x + 3, b - 3, 1, 3, '#9AA0A4');
      R(x + 6, b - 3, 1, 3, '#9AA0A4');
      R(x, b - 4, 10, 1, '#23497F');
      R(x, b - 17, 10, 13, '#2E5FA8');
      R(x + 1, b - 17, 1, 13, '#4A7CC4');
      R(x + 7, b - 17, 2, 13, '#9EC0F0');
      [14, 10, 7].forEach((yy) => R(x + 7, b - yy, 2, 1, '#2E5FA8'));
      R(x, b - 19, 10, 2, '#B8BEC4');
      R(x + 3, b - 19, 4, 1, '#7A8086');
    };
    g.ob.forEach((o) => {
      const x = Math.round(o.x);
      const b = GY - o.y;
      if (o.k === 'res') {
        R(x + 1, b - 4, 1, 4, '#9AA0A4');
        R(x + 4, b - 4, 1, 4, '#9AA0A4');
        R(x, b - 15, 6, 11, '#D8C9A0');
        [[0, 15], [5, 15], [0, 5], [5, 5]].forEach((p) => R(x + p[0], b - p[1], 1, 1, C.bg));
        R(x, b - 13, 6, 1, '#7A4A2A');
        R(x, b - 11, 6, 1, '#1A1A1A');
        R(x, b - 9, 6, 1, '#C0392B');
        R(x, b - 7, 6, 1, '#D8B24A');
        R(x + 1, b - 14, 1, 9, 'rgba(255,255,255,0.22)');
      } else if (o.k === 'led') {
        if (Math.floor(g.t * 3 + o.fr) % 2) R(x - 2, b - 15, 11, 11, 'rgba(255,90,70,' + (0.18 + nk * 0.2).toFixed(2) + ')');
        R(x + 2, b - 5, 1, 5, '#9AA0A4');
        R(x + 4, b - 5, 1, 5, '#9AA0A4');
        R(x, b - 6, 7, 1, '#B8302A');
        R(x + 1, b - 12, 5, 6, '#E04A3A');
        R(x + 2, b - 13, 3, 1, '#E04A3A');
        R(x + 2, b - 11, 1, 2, '#FF9A8A');
      } else if (o.k === 'cap') {
        cap(x, b);
      } else if (o.k === 'caps') {
        cap(x, b);
        cap(x + 12, b);
      } else if (o.k === 'ic') {
        for (let lx = x + 2; lx <= x + 19; lx += 3) R(lx, b - 3, 1, 3, '#B8BEC4');
        R(x, b - 10, 22, 7, '#16181A');
        R(x, b - 10, 22, 1, '#2A2E32');
        R(x, b - 8, 1, 2, C.bg);
        R(x + 2, b - 9, 1, 1, '#8E969C');
        ctx.fillStyle = '#6A6E72';
        ctx.font = font(6);
        ctx.textAlign = 'left';
        this.canvasText(ctx, '555', x + 7, b - 4);
      } else if (o.k === 'wire') {
        // a jumper wire sagging down from the pin header at the top edge; its lowest point is at o.y
        const bot = GY - o.y;
        R(x + 1, 0, 3, 5, '#B8BEC4');
        R(x + o.w - 4, 0, 3, 5, '#B8BEC4');
        for (let i = 0; i <= o.w; i++) {
          const t = i / o.w;
          const sag = Math.sin(t * Math.PI);
          const yy = Math.round(GY - 80 + (bot - (GY - 80)) * sag);
          R(x + i, yy, 1, 2, i % 2 ? '#E04A3A' : '#C83C32');
          if (sag > 0.85) R(x + i, yy + 2, 1, 1, '#F08A3C');
        }
        if (Math.floor(g.t * 6 + o.fr) % 3 === 0) R(x + Math.round(o.w / 2), bot + 1, 1, 1, '#FFE08A');
      } else {
        // the bug: beetle body, red eye, flapping wings
        const up = Math.floor(o.fr) % 2 === 0;
        R(x + 3, b - 6, 9, 5, '#3A2E26');
        R(x + 5, b - 6, 4, 1, '#5A4636');
        R(x, b - 6, 4, 4, '#2A201A');
        R(x + 1, b - 5, 1, 1, '#E04A3A');
        R(x - 1, b - 8, 1, 2, '#2A201A');
        [5, 8, 10].forEach((lx) => R(x + lx, b - 1, 1, 1, '#2A201A'));
        R(x + 5, up ? b - 9 : b - 7, 6, up ? 3 : 2, 'rgba(200,216,232,0.75)');
      }
    });
    // the robot: 14 px wide, 16 tall (18 with the antenna); ducking, 17 wide and 10 tall
    {
      const rx = 36;
      const rb = GY - Math.round(g.h);
      const dead = g.mode === 'over';
      const run = g.mode === 'play' && !g.air && !g.paused;
      const fr = run ? Math.floor(g.t * 14) % 3 : 0;
      const low = g.duck && !g.air && g.mode === 'play';
      const eye = dead ? '#E04A3A' : ((g.t % 2.6) < 0.12 ? '#C8CED2' : '#8FD3A6');
      const led = Math.floor(g.t * 3) % 2 ? '#E04A3A' : '#F0CE6A';
      R(rx, rb - 4, low ? 17 : 14, 4, '#101214');
      for (let i = 0; i < (low ? 5 : 4); i++) R(rx + 1 + i * 3 + fr, rb - 2, 1, 1, '#6A6E72');
      if (low) {
        R(rx + 1, rb - 8, 11, 4, '#C8CED2');
        R(rx + 1, rb - 5, 11, 1, '#8E969C');
        R(rx + 2, rb - 7, 1, 1, '#F0CE6A');
        R(rx + 10, rb - 10, 7, 5, '#C8CED2');
        R(rx + 12, rb - 9, 1, 1, eye);
        R(rx + 15, rb - 9, 1, 1, eye);
        R(rx + 8, rb - 11, 3, 1, '#8E969C');
        R(rx + 7, rb - 11, 1, 1, led);
      } else {
        const up = g.air || dead;
        R(rx + 2, rb - 9, 10, 5, '#C8CED2');
        R(rx + 2, rb - 5, 10, 1, '#8E969C');
        R(rx + 3, rb - 8, 1, 1, '#F0CE6A');
        R(rx + 5, rb - 7, 3, 1, '#62B37F');
        R(rx + 1, up ? rb - 12 : rb - 8 + (fr === 1 ? 1 : 0), 1, 3, '#8E969C');
        R(rx + 12, up ? rb - 12 : rb - 8 + (fr === 2 ? 1 : 0), 1, 3, '#8E969C');
        R(rx + 6, rb - 10, 2, 1, '#8E969C');
        R(rx + 3, rb - 15, 8, 5, '#C8CED2');
        R(rx + 3, rb - 11, 8, 1, '#A8B0B6');
        R(rx + 5, rb - 13, 1, 1, eye);
        R(rx + 8, rb - 13, 1, 1, eye);
        R(rx + 6, rb - 17, 1, 2, '#8E969C');
        R(rx + 6, rb - 18, 1, 1, dead ? '#5A5E62' : led);
      }
      if (dead) {
        for (let i = 0; i < 3; i++) {
          const k = ((g.t - g.dead) * 0.8 + i / 3) % 1;
          R(rx + 6 + Math.round(Math.sin(g.t * 3 + i) * 2), rb - 20 - k * 14, 2, 2, 'rgba(200,206,210,' + (0.6 * (1 - k)).toFixed(2) + ')');
        }
      }
      // on the title screen: no signal over his head
      if (g.mode === 'title' && Math.floor(g.t * 2) % 2 === 0) {
        WIFI.forEach((row, r) => {
          for (let c = 0; c < 9; c++) if (row.charAt(c) === 'x') R(rx + 3 + c, rb - 25 + r, 1, 1, '#A3AD9F');
        });
        for (let i = 0; i < 7; i++) R(rx + 4 + i, rb - 26 + i, 1, 1, '#E04A3A');
      }
    }
    g.fx.forEach((f) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2));
      if (f.txt) {
        ctx.fillStyle = f.c;
        ctx.font = mono(6);
        ctx.textAlign = 'center';
        this.canvasText(ctx, f.txt, f.x, f.y);
      } else R(f.x, f.y, 2, 2, f.c);
    });
    ctx.globalAlpha = 1;
    // HUD: record and score, top right (the score blinks on every hundred)
    ctx.textBaseline = 'middle';
    ctx.font = font(8);
    const sc = Math.floor(g.score);
    ctx.textAlign = 'right';
    if (g.mode !== 'title' && !(g.flash > 0 && Math.floor(g.flash * 8) % 2 === 0)) {
      ctx.fillStyle = C.tx;
      this.canvasText(ctx, pad(sc), W - 6, 8);
    }
    if (g.mode !== 'title' || (this._pcHi || 0) > 0) {
      ctx.fillStyle = C.dim;
      this.canvasText(ctx, 'HI ' + pad(Math.max(this._pcHi || 0, g.mode === 'title' ? 0 : sc)), g.mode === 'title' ? W - 6 : W - 42, 8);
    }
    ctx.textAlign = 'center';
    if (g.msgT > 0 && g.mode === 'play') {
      ctx.globalAlpha = Math.min(1, g.msgT * 2);
      ctx.font = font(11);
      ctx.fillStyle = '#F0CE6A';
      this.canvasText(ctx, g.msg, W / 2, 28);
      ctx.globalAlpha = 1;
    }
    const tapTxt = this.coarse() ? 'toque' : 'espaço ou clique';
    const panel = (y0, h) => {
      ctx.fillStyle = 'rgba(4,9,7,0.8)';
      ctx.fillRect(W / 2 - 122, y0, 244, h);
      ctx.fillStyle = 'rgba(143,211,166,0.25)';
      ctx.fillRect(W / 2 - 122, y0, 244, 1);
      ctx.fillRect(W / 2 - 122, y0 + h - 1, 244, 1);
    };
    if (g.mode === 'title') {
      panel(5, 52);
      ctx.font = font(12);
      ctx.fillStyle = '#F0CE6A';
      this.canvasText(ctx, 'Sem internet. Sem problema.', W / 2, 16);
      ctx.font = mono(6.5);
      ctx.fillStyle = C.tx;
      this.canvasText(ctx, 'Tente: checar os cabos, reiniciar o roteador', W / 2, 29);
      this.canvasText(ctx, 'ou... pular os resistores.', W / 2, 38);
      if (Math.floor(g.t * 2) % 2 === 0) {
        ctx.fillStyle = '#8FD3A6';
        this.canvasText(ctx, tapTxt + ' pra começar', W / 2, 50);
      }
    } else if (g.mode === 'over') {
      panel(12, 44);
      ctx.font = font(13);
      ctx.fillStyle = '#E04A3A';
      this.canvasText(ctx, 'CURTO-CIRCUITO!', W / 2, 23);
      ctx.font = mono(6.5);
      ctx.fillStyle = g.newHi ? '#F0CE6A' : C.tx;
      this.canvasText(ctx, g.newHi ? 'novo recorde: ' + pad(sc) + ' pontos' : 'pontos ' + pad(sc) + ' · recorde ' + pad(this._pcHi || 0), W / 2, 36);
      if (g.t >= g.lockT) {
        ctx.fillStyle = '#8FD3A6';
        this.canvasText(ctx, tapTxt + ' pra tentar de novo', W / 2, 47);
      }
    }
    if (g.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = font(13);
      ctx.fillStyle = '#F0CE6A';
      this.canvasText(ctx, 'PAUSADO', W / 2, 40);
      ctx.font = mono(6.5);
      ctx.fillStyle = '#E8E4D4';
      this.canvasText(ctx, 'P volta ao jogo', W / 2, 54);
    }
  }

  openCredits() {
    const s = this.st();
    if (s.credOpen) return;
    clearTimeout(this._credT2);
    this._credEl = null;
    this._credPrev = typeof this._track === 'number' ? this._track : -1;
    if (this._snd) this.startMusic(0);
    this.setState({ credOpen: true, credEnd: false, paused: false, palOpen: false, troOpen: false, achOpen: false, recOpen: false, arcOpen: false });
    this._arc = null;
    this._credT2 = setTimeout(() => this.setState({ credEnd: true }), 40000);
  }

  closeCredits() {
    if (!this.st().credOpen) return;
    clearTimeout(this._credT2);
    this.setState({ credOpen: false, credEnd: false });
    if (this._credPrev >= 0 && this._snd) this.startMusic(this._credPrev);
    else this.stopMusic();
    this.focusRoot();
  }

  effQual() {
    const q = this._qual || 'auto';
    return q === 'auto' ? (this._autoLvl || 'alta') : q;
  }

  arcHi() {
    if (!this._arcHi) this._arcHi = this.data().arcDefault.map((r) => r.slice());
    return this._arcHi;
  }

  setQual(q) {
    this._qual = q;
    this._autoLvl = 'alta';
    this._lowT = 0;
    this.setState({ qual: q });
    this.persistSoon();
  }

  cycleQual() {
    const order = ['auto', 'alta', 'media', 'eco'];
    this.sfx('select');
    this.setQual(order[(order.indexOf(this._qual || 'auto') + 1) % order.length]);
  }

  autoQual(fps) {
    if ((this._qual || 'auto') !== 'auto' || this.curPage() === 'boot') return;
    const s = this.state || {};
    if (s.transitioning || s.lag || s.panic) return;
    if (fps < 40) this._lowT = (this._lowT || 0) + 0.5;
    else if (fps >= 50) this._lowT = 0;
    if ((this._lowT || 0) < 3) return;
    this._lowT = 0;
    const next = this._autoLvl === 'alta' ? 'media' : (this._autoLvl === 'media' ? 'eco' : '');
    if (!next) return;
    this._autoLvl = next;
    this.toastShow('Vídeo ajustado', 'qualidade ' + (next === 'media' ? 'média' : 'economia') + ' · fps baixo', true);
    this.setState({ qual: 'auto', autoLvl: next });
  }

  toggleDebug() {
    const on = !this.st().debug;
    this.sfx('select');
    this.setState({ debug: on });
    if (on) this.unlock('f3');
  }

  loopDebug(t) {
    if (!this._dbgEl && !this._dbgCv) return;
    if (t - (this._dbgAt || 0) < 200) return;
    this._dbgAt = t;
    const ft = this._ft || [];
    const avg = ft.length ? ft.reduce((a, b) => a + b, 0) / ft.length : 16.7;
    const max = ft.length ? Math.max.apply(null, ft) : 16.7;
    const s = this.state || {};
    const d = this.data();
    const r = this._rot || {};
    const tg = this._mt;
    const tgs = tg && tg.tagName ? tg.tagName.toLowerCase() + (typeof tg.className === 'string' && tg.className ? '.' + tg.className.split(' ')[0] : '') : '—';
    let mem = '';
    try {
      if (typeof performance !== 'undefined' && performance.memory) mem = '\nmemória JS: ' + (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB';
    } catch (err) {
      mem = '';
    }
    const f1 = (v) => (typeof v === 'number' ? v.toFixed(1) : '—');
    const lines = [
      'okaru.dev · V11 · DOM + CSS 3D + canvas',
      'fps ' + (this._fps || '—') + ' · frame ' + avg.toFixed(1) + ' ms (máx ' + max.toFixed(1) + ')',
      'tela: ' + this.curPage() + ' · vídeo: ' + this._qual + (this._qual === 'auto' ? ' → ' + this.effQual() : ''),
      'mouse: ' + (this._mx || 0) + ', ' + (this._my || 0) + ' · alvo: ' + tgs,
      'hw: rx ' + f1(r.hw && r.hw.rx) + ' ry ' + f1(r.hw && ((r.hw.ry % 360) + 360) % 360) + ' · sw: rx ' + f1(r.sw && r.sw.rx) + ' ry ' + f1(r.sw && ((r.sw.ry % 360) + 360) % 360),
      'troféus ' + Object.keys(this._got || {}).length + '/' + d.trophies.length + ' · receitas ' + Object.keys(this._recipes || {}).length + '/' + d.recipes.length + ' · quarto ' + this.roomSeenN() + '/' + this.roomTotal(),
      'som: ' + (this._snd ? 'on' : 'off') + ' · trilha: ' + (this._track >= 0 ? '0' + (this._track + 1) : 'off') + ' · save: ' + (this._noSave ? 'off' : (this._saveOk ? 'localStorage' : 'sessão')) + (s.seis ? ' · SÍSMICO' : '') + mem
    ];
    if (this._dbgEl) this._dbgEl.textContent = lines.map(window.PortfolioI18n.t).join('\n');
    const cv = this._dbgCv;
    const ctx = cv && cv.getContext ? cv.getContext('2d') : null;
    if (!ctx) return;
    const W = cv.width;
    const H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(232,228,212,0.12)';
    ctx.fillRect(0, H - Math.round(H * 16.7 / 50), W, 1);
    const bw = W / 90;
    ft.forEach((v, i) => {
      const h = Math.min(H, Math.round((v / 50) * H));
      ctx.fillStyle = v < 18 ? '#62B37F' : (v < 34 ? '#D8B24A' : '#E04A3A');
      ctx.fillRect(i * bw, H - h, Math.max(1, bw - 1), h);
    });
  }

  firstText(el) {
    if (!el) return null;
    if (el.nodeType === 3) return el;
    const c = el.firstChild;
    return c && c.nodeType === 3 ? c : null;
  }

  scramble(el, final, dur, delay, hex) {
    const node = this.firstText(el);
    if (!node) return;
    const txt = typeof final === 'string' ? final : node.nodeValue;
    this._decs = (this._decs || []).filter((d) => d.node !== node);
    this._decs.push({ node: node, final: txt, dur: dur || 600, delay: delay || 0, hex: !!hex, t0: 0, last: 0 });
    this.startLoop();
  }

  loopDecode(t) {
    const list = this._decs;
    if (!list || !list.length) return;
    const G = hexOnly => (hexOnly ? '0123456789ABCDEF' : '0123456789ABCDEFｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇ');
    for (let i = list.length - 1; i >= 0; i--) {
      const d = list[i];
      if (!d.t0) d.t0 = t + d.delay;
      if (t < d.t0) continue;
      const p = Math.min(1, (t - d.t0) / d.dur);
      if (p >= 1) {
        d.node.nodeValue = d.final;
        list.splice(i, 1);
        continue;
      }
      if (t - d.last < 45) continue;
      d.last = t;
      const n = Math.floor(p * d.final.length);
      const g = G(d.hex);
      let out = '';
      for (let k = 0; k < d.final.length; k++) {
        const ch = d.final.charAt(k);
        out += (k < n || ch === ' ') ? ch : g.charAt(Math.floor(Math.random() * g.length));
      }
      d.node.nodeValue = out;
    }
  }

  diffText() {
    return 'Prefiro trabalhar descalço: bare metal, sem nada entre mim e a máquina.';
  }

  diffRef(el) {
    if (!el || el === this._diffElSeen) return;
    this._diffElSeen = el;
    if (this._diffDone) return;
    try {
      if (typeof IntersectionObserver !== 'undefined') {
        if (this._io) this._io.disconnect();
        this._io = new IntersectionObserver((ents) => {
          if (ents.some((en) => en.isIntersecting)) {
            if (this._io) this._io.disconnect();
            this.diffStart();
          }
        }, { threshold: 0.6 });
        this._io.observe(el);
        return;
      }
    } catch (err) {
      this._io = null;
    }
    this.diffStart();
  }

  diffStart() {
    if (this._diffStarted || this._diffDone) return;
    this._diffStarted = true;
    clearTimeout(this._dfT1);
    clearTimeout(this._dfT2);
    this._dfT1 = setTimeout(() => {
      this.sfx('strike');
      this.setState({ diffStep: 1 });
    }, 700);
    this._dfT2 = setTimeout(() => {
      this._diffTy = { t0: 0, n: -1 };
      this.setState({ diffStep: 2 });
      this.startLoop();
    }, 1400);
  }

  loopDiff(t) {
    const ty = this._diffTy;
    const el = this._diffAddEl;
    if (!ty || !el) return;
    const txt = this.diffText();
    if (!ty.t0) ty.t0 = t;
    const n = Math.min(txt.length, Math.floor((t - ty.t0) / 30));
    if (n !== ty.n) {
      if (n % 2 === 0) this.sfx('type');
      ty.n = n;
      el.textContent = txt.slice(0, n);
    }
    if (n >= txt.length) {
      this._diffTy = null;
      this._diffDone = true;
      this.setState({ diffStep: 3 });
      this.sfx('merge');
      this.persistSoon();
    }
  }

  panicStart() {
    const s = this.st();
    if (s.panic || s.lag) return;
    this.sfx('glitch');
    this.setState({ lag: true, paused: false, palOpen: false, troOpen: false, achOpen: false });
    clearTimeout(this._panicT);
    this._panicT = setTimeout(() => {
      this._panicEl = null;
      this._panicAt = Date.now();
      this.setState({ lag: false, panic: true });
      this.sfx('panic');
      this.unlock('panic');
    }, 1900);
  }

  panicEnd() {
    if (!this.st().panic) return;
    if (Date.now() - (this._panicAt || 0) < 1200) return;
    this.setState({ panic: false });
    this.reboot();
  }

  eqKeys() {
    const d = this.data();
    const ks = d.equip.map((e) => e.k);
    d.bag.forEach((b) => { if (ks.indexOf(b[0]) < 0) ks.push(b[0]); });
    return ks;
  }

  eqInfo(k, invBy) {
    const d = this.data();
    const eqE = d.equip.find((e) => e.k === k);
    const eqIt = invBy[k];
    return {
      name: eqE ? (eqE.name || (eqIt ? eqIt[1] : eqE.short)) : (eqIt ? eqIt[1] : ''),
      type: eqE ? eqE.slot + (eqE.empty ? '' : ' · ' + (eqE.type || (eqIt ? eqIt[2] : ''))) : (eqIt ? eqIt[2] : '') + ' · mochila',
      use: eqE && eqE.use ? eqE.use : 'Usado em: ' + (eqIt ? eqIt[3] : '') + '.',
      flav: eqE ? eqE.flav || '' : ''
    };
  }

  // new visitors start with a handful, not a full pocket (cap is 9)
  fichaStart() {
    return 5;
  }

  fichaN() {
    return typeof this._fichas === 'number' ? this._fichas : this.fichaStart();
  }

  // fichas: the Contato coin slot spends them; bubbles, seismic vision, the arcade, the snake,
  // a hidden .ficha in the terminal and the Konami code give them back. The e-mail itself is never locked.
  fichaGain(src) {
    const once = src === 'term' || src === 'konami' || src === 'pc' || src === 'mini' || src.indexOf('w-') === 0;
    const gotF = this._fichaGot || {};
    if (once && gotF[src]) return false;
    const n = this.fichaN();
    if (n >= 9) {
      this.toastShow('Bolso cheio', '9 de 9 fichas', true);
      return false;
    }
    if (once) {
      const add = {};
      add[src] = true;
      this._fichaGot = Object.assign({}, gotF, add);
    }
    const why = { bolha: 'Tinha uma ficha na bolha', seis: 'Ficha desenterrada', arcade: 'Bônus do fliperama', snake: 'A cobrinha achou uma ficha', term: 'Achou a .ficha', konami: 'Continue? Crédito extra', pc: 'Bônus do modo offline', mini: 'Bônus do controle novo', 'w-quebro': 'Quebrou o bloco', 'w-registrador': 'Troco no registrador' }[src] || 'Achou uma ficha';
    this._fichas = n + 1;
    this.sfx('coin');
    this.setState({ fichas: this._fichas });
    this.toastShow(why, '+1 ficha · ' + this._fichas + '/9', true);
    this.persistSoon();
    return true;
  }

  fichaSpend() {
    const n = this.fichaN();
    if (n <= 0) return false;
    this._fichas = n - 1;
    this.setState({ fichas: this._fichas });
    this.persistSoon();
    return true;
  }

  // outside the Contato coin slot (the command palette), the e-mail still costs a ficha
  mailCoin() {
    if (this.fichaN() <= 0) {
      this.sfx('error');
      this.toastShow('Sem fichas', 'Tem fichas escondidas pelo portfólio', true);
      return false;
    }
    this.copyMail(true);
    return true;
  }

  insertCoin() {
    if (this.fichaN() <= 0) {
      this.sfx('error');
      this.setState({ coinNag: this.st().coinNag === 'a' ? 'b' : 'a' });
      clearTimeout(this._coinT);
      this._coinT = setTimeout(() => this.setState({ coinNag: null }), 700);
      return;
    }
    this.copyMail(true);
  }

  copyMail(spend) {
    const mail = 'hogasawara2311@outlook.com';
    const done = (ok) => {
      if (ok && spend === true) this.fichaSpend();
      this.setState(ok ? { copied: 'ok', coined: true } : { copied: 'fail' });
      clearTimeout(this._copyT);
      this._copyT = setTimeout(() => this.setState({ copied: null }), 2600);
      this.sfx(ok ? 'coin' : 'error');
      const had = !!(this._got || {}).save;
      if (ok) this.unlock('save');
      if (this.curPage() !== 'contato' && (had || !ok)) this.toastShow(ok ? (spend === true ? 'E-mail copiado · −1 ficha' : 'E-mail copiado') : 'Não deu pra copiar', mail, true);
    };
    const legacy = () => {
      let ok = false;
      try {
        const node = this._mailEl;
        const sel = window.getSelection ? window.getSelection() : null;
        if (node && sel && document.createRange) {
          const range = document.createRange();
          range.selectNodeContents(node);
          sel.removeAllRanges();
          sel.addRange(range);
          ok = document.execCommand('copy');
          if (ok) sel.removeAllRanges();
        }
      } catch (err) {
        ok = false;
      }
      done(ok);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail).then(() => done(true), legacy);
        return;
      }
    } catch (err) {
      legacy();
      return;
    }
    legacy();
  }

  moveTable() {
    if (!this._moveTbl) {
      const d = this.data();
      // longest first, so ↓ → ↓ → A wins over ↓ → A and the secrets win over their suffixes
      this._moveTbl = d.secrets.concat(d.specials).sort((a, b) => b.seq.length - a.seq.length);
    }
    return this._moveTbl;
  }

  pad(k) {
    if (this.st().lcdMenu) {
      this.menuInput(k);
      return;
    }
    const sn = this._snake;
    if (sn && sn.mode !== 'off') {
      this.snakeInput(k);
      return;
    }
    if (this.st().lcdList) {
      this.lcdListInput(k);
      return;
    }
    const now = Date.now();
    // Expire after 20 idle seconds. Walking to queued buttons never consumes this allowance.
    if ((this._comboIdle || 0) >= 20000) this._pad = [];
    this._comboIdle = 0;
    this._padT = now;
    this._pad = (this._pad || []).concat([k]).slice(-10);
    this.sfx('key');
    const seq = this._pad.join('');
    const moves = this.moveTable();
    const longerPrefix = moves.some(m => m.seq.length > seq.length && m.seq.startsWith(seq));
    const mv = !longerPrefix && (k === 'A' || k === 'B') ? moves.find((m) => seq.slice(-m.seq.length) === m.seq) : null;
    if (!mv) {
      this.setState({ padSeq: this._pad.slice(), padFx: null, padNote: '' });
      return;
    }
    this._pad = [];
    this._fxSlot = this._fxSlot === 'a' ? 'b' : 'a';
    const first = !(this._moves || {})[mv.seq];
    this._moves = Object.assign({}, this._moves || {});
    this._moves[mv.seq] = true;
    this.setState({ padSeq: [], padNote: '', padFx: { seq: mv.seq, name: mv.name, sup: !!mv.sup, sec: !!mv.fx, sub: mv.sub || '', first: first, slot: this._fxSlot } });
    this.sfx('special');
    this.unlock(mv.fx === 'konami' ? 'konami' : 'special');
    if (mv.fx) this.moveFx(mv.fx);
    this.persistSoon();
  }

  padPos() {
    let x = 1100;
    let y = 600;
    try {
      const root = this._rootEl;
      const el = this._padEl;
      if (root && el && el.getBoundingClientRect) {
        const rr = root.getBoundingClientRect();
        const br = el.getBoundingClientRect();
        x = Math.round(br.left + br.width / 2 - rr.left);
        y = Math.round(br.top + br.height / 2 - rr.top);
      }
    } catch (err) {
      x = 1100;
    }
    return [x, y];
  }

  moveFx(fx) {
    const p = this.padPos();
    if (fx === 'seis') {
      clearTimeout(this._seisT);
      this._seisT = setTimeout(() => this.setSeis(true, p[0], p[1]), 450);
    } else if (fx === 'hdk') {
      this.sfx('whoosh');
      this.setState({ hdk: this.st().hdk === 'a' ? 'b' : 'a', hdkX: p[0], hdkY: p[1] });
      clearTimeout(this._hdkT);
      this._hdkT = setTimeout(() => this.setState({ hdk: null }), 1300);
    } else if (fx === 'konami') {
      this.fichaGain('konami');
    }
  }

  padReset() {
    this._pad = [];
    this.setState({ padSeq: [], padFx: null, padNote: '', lcdList: false, lcdMenu: false });
  }

  // SELECT opens a small Pokémon-style menu on the LCD (↑ ↓ picks, A confirms, B goes back)
  lcdMenuItems() {
    const m = this._snake ? this._snake.mode : 'off';
    if (m === 'play' || m === 'pause') return [['continuar', 'Continuar'], ['recomecar', 'Recomeçar'], ['combo', 'Resetar combo'], ['sair', 'Sair do jogo']];
    if (m === 'over') return [['recomecar', 'Jogar de novo'], ['combo', 'Resetar combo'], ['sair', 'Sair do jogo']];
    return [['cobrinha', 'Cobrinha'], ['golpes', 'Golpes'], ['combo', 'Resetar combo'], ['fechar', 'Fechar']];
  }

  padSelect() {
    this.sfx('select');
    if (this.st().lcdMenu) {
      this.lcdMenuClose();
      return;
    }
    const sn = this._snake;
    this._menuResume = !!(sn && sn.mode === 'play');
    if (this._menuResume) sn.mode = 'pause';
    this.setState({ lcdMenu: true, menuI: 0, lcdList: false, snakeMode: sn ? sn.mode : 'off' });
  }

  lcdMenuClose(resume) {
    const sn = this._snake;
    const back = resume === undefined ? this._menuResume : resume;
    if (sn && sn.mode === 'pause' && back) sn.mode = 'play';
    this._menuResume = false;
    this.setState({ lcdMenu: false, snakeMode: sn ? sn.mode : 'off' });
  }

  menuInput(k) {
    const items = this.lcdMenuItems();
    const i = Math.min(this.st().menuI || 0, items.length - 1);
    if (k === 'U' || k === 'D') {
      this.sfx('key');
      this.setState({ menuI: (i + (k === 'U' ? -1 : 1) + items.length) % items.length });
    } else if (k === 'A') {
      this.menuRun(items[i][0]);
    } else if (k === 'B') {
      this.sfx('select');
      this.lcdMenuClose();
    }
  }

  menuRun(id) {
    this.sfx('select');
    if (id === 'continuar') {
      this.lcdMenuClose(true);
    } else if (id === 'recomecar' || id === 'cobrinha') {
      this._menuResume = false;
      this.setState({ lcdMenu: false });
      this.snakeStart();
    } else if (id === 'combo') {
      this._pad = [];
      this._padT = 0;
      this.setState({ padSeq: [], padFx: null, padNote: 'combo zerado' });
      this.lcdMenuClose();
    } else if (id === 'golpes') {
      this.setState({ lcdMenu: false, lcdList: true });
    } else if (id === 'sair') {
      if (this._snake) this._snake.mode = 'off';
      this._menuResume = false;
      this.setState({ lcdMenu: false, snakeMode: 'off' });
    } else {
      this.lcdMenuClose();
    }
  }

  padStart() {
    if (this.st().lcdMenu) {
      this.lcdMenuClose();
      return;
    }
    const sn = this._snake;
    if (!sn || sn.mode === 'off' || sn.mode === 'over') {
      this.snakeStart();
      return;
    }
    sn.mode = sn.mode === 'play' ? 'pause' : 'play';
    this.sfx(sn.mode === 'pause' ? 'pause' : 'unpause');
    this.setState({ snakeMode: sn.mode });
  }

  lcdListInput(k) {
    const el = this._lcdListEl;
    if (k === 'U' || k === 'D') {
      if (el) el.scrollTop = (el.scrollTop || 0) + (k === 'U' ? -36 : 36);
      this.sfx('key');
      return;
    }
    // B goes back to the menu, like closing a Pokédex page
    this.setState({ lcdList: false, lcdMenu: k === 'B', menuI: 1 });
  }

  snakeStart() {
    const sn = { mode: 'play', body: [[9, 5], [8, 5], [7, 5]], dir: [1, 0], q: [], apple: null, score: 0, step: 240, acc: 0, t: 0, flash: 0 };
    sn.apple = this.snakeFree(sn);
    this._snake = sn;
    this._pad = [];
    this.sfx('start');
    this.setState({ snakeMode: 'play', lcdList: false, padFx: null, padSeq: [] });
    this.startLoop();
  }

  snakeFree(sn) {
    for (let i = 0; i < 400; i++) {
      const x = Math.floor(Math.random() * 20);
      const y = Math.floor(Math.random() * 10);
      if (!sn.body.some((p) => p[0] === x && p[1] === y)) return [x, y];
    }
    return null;
  }

  snakeInput(k) {
    const sn = this._snake;
    const D = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] }[k];
    if (!sn || sn.mode !== 'play' || !D) return;
    const last = sn.q.length ? sn.q[sn.q.length - 1] : sn.dir;
    if ((D[0] === -last[0] && D[1] === -last[1]) || (D[0] === last[0] && D[1] === last[1])) return;
    if (sn.q.length < 2) sn.q.push(D);
    this.sfx('key');
  }

  snakeStep(sn) {
    if (sn.q.length) sn.dir = sn.q.shift();
    const h = sn.body[0];
    const nx = h[0] + sn.dir[0];
    const ny = h[1] + sn.dir[1];
    // the board has walls: leaving the 20x10 field is a crash, same as biting the tail
    const wall = nx < 0 || nx >= 20 || ny < 0 || ny >= 10;
    const eat = !wall && !!sn.apple && nx === sn.apple[0] && ny === sn.apple[1];
    const rest = eat ? sn.body : sn.body.slice(0, -1);
    if (wall || rest.some((p) => p[0] === nx && p[1] === ny)) {
      sn.mode = 'over';
      sn.crash = wall ? 'parede' : 'rabo';
      sn.flash = 0.5;
      this._snakeHi = Math.max(this._snakeHi || 0, sn.score);
      this.sfx('gameover');
      this.setState({ snakeMode: 'over' });
      this.persistSoon();
      return;
    }
    sn.body = [[nx, ny]].concat(rest);
    if (eat) {
      sn.score += 1;
      sn.step = Math.max(150, sn.step - 6);
      sn.apple = this.snakeFree(sn);
      this.sfx('pop');
      if (sn.score >= 15) this.unlock('snake');
      if (sn.score % 10 === 0) this.fichaGain('snake');
    }
  }

  loopSnake(dt) {
    const sn = this._snake;
    if (!sn || (this.st().ctl || 'hitbox') !== 'gb') return;
    const s = this.state || {};
    if (sn.mode === 'play' && !s.paused && this.curPage() === 'sobre') {
      sn.acc += dt;
      let n = 0;
      while (sn.acc >= sn.step && sn.mode === 'play' && n++ < 4) {
        sn.acc -= sn.step;
        this.snakeStep(sn);
      }
    }
    sn.t += dt / 1000;
    if (sn.flash > 0) sn.flash -= dt / 1000;
    if (this._lcdCv) this.snakeDraw(sn, this._lcdCv);
  }

  snakeDraw(sn, cv) {
    const ctx = cv.getContext ? cv.getContext('2d') : null;
    if (!ctx) return;
    const S = cv.width / 160;
    const font = (px) => px + 'px "DotGothic16", "JetBrains Mono", monospace';
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.clearRect(0, 0, 160, 96);
    if (sn.mode === 'off') return;
    ctx.fillStyle = 'rgba(143,211,166,0.07)';
    for (let y = 0; y < 10; y++) for (let x = 0; x < 20; x++) ctx.fillRect(x * 8 + 1, 8 + y * 8 + 1, 6, 6);
    ctx.strokeStyle = sn.mode === 'over' && sn.crash === 'parede' ? 'rgba(224,74,58,0.9)' : 'rgba(143,211,166,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 8.5, 159, 79);
    ctx.textBaseline = 'middle';
    ctx.font = font(7);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#A3AD9F';
    this.canvasText(ctx, 'MAÇÃS ' + sn.score, 2, 4.5);
    ctx.textAlign = 'right';
    this.canvasText(ctx, 'RECORDE ' + Math.max(this._snakeHi || 0, sn.score), 158, 4.5);
    if (sn.apple) {
      ctx.fillStyle = '#F0CE6A';
      ctx.fillRect(sn.apple[0] * 8 + 2, 8 + sn.apple[1] * 8 + 2, 4, 4);
      ctx.fillRect(sn.apple[0] * 8 + 3, 8 + sn.apple[1] * 8 + 1, 2, 6);
      ctx.fillRect(sn.apple[0] * 8 + 1, 8 + sn.apple[1] * 8 + 3, 6, 2);
    }
    sn.body.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? (sn.mode === 'over' ? '#E04A3A' : '#D6F5E1') : '#8FD3A6';
      ctx.fillRect(p[0] * 8 + 1, 8 + p[1] * 8 + 1, 6, 6);
    });
    if ((sn.mode === 'pause' || sn.mode === 'over') && this.state && this.state.lcdMenu) {
      ctx.fillStyle = 'rgba(5,8,6,0.6)';
      ctx.fillRect(0, 8, 160, 80);
    } else if (sn.mode === 'pause' || sn.mode === 'over') {
      ctx.fillStyle = 'rgba(5,8,6,0.74)';
      ctx.fillRect(0, 8, 160, 80);
      ctx.textAlign = 'center';
      ctx.font = font(11);
      ctx.fillStyle = sn.mode === 'over' ? '#E04A3A' : '#F0CE6A';
      this.canvasText(ctx, sn.mode === 'over' ? 'FIM DE JOGO' : 'PAUSA', 80, 40);
      ctx.font = font(7);
      ctx.fillStyle = '#E8E4D4';
      this.canvasText(ctx, sn.mode === 'over' ? (sn.crash === 'parede' ? 'bateu na parede · ' : '') + sn.score + (sn.score === 1 ? ' maçã' : ' maçãs') : 'START continua', 80, 55);
    }
    if (sn.flash > 0) {
      ctx.fillStyle = 'rgba(224,74,58,' + Math.min(0.4, sn.flash).toFixed(2) + ')';
      ctx.fillRect(0, 0, 160, 88);
    }
  }

  // keeps the buried ficha glued to its spot: the clip zone tracks the stage (between the top bar
  // and the seismograph), a page coin follows the page scroll, a room coin follows its floor tile
  // through the camera. The HUD says where the ficha is when it is not in sight.
  loopSeis() {
    const s = this.state || {};
    if (!s.seis) return;
    const a = this._coinSpot;
    const cw = this._seisCw;
    const cz = this._seisCz;
    const fe = this._seisFind;
    const r = this._rootEl;
    const stage = r && r.querySelector ? r.querySelector('.stage') : null;
    const sc = this.screenEl();
    const put = (el, k, v) => {
      const t = Math.round(v) + 'px';
      if (el.style[k] !== t) el.style[k] = t;
    };
    if (cz && stage) {
      put(cz, 'top', stage.offsetTop);
      put(cz, 'height', stage.offsetHeight);
    }
    let vis = false;
    let hint = '';
    if (a && a.page !== this.curPage()) hint = 'ficha ' + this.coinWhere(a.page);
    else if (a && a.tile) {
      const cv = this._rmCv;
      const rm = this.rmInit();
      const tx = a.tile[0] * 16 + 8;
      const ty = a.tile[1] * 16 + 8;
      if (cv && stage && cv.width) {
        const dx = tx < rm.camX ? -1 : (tx >= rm.camX + cv.width ? 1 : 0);
        const dy = ty < rm.camY ? -1 : (ty >= rm.camY + cv.height ? 1 : 0);
        vis = !dx && !dy;
        if (vis && cw) {
          const cr = cv.getBoundingClientRect();
          const zr = (cz || stage).getBoundingClientRect();
          const k = cr.width / cv.width;
          put(cw, 'left', cr.left - zr.left + (tx - rm.camX) * k - 15);
          put(cw, 'top', cr.top - zr.top + (ty - rm.camY) * k - 15);
        }
        hint = vis ? 'ficha no chão, aqui' : 'ficha ' + (dy < 0 ? '↑ mais acima' : dy > 0 ? '↓ mais abaixo' : dx < 0 ? '← à esquerda' : '→ à direita');
      }
    } else if (a && sc) {
      const p = this.coinXY(a, sc);
      const vy = p.y - (sc.scrollTop || 0);
      const ch = sc.clientHeight || 0;
      vis = vy > -30 && vy < ch;
      if (cw) {
        const zr = cz && cz.getBoundingClientRect ? cz.getBoundingClientRect() : null;
        const sr = zr && sc.getBoundingClientRect ? sc.getBoundingClientRect() : null;
        put(cw, 'left', (sr ? sr.left - zr.left : 0) + p.x);
        put(cw, 'top', (sr ? sr.top - zr.top : 0) + vy);
      }
      hint = vy <= -30 ? 'ficha ↑ mais acima' : vy >= ch ? 'ficha ↓ mais abaixo' : 'tem uma ficha aqui';
    }
    if (a && this.fichaN() >= 9) hint = 'bolso cheio · 9/9';
    if (cw) {
      const v = vis ? 'visible' : 'hidden';
      if (cw.style.visibility !== v) cw.style.visibility = v;
    }
    hint = window.PortfolioI18n.t(hint);
    if (fe) {
      if (fe.textContent !== hint) fe.textContent = hint;
      // a fresh ficha was just buried somewhere else: flash the hint once
      if (this._coinPing && fe.classList) {
        this._coinPing = false;
        fe.classList.remove('is-ping');
        void fe.offsetWidth;
        fe.classList.add('is-ping');
      }
    }
  }

  // the buried ficha lives in one spot of the whole site at a time: a page (as fractions of its
  // usable area, so it sits on the same bit of content at any window size) or a room floor tile
  coinPages() {
    return ['inicio', 'projetos', 'sobre', 'contato', 'lab', 'quarto'];
  }

  coinWhere(page) {
    return { inicio: 'no Início', projetos: 'em Projetos', sobre: 'no Sobre', contato: 'no Contato', lab: 'no Lab', quarto: 'no quarto' }[page] || 'por aí';
  }

  // page coordinates of a page coin: below the HUD, above the bottom edge, clear of the sides
  coinXY(a, sc) {
    const w = sc.clientWidth || 0;
    const h = Math.max(sc.scrollHeight || 0, sc.clientHeight || 0);
    return { x: Math.round(24 + a.fx * Math.max(0, w - 78)), y: Math.round(124 + a.fy * Math.max(0, h - 124 - 70)) };
  }

  // the first ficha of a seismic session shows up right where you are looking
  coinHere() {
    const page = this.curPage();
    if (this.coinPages().indexOf(page) < 0) return this.coinNew('');
    if (page === 'quarto') return { page: page, tile: this.rmCoinTile(true) };
    const R = Math.random;
    const sc = this.screenEl();
    const fx = 0.08 + R() * 0.84;
    if (!sc || !sc.clientHeight) return { page: page, fx: fx, fy: R() * 0.4 };
    const h = Math.max(sc.scrollHeight || 0, sc.clientHeight);
    const top = sc.scrollTop || 0;
    const y0 = Math.max(124, top + 124);
    const y1 = Math.min(h - 70, top + sc.clientHeight - 70);
    const y = y1 > y0 ? y0 + R() * (y1 - y0) : y0;
    return { page: page, fx: fx, fy: Math.max(0, Math.min(1, (y - 124) / Math.max(1, h - 124 - 70))) };
  }

  // after a pickup the next ficha is buried on another screen (or in the room), anywhere on it
  coinNew(avoid) {
    const pages = this.coinPages().filter((p) => p !== avoid);
    const page = pages[Math.floor(Math.random() * pages.length)];
    if (page === 'quarto') return { page: page, tile: this.rmCoinTile(false) };
    return { page: page, fx: 0.06 + Math.random() * 0.88, fy: Math.random() };
  }

  coinSet(spot, ping) {
    this._coinSpot = spot || null;
    if (ping) this._coinPing = true;
    this.setState({ coinSpot: this._coinSpot });
    this.persistSoon();
  }

  // picking it up: +1 ficha and the next one moves elsewhere; with a full pocket it stays put
  coinTake() {
    const a = this._coinSpot;
    if (!a || !this.fichaGain('seis')) return false;
    this.coinSet(this.coinNew(a.page), true);
    return true;
  }

  // a saved spot is only trusted if it still makes sense (page exists, tile is plain floor)
  coinValid(c) {
    if (!c || typeof c !== 'object' || this.coinPages().indexOf(c.page) < 0) return null;
    if (c.page === 'quarto') {
      const t = Array.isArray(c.tile) ? c.tile.map((v) => Math.floor(+v)) : [];
      const G = this.rmGrid();
      if (t.length !== 2 || !this.rmFree(t[0], t[1]) || G.obj[t[1] * G.W + t[0]] >= 0) return null;
      return { page: 'quarto', tile: t };
    }
    const fx = +c.fx;
    const fy = +c.fy;
    if (!isFinite(fx) || !isFinite(fy)) return null;
    return { page: c.page, fx: Math.max(0, Math.min(1, fx)), fy: Math.max(0, Math.min(1, fy)) };
  }

  // a plain floor tile (never the door mat or furniture): at least 4 steps from the player when
  // you are in the room, anywhere reachable from the door otherwise
  rmCoinTile(fromPlayer) {
    const G = this.rmGrid();
    const rm = fromPlayer ? this.rmInit() : null;
    const minD = rm ? 4 : 2;
    const dist = {};
    const start = rm ? [rm.moving ? rm.to[0] : rm.x, rm.moving ? rm.to[1] : rm.y] : [11, 12];
    dist[start[1] * G.W + start[0]] = 0;
    const q = [start];
    const cands = [];
    while (q.length) {
      const c = q.shift();
      const dc = dist[c[1] * G.W + c[0]];
      if (dc >= minD && G.obj[c[1] * G.W + c[0]] < 0) cands.push(c);
      [[c[0], c[1] - 1], [c[0] + 1, c[1]], [c[0], c[1] + 1], [c[0] - 1, c[1]]].forEach((n) => {
        const k = n[1] * G.W + n[0];
        if (this.rmFree(n[0], n[1]) && dist[k] === undefined) {
          dist[k] = dc + 1;
          q.push(n);
        }
      });
    }
    return cands.length ? cands[Math.floor(Math.random() * cands.length)] : [5, 11];
  }

  // stepping on the seismic ficha picks it up
  rmStepOn(rm) {
    const s = this.state || {};
    const a = this._coinSpot;
    if (s.seis && a && a.tile && a.page === 'quarto' && a.tile[0] === rm.x && a.tile[1] === rm.y) this.coinTake();
  }

  setSeis(on, x, y) {
    if (on) {
      this.sfx('seis');
      this.unlock('seismic');
      const s = this.st();
      // Toph feels the buried ficha. There is one at a time somewhere in the site; the first one
      // shows up where you are looking, and each pickup buries the next one somewhere else.
      if (!this._coinSpot) this.coinSet(this.coinHere(), false);
      this.setState({ seis: true, troOpen: false, achOpen: false, paused: false, palOpen: false, sonarSlot: s.sonarSlot === 'a' ? 'b' : 'a', sonarX: x, sonarY: y });
    } else {
      this.sfx('lights');
      this.setState({ seis: false, now: Date.now() });
    }
  }

  pulse(e) {
    const s = this.st();
    if (this._snd && e && e.target && e.target.closest && Date.now() - (this._sfxAt || 0) > 60) {
      const t = e.target.closest('button, a');
      if (t && !(this._dragEnd && Date.now() - this._dragEnd < 400)) this.sfx('click');
    }
    if (!s.seis || !e || !e.currentTarget) return;
    if (Date.now() - (this._sfxAt || 0) > 60) this.sfx('ping');
    const r = e.currentTarget.getBoundingClientRect();
    this.setState({ sonarSlot: s.sonarSlot === 'a' ? 'b' : 'a', sonarX: Math.round(e.clientX - r.left), sonarY: Math.round(e.clientY - r.top) });
  }

  stomp(e) {
    clearTimeout(this._toesT);
    const btn = e.currentTarget;
    const gb = btn.getBoundingClientRect();
    const root = btn.closest ? btn.closest('.okr') : null;
    const rr = root ? root.getBoundingClientRect() : { left: 0, top: 0 };
    let cx = e.clientX;
    let cy = e.clientY;
    if (!cx && !cy) {
      cx = gb.left + gb.width / 2;
      cy = gb.top + gb.height / 2;
    }
    const now = Date.now();
    this._stomps = (this._stomps || []).filter((t) => now - t < 1700);
    this._stomps.push(now);
    const s = this.st();
    this.sfx('stomp');
    this.setState({ tremor: s.tremor === 'a' ? 'b' : 'a', ringSlot: s.ringSlot === 'a' ? 'b' : 'a', ringX: Math.round(cx - gb.left) });
    clearTimeout(this._tremT);
    this._tremT = setTimeout(() => this.setState({ tremor: null }), 850);
    if (this._stomps.length >= 3) {
      this._stomps = [];
      if (s.seis) this.setSeis(false);
      else this.setSeis(true, Math.round(cx - rr.left), Math.round(cy - rr.top));
    }
  }

  termKey(e) {
    const h = this._hist || [];
    if (e.key && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') && !e.ctrlKey && !e.metaKey) this.sfx('type');
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = e.target.value;
      if (v.trim()) this._hist = h.concat([v]).slice(-20);
      this._hi = (this._hist || []).length;
      this.runCmd(v, e);
    } else if (e.key === 'ArrowUp' && h.length) {
      e.preventDefault();
      this._hi = Math.max(0, (typeof this._hi === 'number' ? this._hi : h.length) - 1);
      this.setState({ termInput: h[this._hi] });
    } else if (e.key === 'ArrowDown' && typeof this._hi === 'number') {
      e.preventDefault();
      this._hi = Math.min(h.length, this._hi + 1);
      this.setState({ termInput: h[this._hi] || '' });
    } else if (e.key === 'Tab' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const v = (e.target && e.target.value) || '';
      const r = this.termComplete(v);
      if (!r) return;
      e.preventDefault();
      if (r.list) {
        const lines = (this.st().termLines || this.data().termInit).concat([{ t: r.list.join('  '), cls: 't-d' }]).slice(-60);
        this._scrollTerm = true;
        this.setState({ termLines: lines, termInput: v });
      } else {
        this.sfx('key');
        this.setState({ termInput: r.value });
      }
    }
  }

  termFs() {
    return {
      aquasense: { p: 0, ls: 'README.md  firmware/  dashboard/  alexa-skill/' },
      'lab-infra': { p: 1, ls: 'README.md  proxmox/  ad-dc/  ipfire/  siem/' },
      'cofre-esp32': { p: 2, ls: 'README.md  main.ino' },
      'ativos-cptm': { p: 3, ls: 'README.md  src/  test/' }
    };
  }

  termComplete(v) {
    if (!v || !v.trim()) return null;
    const m = v.match(/^(.*?)(\S*)$/);
    const head = m ? m[1] : '';
    const word = m ? m[2] : v;
    const first = !head.trim();
    const fs = this.termFs();
    const cwd = this._cwd || '';
    let cands;
    if (first) {
      cands = ['help', 'whoami', 'ls', 'cd', 'cat', 'open', 'pwd', 'neofetch', 'receitas', 'dica', 'resumo', 'play', 'trilha', 'credits', 'date', 'history', 'fortune', 'ping', 'clear', 'reboot'];
    } else {
      const cmd = head.trim().split(/\s+/)[0].toLowerCase();
      const dirs = Object.keys(fs).map((k) => k + '/');
      if (cmd === 'cd') cands = cwd ? ['..'] : dirs.concat(['projetos', 'lab', 'sobre', 'quarto', 'contato']);
      else cands = cwd ? fs[cwd].ls.split(/\s+/) : dirs.concat(['sobre.txt', 'contato.txt', 'cv.pdf']);
    }
    const low = word.toLowerCase();
    const hits = cands.filter((c) => c && c.toLowerCase().indexOf(low) === 0);
    if (!hits.length) return null;
    if (hits.length === 1) return { value: head + hits[0] + (first ? ' ' : '') };
    let pre = hits[0];
    hits.forEach((h) => { while (pre && h.toLowerCase().indexOf(pre.toLowerCase()) !== 0) pre = pre.slice(0, -1); });
    if (pre.length > word.length) return { value: head + pre };
    return { value: v, list: hits };
  }

  termReadme(i, out) {
    const p = this.data().projects[i];
    out('# ' + p.title + ' · ' + p.tags, 't-o');
    out(p.line);
    out('stack: ' + p.stack.join(', '), 't-d');
    if (i === 2) out('senha de fábrica: a mesma revisão do BIOS. (ninguém troca, né?)', 't-w');
    out('digite "open" pra abrir a missão ' + p.num + '.', 't-d');
  }

  fichaHidden() {
    return !((this._fichaGot || {}).term);
  }

  runCmd(raw, e) {
    const cmd = String(raw || '').trim();
    const low = cmd.toLowerCase();
    const s = this.st();
    let lines = (s.termLines || this.data().termInit).slice();
    lines.push({ t: cmd, cls: 't-c' });
    const out = (t, cls) => lines.push({ t: t, cls: cls || '' });
    const fs = this.termFs();
    const cwd = this._cwd || '';
    let after = null;
    if (!cmd) {
      after = null;
    } else if (low === 'help') {
      out('comandos: whoami · ls · cd <pasta> · cat <arquivo> · open · pwd · neofetch · receitas · dica · resumo · play · trilha · credits · date · history · reboot · clear');
      out('tab completa comandos e nomes. atalhos: ctrl+k abre a paleta · esc pausa · m liga o som · F3 debug', 't-d');
      out('nem todo comando aparece aqui.', 't-d');
    } else if (low === 'whoami') {
      out('hikaru ogasawara, "okaru". engenharia da computação @ ibmec sp.');
    } else if (low === 'pwd') {
      out('/home/okaru' + (cwd ? '/' + cwd : ''));
    } else if (low === 'ls' || low === 'ls -a' || low === 'ls -la' || low === 'ls .' || (cwd && (low === 'ls ..' || low === 'ls ../'))) {
      const up = low.indexOf('..') > 0;
      if (cwd && !up) out(fs[cwd].ls);
      else out('aquasense/  lab-infra/  cofre-esp32/  ativos-cptm/  sobre.txt  contato.txt  cv.pdf' + (low !== 'ls' && !up && this.fichaHidden() ? '  .ficha' : ''));
    } else if (low.indexOf('ls ') === 0) {
      const arg = low.slice(3).trim().replace(/\/$/, '');
      if (!cwd && fs[arg]) out(fs[arg].ls);
      else out('ls: ' + cmd.slice(3).trim() + ': não encontrado');
    } else if (!cwd && low === 'cat sobre.txt') {
      out('hardware me ensinou a ouvir sinais. segurança me ensinou a desconfiar deles.');
    } else if (!cwd && low === 'cat contato.txt') {
      out('hogasawara2311@outlook.com · linkedin.com/in/hikaru-ogasawara · github.com/Hikaru-0gasawara');
    } else if (!cwd && (low === 'cat cv.pdf' || low === 'open cv.pdf' || low === 'xdg-open cv.pdf')) {
      out('é binário. tem em PT, EN e JP lá no contato.');
    } else if (low.indexOf('cat ') === 0 && /readme(\.md)?$/.test(low) && (cwd || fs[low.slice(4).trim().split('/')[0]])) {
      const dir = cwd || low.slice(4).trim().split('/')[0];
      this.termReadme(fs[dir].p, out);
    } else if (!cwd && (low === 'cat .ficha' || low === 'cat ./.ficha') && this.fichaHidden()) {
      if (this.fichaGain('term')) out('uma ficha dourada, meio amassada. foi pro bolso: +1 ficha.', 't-o');
      else out('bolso cheio (9/9). deixa ela aí por enquanto.', 't-d');
    } else if (cwd === 'cofre-esp32' && (low === 'cat main.ino' || low === 'cat ./main.ino')) {
      out('// cofre.ino · teclado 3×4, servo e LCD I²C. 1 arquivo, 3 portes.', 't-d');
      out('// o resto tá na missão 03. digite "open".', 't-d');
    } else if (low === 'open' || low === 'open .' || low === 'xdg-open .' || low === './missao' || (low.indexOf('open ') === 0 && fs[low.slice(5).trim().replace(/\/$/, '')])) {
      const dir = low.indexOf('open ') === 0 && low !== 'open .' ? low.slice(5).trim().replace(/\/$/, '') : cwd;
      if (dir && fs[dir]) {
        out('abrindo a missão ' + this.data().projects[fs[dir].p].num + ' · ' + this.data().projects[fs[dir].p].title + ' ...', 't-o');
        after = 'proj:' + fs[dir].p;
      } else {
        out('open: nada pra abrir aqui. entre numa pasta com cd, ex.: cd aquasense');
      }
    } else if (low === 'dica' || low === 'dicas' || low === 'hint') {
      const gotNow = this._got || {};
      const locked = this.data().trophies.filter((t) => !gotNow[t.id]);
      if (!locked.length) {
        out('você já achou tudo. platina!', 't-o');
      } else {
        this._hintI = ((this._hintI || 0) + 1) % locked.length;
        const t = locked[this._hintI];
        out('dica · ' + (t.secret ? '???' : t.name) + ': ' + (this.data().hints[t.id] || t.goal || t.hint), 't-o');
      }
    } else if (low === 'receitas' || low === 'craft' || low === 'recipes') {
      const rs = this.data().recipes;
      const known = this._recipes || {};
      const n = Object.keys(known).length;
      out('bancada: ' + n + '/' + rs.length + ' receitas descobertas.', 't-o');
      rs.forEach((r, i) => { if (known[i]) out('  ' + r.a + ' + ' + r.b + ' = ' + r.name, 't-o'); });
      const next = rs.findIndex((r, i) => !known[i]);
      if (next >= 0) out('palpite: ' + rs[next].a + ' + ???', 't-d');
    } else if (low.indexOf('cat ') === 0) {
      out('cat: ' + cmd.slice(4) + ': arquivo não encontrado');
    } else if (low === 'neofetch') {
      ['okaru@lab', '---------', 'os ...... Pop!_OS · Ubuntu Server · Windows Server', 'host .... Proxmox VE', 'term .... WezTerm · JetBrains Mono', 'tema .... system24 (monocromático)', 'uptime .. desde 2023'].forEach((t) => out(t, 't-o'));
    } else if (low === 'cd' || low.indexOf('cd ') === 0) {
      const map = { '~': 'inicio', '/': 'inicio', 'inicio': 'inicio', 'início': 'inicio', 'projetos': 'projetos', 'lab': 'lab', 'sobre': 'sobre', 'quarto': 'quarto', 'contato': 'contato' };
      const arg = low.slice(2).trim().replace(/^\.\//, '').replace(/\/$/, '');
      const inner = cwd ? fs[cwd].ls.split(/\s+/).filter((x) => /\/$/.test(x)).map((x) => x.slice(0, -1)) : [];
      if (cwd && (!arg || arg === '..' || arg === '~' || arg === '/' || arg === '~/')) {
        this._cwd = '';
      } else if (!cwd && arg === '..') {
        out('você já está na raiz. (~)', 't-d');
      } else if (!cwd && fs[arg]) {
        this._cwd = arg;
        out('~/' + arg + ' · digite ls, cat README.md ou open', 't-o');
      } else if (cwd && inner.indexOf(arg) >= 0) {
        out('cd: ' + arg + ': aqui dentro é só cenário. tente "open".', 't-d');
      } else if (map[arg]) {
        const to = map[arg];
        this._cwd = '';
        out('abrindo /dev/okaru' + (to === 'inicio' ? '' : '/' + to) + ' ...', 't-o');
        after = to;
      } else if (!arg) {
        out('uso: cd aquasense | lab-infra | cofre-esp32 | ativos-cptm, ou uma tela: projetos | lab | sobre | quarto | contato');
      } else {
        out('cd: ' + arg + ': diretório não encontrado. tente "ls".');
      }
    } else if (low === 'clear') {
      lines = [];
    } else if (low.indexOf('sudo') === 0) {
      out('okaru is not in the sudoers file. This incident will be reported.', 't-w');
      this.unlock('sudo');
    } else if (/^(nmap|ssh|hydra|nc|netcat|msfconsole|sqlmap)(\s|$)/.test(low)) {
      out('sem autorização por escrito, sem scan. regra número um.', 't-w');
    } else if (low.indexOf('rm ') === 0) {
      out('boa tentativa.', 't-w');
    } else if (low.replace(/\s+/g, '') === ':(){:|:&};:' || low === 'forkbomb' || low === 'fork bomb') {
      ['[1] 2312', '[2] 2313 2314', '[3] 2315 2316 2317 2318', '[4] 2319 2320 2321 2322 2323 2324 2325 2326'].forEach((t) => out(t, 't-d'));
      out('bash: fork: retry: Resource temporarily unavailable', 't-w');
      out('bash: fork: retry: Resource temporarily unavailable', 't-w');
      after = 'panic';
    } else if (low === 'resumo' || low === 'cv' || low === 'recrutador') {
      out('abrindo o modo recrutador...', 't-o');
      after = 'rec';
    } else if (low === 'play' || low === 'jogar' || low === 'arcade' || low === 'fliperama') {
      out('ligando o fliperama...', 't-o');
      after = 'arcade';
    } else if (low === 'debug') {
      out('alternando o modo debug (F3).', 't-o');
      after = 'debug';
    } else if (low === 'credits' || low === 'creditos' || low === 'créditos') {
      out('rolando os créditos...', 't-o');
      after = 'credits';
    } else if (low === 'trilha' || low === 'music' || low === 'musica' || low === 'música') {
      const nx = (typeof this._track === 'number' ? this._track : -1) >= 2 ? -1 : (typeof this._track === 'number' ? this._track : -1) + 1;
      out(nx < 0 ? 'trilha desligada.' : 'tocando: trilha ' + (nx + 1) + ' · ' + this.tracks()[nx].name, 't-o');
      after = 'track';
    } else if (low === 'toph') {
      out('toph? não conheço ninguém com esse nome.', 't-d');
      after = 'seis';
    } else if (['exit', 'logout', 'reboot', 'shutdown', 'poweroff'].indexOf(low) >= 0 || low.indexOf('shutdown ') === 0) {
      out('desligando... até o próximo press start.', 't-d');
      after = 'reboot';
    } else if (low === 'ping' || low.indexOf('ping ') === 0) {
      out('64 bytes de /dev/okaru: tempo=0,1 ms. estou aqui.', 't-o');
    } else if (/^(submit\s+)?flag\{.*\}$/.test(low)) {
      if (low.replace(/^submit\s+/, '') === 'flag{t0d0_m3t4l_t3m_t3rr4}') {
        out('flag aceita. +500 pontos. todo metal tem um pouco de terra.', 't-o');
        this.unlock('ctf');
      } else {
        out('flag incorreta. confere o dump do firmware.', 't-w');
      }
    } else if (low === 'sl') {
      ['   ___ ____________ ____________', '  |[]_|  REST API  |  14 rotas  |', '  |___|____________|____________|', '   oo    oo    oo    oo    oo'].forEach((t) => out(t, 't-o'));
      out('você quis dizer ls? tudo bem, o trem passa.', 't-d');
    } else if (low === 'date') {
      out('são paulo, ' + this.clock() + ' (BRT)');
    } else if (low === 'history') {
      const h = this._hist || [];
      h.slice(-10).forEach((c, i) => out(String(i + 1).padStart(3, ' ') + '  ' + c, 't-d'));
    } else if (low.indexOf('echo ') === 0) {
      out(cmd.slice(5));
    } else if (low === 'fortune') {
      const f = ['hardware me ensinou a ouvir sinais.', 'acurácia de 0,98? desconfie antes de comemorar.', 'todo metal tem um pouco de terra.', 'sem escopo por escrito, sem scan.'];
      out(f[Math.floor(Math.random() * f.length)], 't-o');
    } else if (low === 'hack' || low === 'hackear' || low === 'hack the planet') {
      ['acessando o mainframe...', 'contornando o firewall...', 'baixando a internet inteira...'].forEach((t) => out(t, 't-o'));
      out('brincadeira. segurança de verdade é ler log e documentação.', 't-w');
    } else {
      out('comando não encontrado: ' + cmd + '. tente "help".');
    }
    if (lines.length > 60) lines = lines.slice(-60);
    this._scrollTerm = true;
    this.setState({ termLines: lines, termInput: '' });
    clearTimeout(this._seisT);
    if (after === 'seis') {
      const root = e && e.currentTarget && e.currentTarget.closest ? e.currentTarget.closest('.okr') : null;
      const rr = root ? root.getBoundingClientRect() : null;
      const x = rr ? Math.round(rr.width / 2) : 720;
      const y = rr ? Math.round(rr.height - 28) : 870;
      this._seisT = setTimeout(() => this.setSeis(true, x, y), 900);
    } else if (after === 'reboot') {
      this._seisT = setTimeout(() => this.reboot(), 700);
    } else if (after === 'panic') {
      this._seisT = setTimeout(() => this.panicStart(), 500);
    } else if (after === 'rec') {
      this._seisT = setTimeout(() => this.openRec(), 300);
    } else if (after === 'arcade') {
      this._seisT = setTimeout(() => this.openArcade(), 300);
    } else if (after === 'debug') {
      this.toggleDebug();
    } else if (after === 'credits') {
      this._seisT = setTimeout(() => this.openCredits(), 300);
    } else if (after === 'track') {
      this.cycleTrack();
    } else if (after && after.indexOf('proj:') === 0) {
      const pn = parseInt(after.slice(5), 10);
      this._seisT = setTimeout(() => this.go('projetos', () => this.openProj(pn)), 320);
    } else if (after) {
      this._seisT = setTimeout(() => this.go(after), 320);
    }
  }

  renderVals() {
    const s = this.st();
    const d = this.data();
    const page = this.curPage();
    const got = this._got || {};
    const gotCount = d.trophies.filter((t) => got[t.id]).length;
    const troBy = {};
    d.trophies.forEach((t) => { troBy[t.id] = t; });
    const troIds = Object.keys(got).filter((k) => !!troBy[k]);
    const troNext = d.trophies.filter((t) => !got[t.id] && !t.secret).slice(0, 3);
    const secAll = d.trophies.filter((t) => t.secret).length;
    const secGot = d.trophies.filter((t) => t.secret && got[t.id]).length;
    const achT = troBy[s.achSel] || d.trophies[0];
    const achGot = !!got[achT.id];
    const main = s.main || 'hw';
    const tail = (p) => (p && p !== 'inicio' && p !== 'boot') ? '/' + p : '';
    const arrow = { U: '↑', D: '↓', L: '←', R: '→' };
    const seqTxt = (q) => q.slice(0, -1).split('').map((c) => arrow[c]).join(' ') + ' ' + q.slice(-1);
    const mkMoves = (side) => d.specials.filter((m) => m.side === side).map((m, i) => ({
      name: m.long, cls: m.sup ? 'is-super' : '', delay: 80 + i * 70,
      keys: m.seq.slice(0, -1).split('').map((c, j) => ({ t: arrow[c], cls: 'k-dir', d: j * 90 }))
        .concat([{ t: '+', cls: 'k-plus', d: (m.seq.length - 1) * 90 }, { t: m.seq.slice(-1), cls: 'k-btn', d: m.seq.length * 90 }])
    }));
    const fx = s.padFx;
    const fichas = this.fichaN();
    const invBy = {};
    d.inv.forEach((r) => { invBy[r[0]] = r; });
    const icons = this.invIcons();
    // the Lab's back button returns to the page it was opened from (the room, or a page of the site)
    const labFrom = ['inicio', 'projetos', 'sobre', 'contato'].indexOf(this._labFrom) >= 0 ? this._labFrom : 'quarto';
    const roomMode = !!s.backRoom && ['inicio', 'projetos', 'sobre', 'contato'].indexOf(page) >= 0;
    const labBack = { quarto: ['Voltar pro', 'quarto'], inicio: ['Voltar pro', 'Início'], projetos: ['Voltar pros', 'Projetos'], sobre: ['Voltar pro', 'Sobre'], contato: ['Voltar pro', 'Contato'] }[labFrom];
    const eqSel = s.eqSel || 'C++';
    const movesGot = this._moves || {};
    const movesAll = d.specials.length + d.secrets.length;
    const movesN = d.specials.concat(d.secrets).filter((m) => movesGot[m.seq]).length;
    const sm = s.snakeMode || 'off';
    const gameOpen = typeof s.gameOpen === 'number' ? s.gameOpen : -1;
    const gamesRead = s.gamesRead || 0;
    const hv = typeof s.hoverProj === 'number' ? s.hoverProj : 0;
    const op = typeof s.openProj === 'number' ? s.openProj : -1;
    const opd = d.projects[op >= 0 ? op : 0];
    const safeLocked = !!s.safeLock && Date.now() < s.safeLock;
    const safeLeft = safeLocked ? Math.ceil((s.safeLock - Date.now()) / 1000) : 0;
    const safeIn = s.safeIn || '';
    const safeSlots = [0, 1, 2, 3].map((i) => (i < safeIn.length ? '*' : '_')).join(' ');
    const invI = typeof s.inv === 'number' ? s.inv : 0;
    const glyph = { U: '↑', D: '↓', L: '←', R: '→', B: 'B', A: 'A' };
    const pad = s.padSeq || [];
    const blob = (id) => this.blob(id);
    const notBoot = page !== 'boot';
    const paused = !!s.paused && notBoot;
    const palOpen = !!s.palOpen && notBoot;
    const snd = !!s.snd;
    const up = Math.max(0, Math.floor(((s.now || Date.now()) - (this._born || Date.now())) / 1000));
    const p2 = (n) => ('0' + n).slice(-2);
    const uptime = p2(Math.floor(up / 3600)) + ':' + p2(Math.floor(up / 60) % 60) + ':' + p2(up % 60);
    const visited = ['inicio', 'projetos', 'lab', 'sobre', 'quarto', 'contato'].filter((k) => (this._visited || {})[k]).length;
    const bench = s.bench || [-1, -1];
    const benchSt = s.benchSt || '';
    const rec = benchSt === 'done' || benchSt === 'ready' ? d.recipes[s.benchRec] : null;
    const bSlot = (slot) => {
      const i = bench[slot];
      const it = i >= 0 ? d.inv[i] : null;
      return {
        k: it ? it[0] : '',
        cls: it ? 'is-full' + (it[4] ? ' k-' + it[4] : '') : '',
        aria: it ? 'Tirar ' + it[1] + ' da bancada' : 'Espaço vazio da bancada',
        take: () => this.benchTake(slot)
      };
    };
    const nIn = (bench[0] >= 0 ? 1 : 0) + (bench[1] >= 0 ? 1 : 0);
    let benchR;
    if (benchSt === 'ready') benchR = { k: '?', cls: 'is-ready', nCls: '', name: 'Algo está tomando forma…', desc: 'Clique no resultado pra craftar.', aria: 'Craftar' };
    else if (benchSt === 'done' && rec) benchR = { k: rec.k, cls: 'is-done', nCls: 'is-done', name: rec.name, desc: rec.desc + (s.benchFresh ? '' : ' (receita já conhecida)'), aria: 'Craftado: ' + rec.name };
    else if (benchSt === 'fail') benchR = { k: '×', cls: 'is-fail', nCls: '', name: bench[0] === bench[1] ? 'Não dá pra combinar um item com ele mesmo.' : 'Nada acontece.', desc: 'Essa combinação não gera nada. Ainda. O comando "receitas" no terminal dá um palpite.', aria: 'Sem receita' };
    else benchR = { k: '', cls: '', nCls: '', name: nIn ? 'Falta um item' : 'Bancada vazia', desc: nIn ? 'Escolha mais um item do inventário.' : 'Clique em dois itens do inventário pra combinar.', aria: 'Resultado da bancada' };
    const roomObj = typeof s.roomObj === 'number' ? d.room[s.roomObj] : null;
    const bub = s.bub || {};
    const bubN = Object.keys(bub).length;
    const palList = palOpen ? this.palFiltered() : [];
    const palSel = Math.min(s.palSel || 0, Math.max(0, palList.length - 1));
    const online = typeof navigator === 'undefined' || navigator.onLine !== false;
    const q = this.effQual();
    const qLabel = { auto: 'auto', alta: 'alta', media: 'média', eco: 'economia' };
    const canCont = this.canContinue();
    const ago = this._savedAt ? Math.max(0, Date.now() - this._savedAt) : 0;
    const agoTxt = !this._savedAt ? '' : (ago < 3600000 ? 'agora há pouco' : (ago < 86400000 ? 'há ' + Math.floor(ago / 3600000) + ' h' : 'há ' + Math.floor(ago / 86400000) + ' d'));
    const playTot = Math.max(0, Math.floor(((this._playMs || 0) + ((s.now || Date.now()) - (this._born || Date.now()))) / 1000));
    const playTxt = p2(Math.floor(playTot / 3600)) + ':' + p2(Math.floor(playTot / 60) % 60) + ':' + p2(playTot % 60);
    const diffStep = s.diffStep || 0;
    const trackI = typeof this._track === 'number' ? this._track : -1;
    const ctlK = s.ctl || 'hitbox';
    const isGb = ctlK === 'gb';
    const ctlCur = this.ctlList().find((c) => c.k === ctlK) || this.ctlList()[0];
    const mm = this._mini ? this._mini.mode : 'title';
    const skL = this.skLayout();
    const skSel = s.skSel || 'root';
    const skN = skL.nodes.find((n) => n.k === skSel) || skL.nodes[0];
    const dT = typeof s.dTask === 'number' ? d.d20Tasks[s.dTask] : null;
    const dMod = dT ? this.d20Mod(dT) : 0;
    const dR = s.dRoll || null;
    const focusOnce = (key) => (el) => {
      if (el && el !== this[key]) {
        this[key] = el;
        try {
          el.focus({ preventScroll: true });
        } catch (err) {
          this[key] = el;
        }
      }
    };
    const tap = (m) => (e) => {
      if (e && e.preventDefault) e.preventDefault();
      this.arcBtn(m, true);
    };
    return {
      rootCls: (s.seis ? 'is-seis' : '') + (s.powering ? ' is-off' : '') + (paused ? ' is-paused' : '') + ' q-' + q + (s.debug ? ' is-debug' : '') + (s.lag ? ' is-lag' : ''),
      canContinue: canCont,
      noContinue: !canCont,
      newCls: s.newArm ? 'is-warn' : '',
      newLabel: s.newArm ? 'apagar o save? clique de novo' : 'novo jogo',
      newGame: () => this.newGame(),
      newGameMute: () => this.newGame(false),
      continueGame: () => this.continueGame(),
      continueMute: () => this.continueGame(false),
      rootMove: (e) => {
        if (this.state && this.state.debug && e) {
          this._mx = e.clientX;
          this._my = e.clientY;
          this._mt = e.target;
        }
      },
      glassCls: s.broke ? 'is-broken' : '',
      glassDown: (e) => { if (!this.st().broke) this.holdStart('glass', e); },
      holdEnd: () => this.holdEnd(),
      glassKey: (e) => this.glassKey(e),
      glassClick: () => this.glassClick(),
      glassHint: s.broke ? 'vidro quebrado · clique pra abrir' : (s.glassNag ? 'segure mais um pouco' : 'segure pra quebrar o vidro'),
      pwrDown: (e) => this.holdStart('pwr', e),
      pwrKey: (e) => this.pwrKey(e),
      pwrClick: () => this.pwrClick(),
      pwrHint: !!s.pwrHint,
      decH1: (el) => {
        if (el && this._decSeen && !this._decSeen.has(el)) {
          this._decSeen.add(el);
          this.scramble(el, null, 650, 160, true);
        }
      },
      decDr: (el) => {
        if (el && this._decSeen && !this._decSeen.has(el)) {
          this._decSeen.add(el);
          this.scramble(el, null, 520, 120, true);
        }
      },
      setDiffEl: (el) => this.diffRef(el),
      setDiffAdd: (el) => {
        this._diffAddEl = el;
        if (el && (this.state || {}).diffStep === 3) el.textContent = this.diffText();
      },
      diffDelCls: diffStep >= 1 ? 'is-struck' : '',
      diffAddCls: diffStep < 2 ? 'is-wait' : '',
      diffCurCls: diffStep === 2 ? 'diff-cur' : '',
      diffMerged: diffStep === 3,
      recOpen: !!s.recOpen,
      recBackdrop: (e) => { if (e && e.target === e.currentTarget) this.closeRec(); },
      closeRec: () => this.closeRec(),
      setRecFirst: focusOnce('_recEl'),
      recMailLabel: s.copied === 'ok' ? 'E-mail copiado' : (s.copied === 'fail' ? 'Copie à mão: hogasawara2311@outlook.com' : 'Copiar e-mail'),
      recSite: () => {
        this.setState({ backRoom: false });
        this.recGo('inicio');
      },
      recRoom: () => {
        if (this.curPage() === 'inicio') return this.toRoom();
        if (this.curPage() === 'boot') this._rm = null;
        this.recGo('quarto');
      },
      recProjects: d.projects.map((p, i) => ({ num: p.num, title: p.title, line: p.line, open: () => this.recGo('projetos', () => this.openProj(i)) })),
      skOpen: !!s.skOpen,
      skBackdrop: (e) => { if (e && e.target === e.currentTarget) this.skClose(); },
      skClose: () => this.skClose(),
      setSkWrap: focusOnce('_skWrap'),
      skNodes: skL.nodes.map((n) => ({ tf: 'translate(' + n.x + ',' + n.y + ')', label: n.label, tx: n.tx, ta: n.ta, cls: n.cls + (skSel === n.k ? ' is-sel' : ''), pick: () => this.skPick(n.k) })),
      skLinks: skL.links,
      skHeads: skL.heads,
      skName: skN ? skN.full : '',
      skDesc: skN ? skN.desc : '',
      skHint: this.coarse() ? 'toque num nó' : 'passe o mouse pelos nós',
      dOpen: !!s.dOpen,
      dBackdrop: (e) => { if (e && e.target === e.currentTarget) this.d20Close(); },
      dClose: () => this.d20Close(),
      setDWrap: focusOnce('_dWrap'),
      dKey: (e) => this.d20Key(e),
      dRoll: () => this.d20Roll(),
      dAreaName: dT ? d.d20Areas[dT.area][0] : '',
      dOpener: d.d20Openers[s.dOpener || 0],
      dTaskText: dT ? dT.t : '',
      dDc: dT ? dT.dc : 0,
      dModCls: dMod >= 0 ? 'is-plus' : 'is-minus',
      dModTxt: (dMod >= 0 ? '+' : '−') + Math.abs(dMod),
      dAdvOn: !!(dT && dT.adv),
      dAdvCls: dT && dT.adv > 0 ? 'is-adv' : 'is-dis',
      dAdvTxt: dT && dT.adv > 0 ? 'Vantagem' : 'Desvantagem',
      dAdvWhy: (dT && dT.why) || '',
      dRule: dT && dT.adv ? (dT.adv > 0 ? 'Vantagem: dois dados, vale o maior.' : 'Desvantagem: dois dados, vale o menor.') + ' ' + 'Passa se dado + modificador chegar na dificuldade. 20 natural acerta e 1 natural erra, sem olhar modificador.' : 'Passa se dado + modificador chegar na dificuldade. 20 natural acerta e 1 natural erra, sem olhar modificador.',
      dTwo: !!(dT && dT.adv),
      dDiceCls: dR && dR.phase === 'rolling' ? 'is-rolling' : '',
      dFaceA: dR ? dR.fa : 20,
      dFaceB: dR ? dR.fb : 20,
      dDieACls: !dR ? 'is-idle' : (dR.phase === 'done' ? (dR.two && dR.use !== dR.a ? 'is-out' : (dR.crit === 1 ? 'is-crit' : (dR.crit === -1 ? 'is-fumble' : ''))) : ''),
      dDieBCls: !dR ? 'is-idle' : (dR.phase === 'done' ? (dR.use !== dR.b || (dR.a === dR.b) ? 'is-out' : (dR.crit === 1 ? 'is-crit' : (dR.crit === -1 ? 'is-fumble' : ''))) : ''),
      dMathCls: dR && dR.phase === 'done' ? 'is-on' : '',
      dMath: dR && dR.phase === 'done' ? (dR.crit ? (dR.crit === 1 ? '20 natural: modificador nem entra' : '1 natural: modificador nem salva') : dR.use + ' ' + (dR.mod >= 0 ? '+ ' + dR.mod : '− ' + Math.abs(dR.mod)) + ' = ' + dR.total + ' vs DC ' + dR.dc) : (dR ? 'rolando...' : 'DC ' + (dT ? dT.dc : 0) + ' · modificador ' + (dMod >= 0 ? '+' : '−') + Math.abs(dMod)),
      dVerdict: dR && dR.phase === 'done' ? (dR.crit === 1 ? 'CRÍTICO!' : (dR.crit === -1 ? 'FALHA CRÍTICA' : (dR.ok ? 'SUCESSO' : 'FALHA'))) : '',
      dVerdictCls: dR && dR.phase === 'done' ? (dR.crit === 1 ? 'is-crit' : (dR.ok ? 'is-ok' : 'is-fail')) : '',
      dReact: dR && dR.phase === 'done' ? 'O chefe: ' + d.d20React[dR.crit === 1 ? 'crit' : (dR.crit === -1 ? 'fumble' : (dR.ok ? 'ok' : 'fail'))][s.dReact || 0] : '',
      dRollLabel: dR && dR.phase === 'done' ? 'Nova missão' : (dR ? 'Rolando' : (dT && dT.adv ? 'Rolar 2d20' : 'Rolar o d20')),
      dKeysHint: 'Enter ou R rola · esc fecha',
      tripOn: !!s.trip,
      tripCls: s.trip === 2 ? 'is-run' : '',
      tripArr: s.trip === 2 ? '»»' : '»',
      tripLabel: s.trip === 2 ? 'PULAR' : 'ACELERAR',
      tripKey: this.coarse() ? '' : 'ou qualquer tecla',
      tripPush: () => this.tripPush(),
      pcOpen: !!s.pcOpen,
      pcBackdrop: (e) => { if (e && e.target === e.currentTarget) this.closePc(); },
      closePc: () => this.closePc(),
      setPcWrap: focusOnce('_pcWrap'),
      pcKey: (e) => this.pcKey(e),
      pcKeyUp: (e) => this.pcKeyUp(e),
      setPcCanvas: (el) => {
        this._pcCv = el;
        if (!el || !el.getBoundingClientRect) return;
        const r = el.getBoundingClientRect();
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const w = Math.max(300, Math.round((r.width || 720) * dpr));
        if (el.width !== w) {
          el.width = w;
          el.height = Math.round(w / 3);
        }
      },
      pcCvDown: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this._pcPtr = true;
        if (this._pcWrap && this._pcWrap.focus) {
          try {
            this._pcWrap.focus({ preventScroll: true });
          } catch (err) {
            this._pcWrap = this._pcWrap || null;
          }
        }
        this.pcPress('j', true);
      },
      pcCvUp: () => {
        if (!this._pcPtr) return;
        this._pcPtr = false;
        this.pcPress('j', false);
      },
      pcJumpDn: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.pcPress('j', true);
      },
      pcJumpUp: () => this.pcPress('j', false),
      pcDuckDn: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.pcPress('d', true);
      },
      pcDuckUp: () => this.pcPress('d', false),
      arcOpen: !!s.arcOpen,
      arcBackdrop: (e) => { if (e && e.target === e.currentTarget) this.closeArcade(); },
      closeArcade: () => this.closeArcade(),
      setArcWrap: focusOnce('_arcWrap'),
      arcKey: (e) => this.arcKey(e),
      arcKeyUp: (e) => this.arcKeyUp(e),
      arcShowGo: (s.arcMode || 'title') === 'title' || s.arcMode === 'over',
      arcGoLabel: s.arcMode === 'over' ? 'JOGAR DE NOVO' : 'JOGAR',
      arcPlay: () => this.arcPlay(),
      arcCvClick: () => {
        if (this._arc && this._arc.mode === 'title') this.arcPlay();
      },
      setArcCanvas: (el) => {
        this._arcCv = el;
        if (!el || !el.getBoundingClientRect) return;
        const r = el.getBoundingClientRect();
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const w = Math.max(320, Math.round((r.width || 640) * dpr));
        if (el.width !== w) {
          el.width = w;
          el.height = Math.round(w * 0.75);
        }
      },
      akL: tap('l'),
      akLUp: () => this.arcBtn('l', false),
      akR: tap('r'),
      akRUp: () => this.arcBtn('r', false),
      akF: tap('f'),
      akFUp: () => this.arcBtn('f', false),
      debug: !!s.debug,
      setDbgEl: (el) => { this._dbgEl = el; },
      setDbgCv: (el) => { this._dbgCv = el; },
      savingIcon: !!s.savingIcon,
      credOpen: !!s.credOpen,
      credRolling: !!s.credOpen && !s.credEnd,
      credEnd: !!s.credOpen && !!s.credEnd,
      closeCredits: () => this.closeCredits(),
      openCredits: () => this.openCredits(),
      setCredFirst: focusOnce('_credEl'),
      credList: d.credits.map((c) => ({ role: c.role, names: c.names.map((t) => ({ t: t })) })),
      credStats: 'tempo de jogo ' + playTxt + ' · ' + gotCount + '/' + d.trophies.length + ' troféus',
      credContact: () => {
        this.closeCredits();
        this.go('contato');
      },
      panic: !!s.panic,
      setPanicEl: focusOnce('_panicEl'),
      panicEnd: () => this.panicEnd(),
      panicLines: d.panicLines.map((l, i) => ({ t: l[0], cls: l[1], d: 150 + i * 150 })),
      shatter: !!s.shatter,
      shPath: s.shPath || 'M0 0',
      shards: s.shards || [],
      qualShort: 'vídeo ' + ((this._qual || 'auto') === 'auto' ? 'auto·' + qLabel[q] : qLabel[q]),
      qualTxt: (this._qual || 'auto') === 'auto' ? 'auto (' + qLabel[q] + ')' : qLabel[q],
      cycleQual: () => this.cycleQual(),
      trackTxt: trackI >= 0 ? '0' + (trackI + 1) + ' · ' + this.tracks()[trackI].name : 'desligada',
      cycleTrack: () => this.cycleTrack(),
      pmGlassHint: s.broke ? 'modo recrutador' : (s.glassNag ? 'segure mais um pouco' : 'segure · modo recrutador'),
      eraseSave: () => this.eraseSave(),
      memTxt: !this.store() ? 'sem acesso ao navegador' : (this._noSave ? 'desligado · clique pra ligar' : (s.eraseArm ? 'apagar? clique de novo' : 'slot 1 · ' + gotCount + '/' + d.trophies.length)),
      arcBest: this.arcHi()[0][0] + ' · ' + this.arcHi()[0][1],
      saveWhere: this._noSave ? 'desligado' : (this._saveOk ? 'neste navegador' : 'só nesta sessão'),
      pulse: (e) => this.pulse(e),
      hoverSfx: (e) => this.hoverSfx(e),
      rootKey: (e) => this.rootKey(e),
      rootKeyUp: (e) => this.rootKeyUp(e),
      setRoot: (el) => { if (el) this._rootEl = el; },
      brandHome: () => (roomMode ? this.toRoom() : this.navGo('inicio')),
      powering: !!s.powering,
      credits: ('0' + fichas).slice(-2),
      hasSave: canCont,
      saveTxt: gotCount + '/' + d.trophies.length + ' troféus' + (agoTxt ? ' · ' + agoTxt : ''),
      isBoot: page === 'boot',
      bootLogOn: page === 'boot' && !!s.bootLog,
      bootLines: (s.bootLog ? d.bootLog.slice(0, s.bootN || 0) : []).map((l) => ({ ts: l.ts || '', t: l.t, dots: !!l.tag, tag: { ok: '[  OK  ]', warn: '[ WARN ]', fail: '[ FAIL ]' }[l.tag] || '', tagCls: l.tag ? 'is-' + l.tag : '', note: l.note || l.took || '', cls: (l.fatal ? 'is-fatal' : (l.tag ? 'is-' + l.tag : '')) })),
      bootLogCls: s.bootDone ? 'is-done' : '',
      bootCurTs: (s.bootN || 0) < d.bootLog.length ? '' : '1.744001',
      notBoot: notBoot,
      isInicio: page === 'inicio',
      isProjetos: page === 'projetos',
      isLab: page === 'lab',
      isSobre: page === 'sobre',
      isQuarto: page === 'quarto',
      isContato: page === 'contato',
      pressStart: () => this.pressStart(true),
      pressMute: () => this.pressStart(false),
      sndPressed: snd ? 'true' : 'false',
      sndState: snd ? 'ligado' : 'desligado',
      toggleSnd: () => this.toggleSnd(),
      openPal: () => this.openPal(),
      palBtnCls: palOpen ? 'is-on' : '',
      openPause: () => this.setPause(true),
      pauseBtnCls: paused ? 'is-on' : '',
      paused: paused,
      pauseBackdrop: (e) => { if (e && e.target === e.currentTarget) this.setPause(false); },
      resume: () => this.setPause(false),
      setPauseFirst: (el) => {
        if (el && el !== this._pauseEl) {
          this._pauseEl = el;
          try { el.focus({ preventScroll: true }); } catch (err) { this._pauseEl = el; }
        }
      },
      pauseTro: () => this.openAch(),
      pausePal: () => { this.setState({ paused: false }); this.openPal(); },
      pauseReboot: () => { this.setState({ paused: false }); this.reboot(); },
      visitedTxt: visited + '/6',
      uptime: uptime,
      onCls: online ? '' : 'is-off',
      onTxt: online ? 'online' : 'offline',
      ttfbTxt: this._ttfb || 'ttfb —',
      setFpsEl: (el) => {
        this._fpsEl = el;
        if (el && this._fps) el.textContent = this._fps + ' fps';
      },
      palOpen: palOpen,
      palQ: s.palQ || '',
      palChange: (e) => this.setState({ palQ: e.target.value, palSel: 0 }),
      palKey: (e) => this.palKey(e),
      palBackdrop: (e) => { if (e && e.target === e.currentTarget) this.closePal(); },
      setPalInput: (el) => {
        if (el && el !== this._palInEl) {
          this._palInEl = el;
          try { el.focus({ preventScroll: true }); } catch (err) { this._palInEl = el; }
        }
      },
      setPalList: (el) => { this._palList = el; },
      palItems: palList.map((it, i) => ({
        k: it.k, name: it.name, hint: it.hint, href: it.href || '',
        isLink: !!it.href, isBtn: !it.href,
        cls: i === palSel ? 'is-sel' : '', sel: i === palSel ? 'true' : 'false',
        run: (e) => this.palRun(it, e),
        hover: () => { if ((this.st().palSel || 0) !== i) this.setState({ palSel: i }); }
      })),
      palEmpty: palOpen && !palList.length,
      palCount: palList.length === 1 ? '1 comando' : palList.length + ' comandos',
      sleeping: !!s.sleeping,
      sleepTxt: s.sleeping === 2 ? 'Save concluído.' : 'Salvando o jogo…',
      hwFaces: d.hwFaces,
      swFaces: d.swFaces,
      hwDown: (e) => this.mDown('hw', e),
      swDown: (e) => this.mDown('sw', e),
      mMove: (e) => this.mMove(e),
      mUp: (e) => this.mUp(e),
      setHwModel: (el) => {
        this._mEl = this._mEl || {};
        this._mEl.hw = el;
        if (el) this.startLoop();
      },
      setSwModel: (el) => {
        this._mEl = this._mEl || {};
        this._mEl.sw = el;
        if (el) this.startLoop();
      },
      recipesGot: Object.keys(this._recipes || {}).length,
      recipesTotal: d.recipes.length,
      benchA: bSlot(0),
      benchB: bSlot(1),
      benchR: benchR,
      benchHasItems: nIn > 0,
      craft: () => this.craft(),
      benchClear: () => this.benchClear(),
      roomSeen: this.roomSeenN(),
      roomTotal: this.roomTotal(),
      setRmAtlas: (el) => { if (el) this._rmAtlasEl = el; },
      setRmBox: (el) => { if (el !== this._rmBox) { this._rmBox = el || null; this._rmFitK = ''; } },
      setRmWrap: (el) => { if (el !== this._rmWrap) { this._rmWrap = el || null; this._rmFitK = ''; } },
      setRmCv: (el) => {
        if (el !== this._rmCv) {
          this._rmCv = el || null;
          this._rmFitK = '';
          if (el) this.startLoop();
        }
      },
      rmPointer: (e) => this.rmPointer(e),
      rmHover: (e) => this.rmHover(e),
      rmLeave: () => { if (this.st().rmHov >= 0) this.setState({ rmHov: -1 }); },
      rmHovOn: typeof s.rmHov === 'number' && s.rmHov >= 0 && !s.rmDlg && !!d.room[s.rmHov],
      rmHovName: typeof s.rmHov === 'number' && d.room[s.rmHov] ? (d.room[s.rmHov].door ? 'Porta · sair pro site comum' : d.room[s.rmHov].name + ' · clique pra ir até lá') : '',
      rmDlgOn: !!s.rmDlg,
      rmHovOff: !(typeof s.rmHov === 'number' && s.rmHov >= 0 && !s.rmDlg && !!d.room[s.rmHov]),
      rmDlgCls: (() => {
        const ti = this.rmIntroTarget();
        const y = ti >= 0 ? d.room[ti].t[1] : (this._rm ? this._rm.y : 12);
        return y >= 8 ? 'is-top' : '';
      })(),
      rmHelp: this.coarse() ? 'Toque no chão pra andar · toque nos objetos pra interagir' : 'Setas ou WASD pra andar · E ou espaço pra interagir · ou clique',
      dlgSkip: (e) => {
        if (this._dlg && !this._dlg.done) {
          this._dlg.done = true;
          return;
        }
        const t = e && e.target;
        if (!(t && t.closest && t.closest('button'))) this.rmClose();
      },
      dlgObj: s.rmIntro ? '· ' + ((this.rmIntroLines()[s.rmStep || 0] || {}).label || 'Quarto') + ' · ' + ((s.rmStep || 0) + 1) + '/' + this.rmIntroLines().length : (s.dlgWho ? '' : (roomObj ? '· ' + roomObj.name : '· Quarto')),
      dlgText: s.dlgText || 'Clique em qualquer coisa. Aqui cada objeto tem uma história.',
      dlgWho: (!s.rmIntro && s.dlgWho) || 'Hikaru',
      setDlgEl: (el) => {
        if (el && el !== this._dlgEl) {
          this._dlgEl = el;
          if (!this._dlg) this._dlg = { text: 'Clique em qualquer coisa. Aqui cada objeto tem uma história.', t0: 0, shown: 0, done: false };
          else this._dlg = Object.assign({}, this._dlg, { t0: 0, shown: 0, done: false });
          this.startLoop();
        }
      },
      dlgActs: this.rmActs().map((a, i) => ({ label: a[0], cls: i === (s.rmSel || 0) ? 'is-sel' : '', run: (e) => this.rmRun(a[1], e) })),
      bubbles: Array.from({ length: 24 }, (x, i) => ({
        // the ficha bubble looks exactly like the others until it is popped: the coin is a surprise
        cls: (bub[i] ? 'is-pop' : '') + (i === this._bubCoin && bub[i] ? ' is-coin' : ''),
        aria: 'Bolha ' + (i + 1) + (bub[i] ? ', estourada' : ''),
        pop: () => this.popBubble(i)
      })),
      bubLeft: bubN >= 24 ? 'folha zerada' : (24 - bubN) + ' bolhas',
      bubDone: bubN >= 24,
      bubRefill: () => this.bubRefill(),
      pathTail: tail(page),
      nextTail: tail(s.nextPage),
      // opened from something in the room: the top bar only offers the way back (plus the right-hand HUD)
      navGame: page === 'quarto' || page === 'lab' || roomMode,
      navRoom: roomMode,
      navOn: page !== 'quarto' && page !== 'lab' && !roomMode,
      backToRoom: () => this.toRoom(),
      labBackPre: labBack[0],
      labBackName: labBack[1],
      labBackAria: labBack[0] + ' ' + labBack[1],
      labBack: () => (labFrom === 'quarto' ? this.toRoom() : this.go(labFrom)),
      pauseRoomLabel: page === 'quarto' || page === 'lab' ? 'Ir pro site comum' : 'Voltar pro quarto',
      pauseRoomHint: page === 'quarto' || page === 'lab' ? 'início' : 'jogo',
      pauseRoom: () => {
        if (page === 'quarto' || page === 'lab') {
          this.setState({ backRoom: false });
          this.go('inicio');
        } else this.toRoom();
      },
      nav: d.nav.map((n, i) => ({
        label: n[1], idx: '0' + (i + 1), cls: page === n[0] ? 'is-on' : '', cur: page === n[0] ? 'page' : 'false', go: () => this.navGo(n[0]),
        enter: (e) => {
          const l = e && e.currentTarget && e.currentTarget.querySelector ? e.currentTarget.querySelector('.nav-l') : null;
          if (l) this.scramble(l, n[1], 320, 0, false);
        }
      })),
      clock: this.clock(),
      gotCount: gotCount,
      trophyTotal: d.trophies.length,
      trophyPct: Math.round(gotCount / d.trophies.length * 100),
      allGot: gotCount === d.trophies.length,
      trophiesOpen: !!s.troOpen,
      troBtnCls: s.troOpen ? 'is-on' : '',
      troExpanded: s.troOpen ? 'true' : 'false',
      toggleTro: () => this.setState({ troOpen: !this.st().troOpen }),
      troRecent: troIds.slice().reverse().slice(0, 5).map((id) => {
        const t = troBy[id];
        return { name: t.name, desc: t.done, ic: t.ic };
      }),
      troNone: !troIds.length,
      troNext: troNext.map((t) => ({ name: t.name, desc: t.goal, ic: t.ic })),
      troHasNext: troNext.length > 0,
      troNoteOn: !troNext.length && gotCount < d.trophies.length,
      openAchAll: () => this.openAch(),
      achOpen: !!s.achOpen,
      closeAch: () => this.closeAch(),
      achBackdrop: (e) => { if (e && e.target === e.currentTarget) this.closeAch(); },
      achKey: (e) => this.achKey(e),
      setAchGrid: (el) => {
        this._achGrid = el || null;
        if (el && this._achFocus) {
          this._achFocus = false;
          const on = el.querySelector ? el.querySelector('.ach-s.is-on') : null;
          if (on && on.focus) {
            try {
              on.focus({ preventScroll: true });
            } catch (err) {
              on.focus();
            }
          }
        }
      },
      achStats: 'secretas ' + secGot + '/' + secAll,
      achList: d.trophies.map((t) => {
        const g = !!got[t.id];
        const on = t.id === achT.id;
        const shown = g || !t.secret;
        return {
          cls: (g ? 'is-got' : '') + (!g && t.secret ? ' is-sec' : '') + (on ? ' is-on' : ''),
          ic: shown ? t.ic : d.trophyQ,
          tip: shown ? t.name : 'Conquista secreta',
          aria: (shown ? t.name : 'Conquista secreta') + (g ? ', desbloqueada' : ', bloqueada'),
          on: on ? 'true' : 'false',
          pick: () => { if (this.st().achSel !== t.id) this.setState({ achSel: t.id }); }
        };
      }),
      achDIc: achGot || !achT.secret ? achT.ic : d.trophyQ,
      achDCls: achGot ? 'is-got' : '',
      achDName: achGot || !achT.secret ? achT.name : '? ? ?',
      achDSt: achGot ? 'Desbloqueada' : (achT.secret ? 'Secreta · bloqueada' : 'Bloqueada'),
      achDDesc: achGot ? achT.done : (achT.secret ? achT.hint : achT.goal),
      achDHintBtn: !achGot && !!d.hints[achT.id] && s.achHint !== achT.id,
      achDHintOn: !achGot && s.achHint === achT.id,
      achDHint: this.achHintText(achT.id),
      achShowHint: () => { this.sfx('select'); this.setState({ achHint: this.st().achSel || achT.id }); },
      toastA: !!s.toast && s.toastSlot === 'a',
      toastB: !!s.toast && s.toastSlot === 'b',
      toastName: s.toast ? s.toast.name : '',
      toastKick: s.toast ? s.toast.kick || 'Conquista desbloqueada' : '',
      toastKCls: s.toast && s.toast.info ? 'is-info' : '',
      toastTro: !(s.toast && s.toast.info),
      toastIc: s.toast && s.toast.ic ? s.toast.ic : 'M8 4h8v5a4 4 0 0 1-8 0z M8 6H5.5v1.2A3 3 0 0 0 8 10.2M16 6h2.5v1.2A3 3 0 0 1 16 10.2M12 13v4M9 20h6M10 17h4',
      toastInf: !!(s.toast && s.toast.info),
      hwCls: main === 'hw' ? 'is-sel' : '',
      secCls: main === 'sec' ? 'is-sel' : '',
      swCls: main === 'sw' ? 'is-sel' : '',
      swPressed: main === 'sw' ? 'true' : 'false',
      pickSw: () => this.pick('sw'),
      isSw: main === 'sw',
      movesSw: mkMoves('sw'),
      hwPressed: main === 'hw' ? 'true' : 'false',
      secPressed: main === 'sec' ? 'true' : 'false',
      pickHw: () => this.pick('hw'),
      pickSec: () => this.pick('sec'),
      isHw: main === 'hw',
      isSec: main === 'sec',
      movesHw: mkMoves('hw'),
      movesSec: mkMoves('sec'),
      goProjetos: () => this.go('projetos'),
      goSobre: () => this.go('sobre'),
      // the walkable layer of the regular site (doors at both screen edges, the little guy)
      worldOn: this.worldOn(),
      worldCls: s.doorTip ? 'is-tip' : '',
      setWorld: (el) => {
        this._wEl = el || null;
        if (el) this.startLoop();
      },
      setWorldCv: (el) => { this._wCv = el || null; },
      setDoorImg: (el) => { this._doorImg = el || null; },
      setWdL: (el) => { this._wdL = el || null; },
      wkHintOn: !!s.wkHint,
      setWkHint: (el) => { this._wkHintEl = el || null; },
      setWdR: (el) => { this._wdR = el || null; },
      wdLTip: this.worldTip(page, 'L'),
      wdRTip: this.worldTip(page, 'R'),
      wdROn: !!this.worldDoorTo(page, 'R'),
      wdL: () => this.worldUseDoor('L'),
      wdR: () => this.worldUseDoor('R'),
      wdLHov: () => { this._wHov = 'L'; },
      wdRHov: () => { this._wHov = 'R'; },
      wdOff: () => { this._wHov = null; },
      projects: d.projects.map((p, i) => ({
        num: p.num, title: p.title, line: p.line, tags: p.tags, status: p.status, period: p.period,
        delay: 300 + i * 90, cls: hv === i ? 'is-hv' : '',
        open: () => this.openProj(i), hover: () => this.hoverProj(i)
      })),
      hv0: hv === 0,
      hv1: hv === 1,
      hv2: hv === 2,
      hv3: hv === 3,
      hvNum: d.projects[hv].num,
      hvTitle: d.projects[hv].title,
      hasOpen: op >= 0,
      isSafe: op === 2,
      safeCls: s.safeOpen ? 'is-open' : (safeLocked ? 'is-locked' : (s.safeMsg === 'wrong' ? 'is-wrong' : '')),
      safeState: s.safeOpen ? 'aberta' : 'fechada',
      safeL1: s.safeOpen ? 'ABERTO' : (safeLocked ? 'BLOQUEADO' : (s.safeMsg === 'wrong' ? 'SENHA INCORRETA' : 'SENHA:')),
      safeL2: s.safeOpen ? 'trava liberada' : (safeLocked ? 'aguarde ' + safeLeft + ' s' : (s.safeMsg === 'wrong' ? 'tentativa ' + (s.safeTries || 0) + '/3' : safeSlots)),
      safeKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => ({
        t: k,
        aria: k === '*' ? 'Apagar' : (k === '#' ? 'Confirmar' : 'Tecla ' + k),
        press: () => this.safeKey(k)
      })),
      closeProj: () => this.setState({ openProj: -1 }),
      nextProj: () => this.nextProj(),
      op: {
        num: opd.num, title: opd.title, status: opd.status, period: opd.period, sub: opd.sub, summary: opd.summary, credit: opd.credit,
        points: opd.points.map((t) => ({ t: t })),
        stack: opd.stack.map((t) => ({ t: t }))
      },
      termLines: s.termLines || d.termInit,
      termInput: s.termInput || '',
      termPrompt: 'okaru@lab:~' + (this._cwd ? '/' + this._cwd : '') + '$',
      onTermChange: (e) => this.setState({ termInput: e.target.value }),
      onTermKey: (e) => this.termKey(e),
      setTermInput: (el) => { this._termInput = el; },
      setTermBody: (el) => { this._termBody = el; },
      focusTerm: () => { if (this._termInput) this._termInput.focus(); },
      hexRows: d.hex,
      dumpCls: s.bent ? 'is-bent' : '',
      dumpMsg: s.bent ? 'Impureza em 0x005a. Todo metal tem um pouco de terra.' : 'checksum ok · pureza do metal: 99%',
      inv: d.inv.map((it, i) => ({
        k: it[0], name: it[1], aria: it[1] + ': levar à bancada',
        cls: (it[4] ? 'k-' + it[4] : '') + (invI === i ? ' is-on' : '') + (bench[0] === i || bench[1] === i ? ' in-b' : ''),
        pick: () => this.pickInv(i),
        use: () => this.benchUse(i)
      })),
      invSel: { name: d.inv[invI][1], cat: d.inv[invI][2], used: d.inv[invI][3] },
      invCount: d.inv.length,
      padU: () => this.pad('U'),
      padD: () => this.pad('D'),
      padL: () => this.pad('L'),
      padR: () => this.pad('R'),
      padA: () => this.pad('A'),
      padB: () => this.pad('B'),
      padDisplay: fx ? (fx.sec ? 'SECRETO! ' : (fx.sup ? 'SUPER! ' : 'ESPECIAL! ')) + fx.name : (pad.length ? pad.map((k) => glyph[k]).join(' ') : '— — —'),
      padCls: fx ? 'is-fx is-fx-' + fx.slot + (fx.sup ? ' is-sup' : '') + (fx.sec ? ' is-sec' : '') : '',
      padSub: fx ? (fx.sub || ('golpe ' + movesN + '/' + movesAll)) + (fx.first ? ' · novo!' : '') : (pad.length ? 'termine com A ou B' : (s.padNote || 'faça um golpe da lista')),
      movesTxt: movesN + '/' + movesAll,
      moveList: d.specials.map((m) => ({ name: m.name, inp: seqTxt(m.seq), cls: (movesGot[m.seq] ? 'is-got' : '') + (m.sup ? ' is-sup' : '') }))
        .concat(d.secrets.map((m) => (movesGot[m.seq] ? { name: m.name, inp: seqTxt(m.seq), cls: 'is-got is-sec' } : { name: 'secreto ???', inp: '? ? ?', cls: 'is-sec' }))),
      lcdIdle: isGb && sm === 'off' && !s.lcdList && !s.lcdMenu,
      lcdMenuOn: isGb && !!s.lcdMenu,
      lcdCardOn: isGb && !!s.lcdMenu && sm === 'off',
      menuItems: this.lcdMenuItems().map((it, i, all) => ({
        label: it[1],
        cls: Math.min(s.menuI || 0, all.length - 1) === i ? 'is-on' : '',
        run: () => this.menuRun(it[0]),
        hover: () => { if ((this.st().menuI || 0) !== i) this.setState({ menuI: i }); }
      })),
      snakeHiTxt: String(this._snakeHi || 0),
      lcdList: isGb && sm === 'off' && !!s.lcdList,
      lcdCls: (isGb ? sm !== 'off' : mm !== 'title') ? 'is-game' : '',
      lcdHint: !isGb ? ctlCur.hint : (s.lcdMenu ? '↑ ↓ escolhe · A ok · B volta' : (sm === 'play' ? 'start pausa · select menu' : (sm === 'pause' ? 'start continua · select menu' : (sm === 'over' ? 'start de novo · select menu' : (s.lcdList ? '↑ ↓ rola · B volta' : 'start cobrinha · select menu'))))),
      snakeLive: isGb && sm === 'over',
      // the other controllers
      isGb: isGb,
      isAtari: ctlK === 'atari',
      isSms: ctlK === 'sms',
      isN64: ctlK === 'n64',
      isPad: ctlK === 'pad',
      ctlName: ctlCur.name,
      ctlSub: isGb ? 'golpes ' + movesN + '/' + movesAll : ctlCur.game,
      ctlPrev: () => this.ctlStep(-1),
      ctlNext: () => this.ctlStep(1),
      miniIdle: !isGb && mm === 'title',
      miniTitle: ctlCur.game.toUpperCase(),
      miniSub: { atari: 'atravesse as oito pistas. Uma pulada por clique.', sms: 'empurre as caixas até as marcas. 1 reinicia.', n64: 'um C acende: clique nele antes de apagar.', pad: 'olhe a sequência dos botões e repita.' }[ctlK] || '',
      mU: () => this.miniIn('U'),
      mD: () => this.miniIn('D'),
      mL: () => this.miniIn('L'),
      mR: () => this.miniIn('R'),
      mA: () => this.miniIn('A'),
      mB: () => this.miniIn('B'),
      mX: () => this.miniIn('X'),
      mY: () => this.miniIn('Y'),
      mS: () => this.miniIn('S'),
      snakeSr: sm === 'over' ? 'Fim de jogo na cobrinha: ' + ((this._snake && this._snake.score) || 0) + ' maçãs.' : '',
      selLabel: s.lcdMenu ? 'fecha' : 'menu',
      startLabel: s.lcdMenu ? 'fecha' : (sm === 'play' ? 'pausa' : (sm === 'pause' ? 'continua' : (sm === 'over' ? 'de novo' : 'cobrinha'))),
      padSelect: () => this.padSelect(),
      padStart: () => this.padStart(),
      setPadEl: (el) => { if (el) this._padEl = el; },
      setLcdList: (el) => { this._lcdListEl = el; },
      setLcdCv: (el) => {
        this._lcdCv = el;
        if (!el || !el.getBoundingClientRect) return;
        const r = el.getBoundingClientRect();
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const w = Math.max(160, Math.round((r.width || 320) * dpr));
        if (el.width !== w) {
          el.width = w;
          el.height = Math.round(w * 0.6);
        }
      },
      hdkA: s.hdk === 'a',
      hdkB: s.hdk === 'b',
      hdkX: s.hdkX || 0,
      hdkY: s.hdkY || 0,
      equip: d.equip.map((e) => {
        const it = invBy[e.k];
        const logo = !e.empty && d.logos[e.icon];
        const glyph = !e.empty && !logo ? d.glyphs[e.icon] : '';
        return {
          short: e.short,
          cls: (e.empty ? 'is-empty' : '') + (eqSel === e.k ? ' is-on' : ''),
          aria: e.empty ? 'Slot vazio' : (e.name || (it ? it[1] : e.short)) + ', ' + e.slot,
          d: logo || glyph || '',
          fill: logo ? e.col : 'none',
          stroke: glyph ? e.col : 'none',
          sw: glyph ? 1.6 : 0,
          pick: () => { if (this.st().eqSel !== e.k) this.setState({ eqSel: e.k }); }
        };
      }),
      bag: d.bag.map((b) => {
        const it = invBy[b[0]] || [b[0], b[0], '', ''];
        const logo = d.logos[b[1]];
        return {
          cls: (eqSel === b[0] ? 'is-on' : '') + (b[5] * b[6] > 1 ? ' is-big' : ''),
          gc: b[3] + ' / span ' + b[5],
          gr: b[4] + ' / span ' + b[6],
          aria: it[1] + ', ' + it[2],
          d: logo || d.glyphs[b[1]] || '',
          fill: logo ? b[2] : 'none',
          stroke: logo ? 'none' : b[2],
          sw: logo ? 0 : 1.6,
          pick: () => { if (this.st().eqSel !== b[0]) this.setState({ eqSel: b[0] }); }
        };
      }),
      bagCount: d.bag.length + ' itens',
      eqName: this.eqInfo(eqSel, invBy).name,
      // every description is rendered stacked in one grid cell (only the picked one visible),
      // so the box is always as tall as the longest one and never resizes on hover
      eqAll: this.eqKeys().map((k) => {
        const x = this.eqInfo(k, invBy);
        return { cls: k === eqSel ? 'is-on' : '', name: x.name, type: x.type, use: x.use, flav: x.flav, hasFlav: !!x.flav };
      }),
      games: d.games.map((g, i) => ({
        name: g.name, tag: g.tag, note: g.note, open: gameOpen === i,
        exp: gameOpen === i ? 'true' : 'false', icon: gameOpen === i ? '−' : '+',
        cls: gameOpen === i ? 'is-open' : '', toggle: () => this.toggleGame(i)
      })),
      gamesHint: gamesRead ? gamesRead + '/' + d.games.length + ' lidos' : 'clique num jogo',
      furi: !!s.furi,
      furiCls: s.furi ? 'is-on' : '',
      furiExp: s.furi ? 'true' : 'false',
      readName: () => this.readName(),
      groundEnter: () => this.groundEnter(),
      groundLeave: () => this.groundLeave(),
      copyMail: () => this.copyMail(),
      setMailRef: (el) => { this._mailEl = el; },
      coinLabel: s.copied === 'fail' ? 'Copie à mão' : (s.copied === 'ok' ? 'Ficha inserida' : (fichas <= 0 ? 'Sem fichas' : 'Insira a ficha')),
      coinCls: s.copied === 'ok' ? 'is-ok' : (s.copied === 'fail' ? 'is-fail' : (fichas <= 0 ? 'is-empty' : '')),
      insertCoin: () => this.insertCoin(),
      fichasPause: fichas + '/9',
      fichaZero: fichas <= 0,
      fichaHas: fichas > 0,
      // the big digit on Contato is the ficha counter: a 9..0 strip that rolls like an odometer
      countCls: (fichas <= 0 ? 'is-zero' : '') + (s.coinNag ? ' is-nag-' + s.coinNag : ''),
      countTf: 'translateY(' + (fichas - 9) + 'em)',
      fichasSr: 'Fichas: ' + fichas + ' de 9',
      copiedOk: s.copied === 'ok',
      notCopied: s.copied !== 'ok',
      cvPt: blob('edd22477d30dbb43e2be37a46311d7f0'),
      cvEn: blob('b56625947d33ef537f96fff29a580728'),
      cvJa: blob('e886952da59a2b1bb49133f618541672'),
      tickerInv: d.inv.map((it, i) => ({
        k: it[0], name: it[1], cls: it[4] ? 'k-' + it[4] : '',
        // the same logo (or line glyph) the item wears in Sobre's loadout
        d: icons[it[0]] ? icons[it[0]].d : '',
        fill: icons[it[0]] && icons[it[0]].logo ? icons[it[0]].col : 'none',
        stroke: icons[it[0]] && !icons[it[0]].logo ? icons[it[0]].col : 'none',
        sw: icons[it[0]] && !icons[it[0]].logo ? 1.8 : 0,
        // the regular site never jumps into the lab: the ticker opens the item in Sobre's loadout
        open: () => {
          this.pickInv(i);
          this.setState({ eqSel: it[0] });
          this.go('sobre');
        }
      })),
      setTk: (el) => this.setTk(el),
      tkEnter: () => { this._tkHover = true; },
      tkLeave: () => { this._tkHover = false; },
      stomp: (e) => this.stomp(e),
      groundCls: s.tremor ? 'is-tremor-' + s.tremor : '',
      ringA: s.ringSlot === 'a',
      ringB: s.ringSlot === 'b',
      ringX: s.ringX || 0,
      seis: !!s.seis,
      sonarA: !!s.seis && s.sonarSlot === 'a',
      sonarB: !!s.seis && s.sonarSlot === 'b',
      sonarX: s.sonarX || 0,
      sonarY: s.sonarY || 0,
      lightsOn: () => this.setSeis(false),
      // two ordinary-looking words in the whole portfolio are worth a ficha each (Lab and Sobre)
      wordQuebro: () => this.fichaGain('w-quebro'),
      wordReg: () => this.fichaGain('w-registrador'),
      seisCoinOn: !!s.seis && !!this._coinSpot && this._coinSpot.page === this.curPage(),
      seisCoinCls: this._coinSpot && this._coinSpot.tile ? 'is-walk' : '',
      seisCoinAria: this._coinSpot && this._coinSpot.tile ? 'Uma ficha enterrada no chão do quarto: passe por cima pra pegar' : 'Uma ficha enterrada: pegar',
      setSeisCz: (el) => { this._seisCz = el || null; },
      setSeisCw: (el) => { this._seisCw = el || null; },
      setSeisFind: (el) => { this._seisFind = el || null; },
      seisCoinTake: () => this.coinTake(),
      transitioning: !!s.transitioning
    };
  }
}
