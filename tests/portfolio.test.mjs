import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
function controller(overrides={}){
  const context={window:{},document:{documentElement:{},hidden:false},navigator:{language:'en'},localStorage:{getItem(){return null;},setItem(){}},console,setTimeout,clearTimeout,setInterval,clearInterval,Date,Math,...overrides};
  context.window=context;
  context.React={createElement:(type,props,...children)=>({type,props,children})};
  context.DCLogic=class{constructor(){this.state={};this.props={};}setState(value){this.state={...this.state,...value};}};
  vm.createContext(context);
  for(const f of ['assets/content.js','src/i18n.js','src/boot.js','src/boot-flow.js','src/skill-tree.js','src/character.js','src/room-props.js','src/dice.js','src/shooter.js','src/scene.js','src/desktop.js','src/pocket-games.js','src/hitbox.js','src/achievements.js','src/display.js','src/tv-game.js','src/enhancements.js'])vm.runInContext(read(f),context);
  vm.runInContext(read('src/app.js')+';Portfolio.install(Component);window.Controller=Component;',context);
  return {c:new context.Controller(),context};
}
test('controller renders every main page',()=>{
  const {c}=controller();
  for(const page of ['boot','inicio','projetos','sobre','lab','quarto','contato']){
    c.state={page}; const values=c.renderVals();assert.equal(typeof values.rootCls,'string');
  }
});
test('three correct repository links, infrastructure has none',()=>{
  const projects=JSON.parse(read('src/projects.json'));
  assert.equal(projects.filter(p=>p.repositoryUrl).length,3);
  assert.equal(projects[1].repositoryUrl,null);
  assert.equal(projects[2].repositoryUrl,'https://github.com/Hikaru-0gasawara/IoT-SafeSistem');
});
test('boot has variable timing and stays between sixteen and twenty-two seconds',()=>{
  const {context}=controller(),boot=context.PortfolioBoot;
  assert.ok(boot.lines.length>=60);
  assert.ok(boot.duration>16000&&boot.duration<22000);
  assert.ok(new Set(boot.lines.map(l=>l.ms)).size>=4);
});
test('skill tree preserves all skills with uneven depths',()=>{
  const {c}=controller(),layout=c.skLayout();
  assert.equal(layout.nodes.length,21);
  assert.equal(new Set(layout.nodes.filter(n=>n.cls==='is-lock').map(n=>n.y)).size,4);
  for(const n of layout.nodes){assert.ok(n.x>=0&&n.x<=640);assert.ok(n.y>=0&&n.y<=376);}
});
test('language changes content without changing commands',()=>{
  const {context}=controller();
  context.PortfolioI18n.set('en');assert.equal(context.PortfolioI18n.t('Projetos'),'Projects');
  context.PortfolioI18n.set('ja');assert.equal(context.PortfolioI18n.t('Projetos'),'プロジェクト');
  assert.equal(context.PortfolioI18n.t('UUDDLRLRBA'),'UUDDLRLRBA');
});
test('generated page has no exporter blob routes or external runtime',()=>{
  const html=read('dist/index.html');
  assert.ok(!html.includes('__bundler/template'));
  assert.ok(!/src="https?:/.test(html));
  for(const match of html.matchAll(/(?:src|href)="(\.\/[^"{}]+)"/g))assert.ok(fs.existsSync(new URL('../dist/'+match[1].slice(2).split('?')[0],import.meta.url)),match[1]);
});
test('language gate hides boot and scene',()=>{
  const {c}=controller();c.state={page:'boot',languageOpen:true};const r=c.renderVals();
  assert.equal(r.isBoot,false);assert.equal(r.notBoot,false);assert.equal(r.languageOpen,true);
});
test('language picker promotes the active question and keeps the other two native languages',()=>{
  const {c,context}=controller(),I=context.PortfolioI18n;
  const questions={pt:['pt-BR','Qual idioma você fala?'],en:['en','What language do you speak?'],ja:['ja','どの言語を話しますか？']};
  c.state={page:'sobre',languageOpen:true};
  for(const [locale,[lang,text]] of Object.entries(questions)){
    I.set(locale);const r=c.renderVals();
    assert.equal(r.languageQuestionLang,lang);
    assert.equal(r.languageQuestion.children[0],text);
    const others=Array.from(r.languageOtherQuestions).filter(node=>node.type==='span');
    assert.deepEqual(others.map(node=>[node.props.lang,node.children[0]]),Object.entries(questions).filter(([key])=>key!==locale).map(([,value])=>value));
    assert.deepEqual(Array.from(r.languageChoices,choice=>choice.name.children[0]),['Português','English','日本語']);
  }
});
test('each language option changes the locale and the next opening uses that question',()=>{
  const {c,context}=controller();c._languageReady=true;c.state={page:'sobre',languageOpen:true};
  for(const [index,locale] of ['pt','en','ja'].entries()){
    c.renderVals().languageChoices[index].choose();
    assert.equal(context.PortfolioI18n.locale,locale);
    assert.equal(c.state.languageOpen,false);
    c.renderVals().languageChange();
    assert.equal(c.state.languageOpen,true);
    assert.equal(c.renderVals().languageQuestionLang,{pt:'pt-BR',en:'en',ja:'ja'}[locale]);
  }
  const template=read('src/template.html');
  assert.equal((template.match(/list="\{\{languageChoices\}\}"/g)||[]).length,2,'Entry and desktop share native language options');
  assert.ok(!/\{\{choose(?:Pt|En|Ja)\}\}/.test(template));
});
test('Konami accepts long pauses and executes exactly once',()=>{
  const {c}=controller();const seen=[];
  c.sfx=()=>{};c.unlock=key=>seen.push(key);c.moveFx=()=>{};c.persistSoon=()=>{};
  for(const key of 'UUDDLRLRBA'){c._padT=1;c.pad(key);}
  assert.equal(seen.filter(k=>k==='konami').length,1);
  assert.equal(c._pad.length,0);
});
test('SELECT clears a partial combo immediately',()=>{
  const {c}=controller();c._pad=['U','U'];c.sfx=()=>{};c.padSelect();
  assert.equal(c._pad.length,0);assert.equal(c.state.lcdMenu,false);
});
test('movement weights favor straight, random, alternative, trip, roll',()=>{
  const {context}=controller(),counts={};
  for(let i=0;i<10000;i++){const k=context.PortfolioCharacter.choice(i/10000);counts[k]=(counts[k]||0)+1;}
  assert.deepEqual(counts,{straight:6000,wander:2200,curve:1200,trip:450,roll:150});
});
test('all five falls have distinct finite poses and recover',()=>{
  const {context}=controller(),api=context.PortfolioCharacter,rotations=[];
  for(const variant of api.variants){
    const p=api.pose({variant,t:1000,dur:1650,side:1});rotations.push(p.rot);
    assert.ok(Object.values(p).every(v=>typeof v==='string'||Number.isFinite(v)));
    const end=api.pose({variant,t:1650,dur:1650,side:1});assert.ok(Math.abs(end.rot)<1e-12);
  }
  assert.equal(new Set(rotations).size,5);
});
test('room first fall is guaranteed and same stone does not retrigger',()=>{
  const {c}=controller();c.calm=()=>false;c.sfx=()=>{};c._walkTotal=1700;
  const rm={moving:true,t:.2,to:[7,7],from:[6,7],x:6,y:7,dir:'r',path:[],clock:0};
  c.rmGrid=()=>({W:24,H:14,obj:Array(336).fill(-1),door:99});
  c.rmUpdate(rm,1,false);assert.ok(rm.stone);
  rm.t=.6;c.rmUpdate(rm,1,false);assert.ok(rm.fall);assert.equal(c._fallCount,1);
  c.rmUpdate(rm,1800,false);assert.equal(rm.fall,null);
  c.rmUpdate(rm,1,false);assert.equal(c._fallCount,1);
});
test('project detail keeps Hikaru available when opened from room',()=>{
  const {c}=controller();c.state={page:'projetos',backRoom:true,openProj:0};assert.equal(c.worldOn(),true);
});
test('galleries have at least two valid local illustrations and wrap',()=>{
  const {c}=controller();c.state={openProj:0,galleryIndex:0};c.galleryMove(-1);
  assert.equal(c.state.galleryIndex,1);c.galleryMove(1);assert.equal(c.state.galleryIndex,0);
  for(const p of c.data().projects)for(const img of p.gallery)assert.ok(fs.existsSync(new URL('../public/'+img.src.slice(2),import.meta.url)));
});
test('plush collection has six distinct characters including a separate Lugia',()=>{
  const {c,context}=controller(),d=c.data();
  assert.equal(context.PortfolioRoom.collectibles.length,6);
  assert.equal(d.room.find(o=>o.id==='colecao-pelucias').acts.length,6);
  assert.equal(d.room.find(o=>o.id==='pelucia-gigante').art,'bear');
  assert.equal(d.room.find(o=>o.id==='pelucia').art,'toph');
});

test('deck animation opens the supplied public lists after picking up the cards',()=>{
  const {c,context}=controller();const opened=[];const tab={document:{},location:{replace:url=>opened.push(url)}};
  context.open=()=>tab;c.sfx=()=>{};c.state={page:'quarto'};c.rmInit();
  c.roomAct('decks:moxfield');assert.equal(opened.length,0);assert.equal(tab.opener,null);
  c.loopScene(699);assert.equal(opened.length,0);c.loopScene(1);
  assert.deepEqual(opened,['https://moxfield.com/lists/Jb445-paper-decks']);
  assert.equal(context.PortfolioScene.decks.archidekt,'https://archidekt.com/folders/1717569');
});

test('every directional machine and cabinet has a reachable interaction side',()=>{
  const {c}=controller();c.sfx=()=>{};c.state={page:'quarto'};
  for(const o of c.data().room.filter(o=>o.face)){
    c._rm=null;const rm=c.rmInit(),i=c.data().room.indexOf(o);c.rmGoTo(o.t[0],o.t[1],i);
    assert.equal(rm.goal,i,'unreachable: '+o.id);assert.equal(rm.goalDir,o.face,o.id);
    const end=rm.path.at(-1)||[rm.x,rm.y];Object.assign(rm,{x:end[0],y:end[1],dir:rm.goalDir});
    assert.equal(c.roomFacing(o,rm),true,o.id);rm.dir=o.face==='u'?'d':'u';assert.equal(c.roomFacing(o,rm),false,o.id);
  }
});

test('left door returns straight to the room from all room-linked pages',()=>{
  const {c}=controller();
  for(const page of ['inicio','projetos','sobre','contato']){c.state={page,backRoom:true};assert.equal(c.worldOn(),true);assert.equal(c.worldDoorTo(page,'L'),'quarto');}
  let side;c.worldUseDoor=x=>{side=x;};c.toRoom();assert.equal(side,'L');assert.equal(c._directRoom,true);
});

test('twenty seconds of idle time reset combos, walking and button animations do not',()=>{
  const {c}=controller();c.sfx=()=>{};c._pad=['U'];c._wk={moving:true};
  c.loopScene(90000);assert.equal(c._pad.length,1);c._wk.moving=false;c._wPoke={cur:{}};
  c.loopScene(90000);assert.equal(c._pad.length,1);c._wPoke=null;c.loopScene(19999);assert.equal(c._pad.length,1);
  c.loopScene(1);assert.equal(c._pad.length,0);
});

test('ticker and both models animate in normal and seismic views',()=>{
  const {c}=controller();
  for(const seis of [false,true]){
    c.state={page:'inicio',seis};c._tk={scrollWidth:1000,style:{}};c._tkX=0;c._tkV=0;c.loopTicker(100,false);
    assert.ok(c._tkX<0);c._mEl={hw:{style:{}},sw:{style:{}}};c._rot={hw:{rx:0,ry:0,vy:0},sw:{rx:0,ry:0,vy:0}};
    c.loopModels(100,false);assert.ok(c._rot.hw.ry>0);assert.ok(c._rot.sw.ry<0);
  }
  c.state.motionReduced=true;const at=c._tkX;c.loopTicker(100,false);assert.equal(c._tkX,at);
});

test('D20 has twenty equilateral faces and every result faces the camera',()=>{
  const {context}=controller(),d=context.PortfolioDice;
  assert.equal(d.vertices.length,12);assert.equal(d.faces.length,20);
  for(let n=1;n<=20;n++){
    const o=d.orientation(n),center=d.rotate(d.center(d.faces[n-1]),o.a,o.b);
    assert.ok(Math.abs(center[0])<1e-10&&Math.abs(center[1])<1e-10&&center[2]>0,'face '+n);
    const points=d.faces[n-1].map(i=>d.vertices[i]);
    for(let i=0;i<3;i++)assert.ok(Math.abs(Math.hypot(...points[i].map((v,j)=>v-points[(i+1)%3][j]))-2)<1e-10);
  }
});

test('shooter aims up, down and backwards and pauses simulation',()=>{
  const {context}=controller(),api=context.PortfolioShooter;
  for(const [keys,vx,vy] of [[{up:true,fire:true},0,-1],[{down:true,fire:true},0,1],[{left:true,fire:true},-1,0]]){
    const s=api.fresh();s.mode='play';s.keys=keys;api.step(s,16);assert.equal(Math.round(s.shots[0].vx/430),vx);assert.equal(Math.round(s.shots[0].vy/430),vy);
  }
  const s=api.fresh();s.mode='pause';s.keys={fire:true};api.step(s,500);assert.equal(s.time,0);assert.equal(s.shots.length,0);
  s.mode='play';s.pointerAim={x:0,y:10};api.step(s,16);assert.ok(s.shots[0].vx<0&&s.shots[0].vy<0);
});

test('shooter spawns flying targets and never scores a dead target twice',()=>{
  const {context}=controller(),api=context.PortfolioShooter,s=api.fresh();s.mode='play';s.serial=2;s.spawn=0;api.step(s,1);assert.equal(s.foes[0].flying,true);
  s.foes=[{x:100,y:228,hp:1,shoot:9999}];s.shots=[1,2].map(()=>({x:100,y:215,vx:0,vy:0}));api.step(s,1);assert.equal(s.score,100);assert.equal(s.foes.length,0);
  s.hp=0;api.step(s,1);assert.equal(s.mode,'over');s.hp=5;s.score=2400;s.mode='play';api.step(s,1);assert.equal(s.mode,'win');
});

test('curricula only open a new tab and every local font exists in the build',()=>{
  assert.ok(!/\sdownload(?:=|>)/.test(read('src/template.html')));
  const {context}=controller();assert.equal(context.PORTFOLIO_RESUMES.length,3);
  for(const r of context.PORTFOLIO_RESUMES)assert.ok(fs.existsSync(new URL('../dist/'+r.href.slice(2),import.meta.url)));
  for(const m of read('dist/assets/fonts.css').matchAll(/url\(['"]?([^)'" ]+)/g))assert.ok(fs.existsSync(new URL('../dist/assets/'+m[1],import.meta.url)),m[1]);
});

test('all current room names, dialogue and actions have English and Japanese translations',()=>{
  const {c,context}=controller(),I=context.PortfolioI18n;const ignored=new Set(['Pachinko','Pinball','Playmat','D20','Nintendo 64','Xbox One','SNES','Wii','Espelho','Mimikyu']);
  const missing=[];for(const lang of ['en','ja']){
    I.set(lang);
    for(const o of c.data().room)for(const text of [o.name,o.text,o.day,o.night,...(o.acts||[]).map(a=>a[0])].filter(Boolean)){
      if(ignored.has(text)||/^(?:Pochita|Power|Pikachu|Snorlax|Reze|Lugia) ·/.test(text))continue;
      if(!context.PORTFOLIO_LOCALES[text]?.[lang]&&I.t(text)===text)missing.push(lang+': '+text);
    }
  }
  assert.deepEqual(missing,[]);
});

test('hitbox is default, exposes twelve inputs and 28 adapted classic moves',()=>{
  const {c,context}=controller(),r=c.renderVals();assert.equal(r.isHitbox,true);assert.equal(r.isGb,false);
  assert.equal(r.hitDirections.length,4);assert.equal(r.hitAttacks.length,8);assert.equal(context.PortfolioHitbox.moves.length,28);
  c.sfx=()=>{};c.persistSoon=()=>{};c.unlock=()=>{};c.calm=()=>false;
  for(const m of context.PortfolioHitbox.moves){c.state.hitFighter=m.fighter;c._pad=[];c._wk={};for(const k of m.seq)c.hitInput(k);assert.equal(c.state.hitResult,m.name,m.name);assert.equal(c._wk.anim.kind,'combat');assert.equal(c.worldAnim(c._wk,1200,{}),false);}
});
test('classic controllers play games and never produce fighting combos',()=>{
  const {c}=controller();c.sfx=()=>{};c.startLoop=()=>{};c.persistSoon=()=>{};c.unlock=()=>{};
  for(const ctl of ['gb','n64','pad']){c.ctlSet(ctl);c.miniIn('S');assert.equal(c._pocket.mode,'play');c.miniIn('S');assert.equal(c._pocket.mode,'pause');assert.equal(c._pad.length,0);}
  c.ctlSet('gb');for(const k of 'UUDDLRLRBA')c.pad(k);assert.equal(c._pad.length,0);assert.equal(c._pocket.kind,'blocks');
  c.ctlSet('hitbox');assert.equal(c.renderVals().isHitbox,true);
});
test('falling blocks rotate, clear a line, remain in bounds and pause',()=>{
  const {context}=controller(),a=context.PortfolioPocket,s=a.blockNew();a.blockInput(s,'S');
  s.board[15]=[1,1,1,1,0,1,1,1,1,1];s.piece=[[1]];s.x=4;s.y=14;a.blockInput(s,'B');assert.equal(s.lines,1);assert.equal(s.score,100);
  for(let i=0;i<40;i++)a.blockInput(s,'L');assert.ok(s.x>=0);a.blockInput(s,'A');assert.ok(a.fits(s));
  a.blockInput(s,'S');const y=s.y;a.blockStep(s,6000);assert.equal(s.y,y);assert.equal(s.mode,'pause');
});
test('musical cartridge repeats on B and accepts its complete sequence',()=>{
  const {context}=controller(),a=context.PortfolioPocket,s=a.melodyNew(),sound=[];a.melodyInput(s,'S');
  a.melodyStep(s,1,k=>sound.push(k));a.melodyStep(s,900);assert.equal(s.phase,'input');a.melodyInput(s,'B');assert.equal(s.phase,'show');
  a.melodyStep(s,900);a.melodyInput(s,s.seq[0]);assert.equal(s.score,1);assert.equal(s.seq.length,2);assert.equal(sound.length,1);
});
test('three-lane race clamps movement and prevents repeated collision damage',()=>{
  const {context}=controller(),a=context.PortfolioPocket,s=a.raceNew();a.raceInput(s,'S');for(let i=0;i<5;i++)a.raceInput(s,'L');assert.equal(s.lane,0);
  s.obstacles=[{lane:0,y:140}];a.raceStep(s,10);assert.equal(s.lives,2);a.raceStep(s,10);assert.equal(s.lives,2);
  a.raceInput(s,'S');const before=s.time;a.raceStep(s,1000);assert.equal(s.time,before);
});
test('desktop has eight apps, embedded locale resume and an allowlisted terminal',()=>{
  const {c,context}=controller(),got=[];c.state={page:'quarto'};c.unlock=x=>got.push(x);c.sfx=()=>{};c.startLoop=()=>{};
  c.openPc();assert.equal(c.state.deOpen,true);assert.equal(c.renderVals().deApps.length,8);
  for(const lang of ['pt','en','ja']){context.PortfolioI18n.set(lang);c.desktopApp('resume');assert.equal(c.renderVals().dePdf,'./resume/hikaru-'+lang+'.pdf');}
  for(const cmd of ['neofetch','whoami','htop','date']){c.state.deInput=cmd;c.desktopCommand();assert.ok(c.state.deOutput);}
  assert.ok(got.includes('fetch-yourself'));assert.ok(got.includes('desktop-resume'));
  c.state.deInput='window.evil=true';c.desktopCommand();assert.equal(context.evil,undefined);assert.match(c.state.deOutput,/Comando não encontrado/);
  c.desktopApp('game');assert.equal(c.state.deOpen,false);assert.equal(c.state.pcOpen,true);c.closePc();assert.equal(c.state.deOpen,true);assert.equal(c.state.pcOpen,false);
});
test('puff offers its TV game only while seated and returns without standing up',()=>{
  const {c}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.sfx=()=>{};c.say=()=>{};c.unlock=()=>{};c.startLoop=()=>{};
  c.openTvGame();assert.equal(c.state.tvGameOpen,undefined);
  c.roomAct('puff');assert.equal(c._rm.sit.kind,'puff');assert.equal(c.rmActs()[0][1],'tvgame');
  c.roomAct('tvgame');assert.equal(c.state.tvGameOpen,true);assert.equal(c.state.rmDlg,false);
  const seated=c._rm.sit,position=[c._rm.x,c._rm.y];
  c.rootKey({key:'ArrowLeft',preventDefault(){}});assert.equal(c._tvGame.keys.left,true);assert.deepEqual([c._rm.x,c._rm.y],position);assert.equal(c._rm.sit,seated);
  c.rootKeyUp({key:'ArrowLeft',preventDefault(){}});assert.equal(c._tvGame.keys.left,false);
  c.rootKey({key:'Escape',preventDefault(){}});assert.equal(c.state.tvGameOpen,false);assert.equal(c.state.rmDlg,true);assert.equal(c._rm.sit,seated);assert.equal(c._tvGame,null);
  c.roomAct('stand');assert.ok(c._rm.sit.out);assert.equal(c.state.rmDlg,false);
});
test('TV record uses the normal save and resets with a new game',()=>{
  const saved=new Map(),storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
  const {c}=controller({localStorage:storage,setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c._visited={quarto:true};c.sfx=()=>{};c.startLoop=()=>{};c.rmInit().sit={kind:'puff',out:0};c._miniHi={gb:120};
  c.openTvGame();c._tvGame.score=350;c.tvGameSync();assert.equal(c.renderVals().tvGameBest,350);c.closeTvGame();
  const {c:next}=controller({localStorage:storage});next.loadSave();assert.equal(next.miniHi('tv-breakout'),350);assert.equal(next.miniHi('gb'),120);
  next.wipeProgress();assert.equal(next.miniHi('tv-breakout'),0);assert.equal(next.state.tvGameOpen,false);
});
test('TV input supports pointer, launch, pause, restart and native focused buttons',()=>{
  const {c}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.sfx=()=>{};c.startLoop=()=>{};c.rmInit().sit={kind:'puff',out:0};c.openTvGame();
  c.tvGameKey({key:'Enter',target:{closest:()=>true},preventDefault(){assert.fail('Focused button must handle its own Enter');}},true);assert.equal(c._tvGame.mode,'serve');
  const event={pointerType:'touch',buttons:1,clientX:150,pointerId:1,preventDefault(){},currentTarget:{getBoundingClientRect:()=>({left:0,width:240}),focus(){},setPointerCapture(){}}};
  c.tvGamePointer(event,true);assert.equal(c._tvGame.mode,'play');assert.equal(c._tvGame.paddle,300);
  c.tvGameKey({key:'p',preventDefault(){}},true);assert.equal(c._tvGame.mode,'pause');
  c.tvGameKey({key:'Enter',preventDefault(){}},true);assert.equal(c._tvGame.mode,'play');
  c.tvGameKey({key:'r',preventDefault(){}},true);assert.equal(c._tvGame.mode,'serve');assert.equal(c._tvGame.score,0);
  c.tvGameSuspend();assert.equal(c._tvGame.mode,'pause');assert.equal(c._tvGame.target,null);assert.equal(Object.keys(c._tvGame.keys).length,0);
});
test('TV lifecycle pauses on blur or a hidden tab and removes its listeners on unmount',()=>{
  const win=new Map(),doc=new Map(),add=map=>(name,fn)=>map.set(fn,name),remove=map=>(name,fn)=>map.delete(fn);
  const document={documentElement:{},hidden:false,getElementById:()=>null,addEventListener:add(doc),removeEventListener:remove(doc)};
  const {c}=controller({document,addEventListener:add(win),removeEventListener:remove(win),setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){}});
  c.state={page:'quarto'};c.startLoop=()=>{};c.sfx=()=>{};c.componentDidMount();c.rmInit().sit={kind:'puff',out:0};c.openTvGame();c.tvGamePrimary();
  assert.equal(win.get(c._tvGameBlur),'blur');assert.equal(doc.get(c._tvGameVisibility),'visibilitychange');
  c._tvGameBlur();assert.equal(c._tvGame.mode,'pause');c.tvGamePrimary();document.hidden=true;c._tvGameVisibility();assert.equal(c._tvGame.mode,'pause');
  const blur=c._tvGameBlur,visibility=c._tvGameVisibility;c.componentWillUnmount();assert.equal(win.has(blur),false);assert.equal(doc.has(visibility),false);assert.equal(c._tvGame,null);
});
test('continue requires real progress and language storage is independent',()=>{
  const saved=new Map(),{c,context}=controller({localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)}});
  c._visited={boot:true};assert.equal(c.canContinue(),false);assert.equal(c.persist(),false);
  context.PortfolioI18n.set('ja');assert.equal(context.PortfolioI18n.saved(),'ja');assert.equal(c.canContinue(),false);
  c._visited.quarto=true;assert.equal(c.canContinue(),false);assert.equal(c.persist(),true);assert.equal(c.canContinue(),true);saved.set('okaru-language','invalid');assert.equal(context.PortfolioI18n.saved(),null);
});
test('start menu requires a valid saved game in all three languages',()=>{
  const cases=[null,'{broken','null','{}',JSON.stringify({v:2,got:{start:true}}),JSON.stringify({v:1}),JSON.stringify({v:1,got:{start:false}}),JSON.stringify({v:1,got:{'boot-recovery':true},visited:{boot:true}}),JSON.stringify({v:1,visited:{quarto:false,unknown:true},room:{unknown:true}})];
  for(const raw of cases){
    const {c,context}=controller({localStorage:{getItem:key=>key==='okaru-save-v1'?raw:key==='okaru-language'?'ja':key==='okaru-boot-seen'?'1':null,setItem(){}}});
    c.state={page:'boot',bootLog:false};c.loadSave();
    for(const locale of ['pt','en','ja']){
      context.PortfolioI18n.set(locale);const r=c.renderVals();
      assert.equal(r.canContinue,false,String(raw));assert.equal(r.noContinue,true);assert.equal(r.hasSave,false);
    }
  }
  const html=read('src/template.html');
  assert.match(html,/<sc-if value="\{\{noContinue\}\}"[\s\S]*?on-click="\{\{newGame\}\}"[\s\S]*?<button class="press-m" disabled title="Explore o portfólio para criar um save">CONTINUAR/);
});
test('continue actions require a saved game and preserve restored progress',()=>{
  const saved=new Map(),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
  const {c}=controller({localStorage:storage});c.state={page:'boot'};
  let starts=[];c.pressStart=(sound,fresh)=>starts.push([sound,fresh]);
  c.renderVals().continueGame();c.renderVals().continueMute();assert.equal(starts.length,0);
  c._visited={quarto:true};c._got={start:true};c._plushMeet={lugia:true};assert.equal(c.persist(),true);
  const {c:restored,context}=controller({localStorage:storage});restored.state={page:'boot'};restored.loadSave();restored.pressStart=c.pressStart;
  for(const locale of ['pt','en','ja']){
    context.PortfolioI18n.set(locale);const r=restored.renderVals();assert.equal(r.canContinue,true);assert.equal(r.noContinue,false);assert.equal(r.hasSave,true);
  }
  restored.renderVals().continueGame();restored.renderVals().continueMute();assert.deepEqual(starts,[[true,undefined],[false,undefined]]);
  assert.equal(restored._plushMeet.lugia,true);assert.equal(restored._got.start,true);
  const staleAction=restored.renderVals().continueGame;restored.sfx=()=>{};restored.state.eraseArm=true;restored.eraseSave();
  staleAction();assert.equal(starts.length,2);assert.equal(restored.canContinue(),false);assert.equal(saved.has('okaru-save-v1'),false);
});
test('first new game takes one click and keeps the boot trophy; replacing a save still confirms',()=>{
  const {c}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'boot'};c._got={'boot-recovery':true};c.sfx=()=>{};
  const starts=[];c.pressStart=(sound,fresh)=>starts.push([sound,fresh]);
  c.renderVals().newGame();assert.deepEqual(starts,[[true,true]]);assert.equal(c.state.newArm,false);assert.equal(c._got['boot-recovery'],true);
  c.renderVals().newGameMute();assert.deepEqual(starts[1],[false,true]);
  c._hadSave=true;c._got.start=true;c.renderVals().newGame();assert.equal(starts.length,2);assert.equal(c.state.newArm,true);
  c.renderVals().newGame();assert.equal(starts.length,3);assert.equal(c._got.start,undefined);assert.equal(c.canContinue(),false);
});
test('an unsuccessful save does not enable Continue',()=>{
  const {c}=controller({localStorage:{getItem(){return null;},setItem(){throw new Error('Storage unavailable');}}});
  c.state={page:'quarto'};c._visited={quarto:true};c._got={start:true};
  assert.equal(c.persist(),false);assert.equal(c.canContinue(),false);
});
test('failed boot completes logs then closes errors before offering a safe reboot',()=>{
  const timers=new Map();let id=0;const math=Object.create(Math);math.random=()=>0;
  const {c,context}=controller({Math:math,setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
  c.state={page:'boot'};c._languageReady=true;c.sfx=()=>{};c.startLoop=()=>{};c.unlock=()=>{};c.bootLogStart();assert.equal(c.state.bootFault,true);
  const next=()=>{const [key,t]=timers.entries().next().value;timers.delete(key);t.fn();return t.delay;};
  for(let i=0;i<context.PortfolioBoot.lines.length;i++)next();
  assert.equal(c.state.bootN,96);assert.equal(c.state.bootRecovery,false);assert.equal(next(),3500);assert.equal(c.state.bootRecovery,true);
  assert.equal(c.renderVals().bootFailures.length,0);assert.equal(c.renderVals().bootRunning,false);assert.equal(c.state.bootRebootPrompt,false);assert.equal(next(),8000);assert.equal(c.state.bootRebootPrompt,true);
  c.renderVals().bootRecover();assert.equal(c.state.bootFault,false);assert.equal(c.state.bootRecovery,false);
  for(let i=0;i<context.PortfolioBoot.lines.length;i++)next();assert.equal(c.state.bootDone,true);next();assert.equal(c.state.bootLog,false);
});
test('boot cannot be skipped by keys or by the start controls hidden behind it',()=>{
  for(const fault of [false,true]){
    const timers=new Map();let id=0;const math=Object.create(Math);math.random=()=>0;
    const {c}=controller({Math:math,setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
    c.state={page:'boot'};c._languageReady=true;c._bootSafe=!fault;c.sfx=()=>{};c.startLoop=()=>{};c.bootLogStart();
    const timer=c._blT;for(const key of ['Escape','Enter',' ','a'])c.rootKey({key,preventDefault(){}});
    c.pressStart();c.newGame();
    assert.equal(c.bootSkip,undefined);assert.equal(c.renderVals().bootMenuOn,false);
    assert.equal(c.state.bootFault,fault);assert.equal(c.state.bootDone,false);assert.equal(c.state.bootN,0);
    assert.equal(c._blT,timer);assert.equal(timers.size,1);assert.equal(c.curPage(),'boot');
    assert.equal(c.renderVals().bootSkip,undefined);
  }
});
test('Enter recovery is an accessible final log line, with no skip button or floating Enter prompt',()=>{
  const html=read('src/template.html'),css=read('src/enhancements.css');
  const log=html.split('<div class="blog-in">')[1]?.split('<div class="boot-errors"')[0];
  assert.ok(log);assert.match(log,/<sc-if value="\{\{bootRecovery\}\}"><div class="bll bll-recovery" role="status">/);
  assert.match(log,/<span class="bll-t">Pressione Enter para reiniciar<\/span>/);
  const prompt=log.split('<div class="bll bll-recovery"')[1].split('</sc-if>')[0];assert.doesNotMatch(prompt,/<button/);
  assert.ok(log.indexOf('boot-recover-action')>log.indexOf('bll-recovery'));
  assert.match(log,/<div class="boot-recover-action"><button[^]*?\{\{bootRecover\}\}/);
  assert.doesNotMatch(html+css,/bootSkip|blog-skip|boot-recover-line|boot-recover-box/);
  const {context}=controller();
  for(const lang of ['en','ja']){context.PortfolioI18n.set(lang);assert.notEqual(context.PortfolioI18n.t('Pressione Enter para reiniciar'),'Pressione Enter para reiniciar');}
});
test('Enter during the eight-second reading window cancels the delayed reboot button',()=>{
  const timers=new Map();let id=0;
  const {c,context}=controller({setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
  c.state={page:'boot'};c._languageReady=true;c.sfx=()=>{};c.startLoop=()=>{};c.unlock=()=>{};c.bootLogStart();
  const next=()=>{const [key,t]=timers.entries().next().value;timers.delete(key);t.fn();};
  for(let i=0;i<context.PortfolioBoot.lines.length;i++)next();next();
  assert.equal(c.state.bootRecovery,true);assert.equal(c.state.bootRebootPrompt,false);
  const prompt=c._bootPromptT;assert.equal(timers.get(prompt).delay,8000);
  c.rootKey({key:'Enter',repeat:true,preventDefault(){}});assert.equal(c.state.bootRecovery,true);
  c.rootKey({key:'Enter',repeat:false,preventDefault(){}});
  assert.equal(timers.has(prompt),false);assert.equal(c._bootPromptT,null);
  assert.equal(c.state.bootFault,false);assert.equal(c.state.bootRecovery,false);assert.equal(c.state.bootRebootPrompt,false);
});
test('recovery clears all panic logs and popups before showing the localized recovery summary',()=>{
  const {c,context}=controller();c.data().bootLog=context.PortfolioBootFlow.failureLines();
  c.state={page:'boot',bootLog:true,bootFault:true,bootN:96,bootRecovery:false};
  assert.equal(c.renderVals().bootLines.length,96);assert.equal(c.renderVals().bootFailures.length,5);
  c.state.bootRecovery=true;
  for(const lang of ['pt','en','ja']){
    context.PortfolioI18n.set(lang);const r=c.renderVals();
    assert.equal(r.bootLines.length,2);assert.equal(r.bootFailures.length,0);assert.equal(r.bootRebootPrompt,false);
    assert.equal(r.bootRunning,false);assert.equal(r.bootMenuOn,false);
    for(const line of r.bootLines){assert.equal(line.cls,'is-recovered');assert.equal(line.ariaHidden,false);if(lang!=='pt')assert.notEqual(context.PortfolioI18n.t(line.t),line.t);}
  }
});
test('first visit always panics after language choice and recovery always boots normally',()=>{
  for(const language of ['pt','en','ja']){
    const saved=new Map(),math=Object.create(Math);math.random=()=>.99;
    const {c,context}=controller({Math:math,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},setTimeout:()=>1,clearTimeout(){}});
    c.state={page:'boot',languageOpen:true};c.sfx=()=>{};c.startLoop=()=>{};c.unlock=()=>{};
    c.bootLogStart();assert.equal(saved.has(context.PortfolioBootFlow.visitKey),false);assert.equal(c.state.bootLog,undefined);
    c.chooseLanguage(language);assert.equal(c.state.bootFault,true);assert.equal(c.state.languageOpen,false);
    assert.equal(saved.get(context.PortfolioBootFlow.visitKey),'1');assert.equal(c.canContinue(),false);
    c.state.bootRecovery=true;c.bootRecover();assert.equal(c.state.bootFault,false);assert.equal(c.state.bootRecovery,false);
    c.bootLogStart();assert.equal(c.state.bootFault,false);
  }
});
test('returning visitors have a ten percent panic chance; existing language counts as a prior visit',()=>{
  let failures=0;
  for(let i=0;i<100;i++){
    const math=Object.create(Math);math.random=()=>i/100;
    const {c,context}=controller({Math:math,localStorage:{getItem:k=>k==='okaru-boot-seen'?'1':null,setItem(){}},setTimeout:()=>1,clearTimeout(){}});
    c._languageReady=true;c.startLoop=()=>{};c.bootLogStart();failures+=Number(c.state.bootFault);
    assert.equal(context.PortfolioBootFlow.failureChance,.1);
  }
  assert.equal(failures,10);
  const math=Object.create(Math);math.random=()=>.99;
  const {c}=controller({Math:math,localStorage:{getItem:k=>k==='okaru-language'?'ja':null,setItem(){}},setTimeout:()=>1,clearTimeout(){}});
  c._languageReady=true;c.startLoop=()=>{};c.bootLogStart();assert.equal(c.state.bootFault,false);
});
test('disabled storage remembers the newcomer panic for the current session',()=>{
  const math=Object.create(Math);math.random=()=>.99;
  const {c}=controller({Math:math,localStorage:{getItem(){throw Error('disabled');},setItem(){throw Error('disabled');}},setTimeout:()=>1,clearTimeout(){}});
  c.state={page:'boot'};c.startLoop=()=>{};c.chooseLanguage('ja');assert.equal(c.state.bootFault,true);
  c.bootLogStart();assert.equal(c.state.bootFault,false);
});
test('panic has varied localized diagnostics and never ends with a successful boot message',()=>{
  const {context}=controller(),api=context.PortfolioBootFlow,lines=api.failureLines();
  assert.equal(lines.length,96);assert.equal(lines.at(-1).t,'Sistema interrompido. Aguardando recuperação.');
  assert.ok(lines.every(l=>['warn','fail'].includes(l.tag)));assert.equal(new Set(lines.map(l=>l.t)).size,25);
  for(const lang of ['en','ja']){
    context.PortfolioI18n.set(lang);
    for(const text of [...api.errors,lines.at(-1).t])assert.notEqual(context.PortfolioI18n.t(text),text,lang+': '+text);
  }
});
test('random route choices preserve straight majority and early detours in both directions',()=>{
  const {context}=controller(),a=context.PortfolioScene,geo={W:900,H:600,CH:1200,u:1},from={x:100,y:300},to={x:700,y:300};let straight=0;
  for(let i=0;i<100;i++){const points=a.route(from,to,geo,i/100,()=>.2);if(!points.length)straight++;for(const p of points){assert.ok(p.x>=12&&p.x<=888);assert.ok(p.y>=28&&p.y<=1194);}}
  assert.equal(straight,60);assert.ok(a.route(from,to,geo,.8,()=>.2)[0].y<from.y);assert.ok(a.route(from,to,geo,.8,()=>.8)[0].y>from.y);
  assert.equal(a.route(from,to,geo,.99).length,4);
});
test('all 51 achievements have distinct identities and localized descriptions',()=>{
  const {c,context}=controller(),list=c.data().trophies;assert.equal(list.length,51);assert.equal(new Set(list.map(t=>t.id)).size,51);
  for(const lang of ['en','ja']){context.PortfolioI18n.set(lang);for(const t of list)for(const field of ['goal','done'])if(t[field])assert.notEqual(context.PortfolioI18n.t(t[field]),t[field],lang+' '+t.id+' '+field);}
});
test('heading decoding completes for Portuguese, English and Japanese',()=>{
  const {c,context}=controller();c._decSeen=new WeakSet();c.startLoop=()=>{};
  for(const lang of ['pt','en','ja']){context.PortfolioI18n.set(lang);const final=context.PortfolioI18n.t('Projetos'),node={nodeType:3,nodeValue:final},el={firstChild:node};c.renderVals().decH1(el);c.loopDecode(100);c.loopDecode(400);assert.notEqual(node.nodeValue,final);c.loopDecode(2000);assert.equal(node.nodeValue,final);}
});

test('negative cabinet clock clears stale effects and positive effects are clipped',()=>{
  const {c}=controller({Path2D:class{}});let clips=0,rects=[];const ctx=new Proxy({clip(rule){if(rule!=='evenodd')clips++;},rect(...v){rects.push(v);}}, {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}});
  c._cabShow={id:'fliperama-blocos',at:90000,mode:'blocks'};c.drawRoomProps(ctx,{clock:10,camX:0,camY:0});assert.equal(c._cabShow,null);assert.equal(clips,0);
  rects=[];c._cabShow={id:'fliperama-blocos',at:0,mode:'blocks'};c.drawRoomProps(ctx,{clock:400,camX:0,camY:0});assert.equal(clips,1);assert.ok(rects[0][2]<30);assert.equal(rects[0][3],16);
});
test('seismic coin clicks walk and collect once through a pickup animation',()=>{
  const {c}=controller();c.state={page:'inicio',seis:true};c._coinSpot={page:'inicio',fx:.5,fy:.5};c._wk={page:'inicio',x:20,y:20,walk:0};c._fichas=0;
  const geo={u:1,sc:{clientWidth:600,clientHeight:500,scrollHeight:500}};c.worldGeo=()=>geo;c.sfx=()=>{};c.persistSoon=()=>{};c.toastShow=()=>{};c.unlock=()=>{};c.worldPokeCancel=()=>{};c.coinNew=()=>({page:'sobre',fx:.5,fy:.5});
  c.requestCoin();assert.ok(c._wk.autoTarget);for(let i=0;i<150&&!c._wk.anim;i++)c.worldMove(c._wk,16,geo);
  assert.equal(c._wk.anim.kind,'pickup');assert.equal(c.fichaN(),0);assert.equal(c.coinTake(),false);c.worldAnim(c._wk,430,geo);assert.equal(c.fichaN(),1);assert.equal(c._coinSpot.page,'sobre');
});
test('nearby controller inputs always move and execute their button once',()=>{
  const {c}=controller({setTimeout:()=>0});let clicks=0;const classes=new Set();const el={tagName:'BUTTON',getAttribute:()=>null,closest:()=>true,classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},getBoundingClientRect:()=>({left:90,top:90,width:20,height:20}),click(){clicks++;}};
  const sc={contains:()=>true,getBoundingClientRect:()=>({left:0,top:0})},geo={sc,u:1,W:600,H:400,CH:400,top:0};const wk={x:100,y:103,walk:0,dir:'d'};c._wk=wk;c._wPoke={q:[{el,fire:true,style:'stomp'}],cur:null};c.sfx=()=>{};c.worldFloSpeed=()=>1;c.worldCurve=()=>{};
  assert.equal(c.pokeStyle(el),'stomp');c.worldPokeStep(wk,100,geo);assert.notEqual(wk.x,100);assert.equal(wk.act.style,'roll');c.worldPokeStep(wk,400,geo);assert.equal(clicks,1);assert.equal(Math.round(wk.x),100);
});
test('a detour further from the target still advances toward the button',()=>{
  const {c}=controller();const wk={x:50,y:300,walk:0};c._wPoke={q:[],cur:{phase:'walk',route:[],tx:500,ty:200,from:100}};c.worldFloSpeed=()=>1;c.worldCurve=()=>{};
  c.worldPokeStep(wk,16,{u:1});assert.ok(wk.x>50);assert.ok(wk.y<300);
});
test('clear removes desktop output and does not restore the help text',()=>{
  const {c}=controller();c.state={page:'quarto',deInput:'clear'};c.desktopCommand();assert.equal(c.renderVals().deOutput,'');
});
test('partial collection and gallery progress survive saves and reset with new game',()=>{
  const saved=new Map(),{c}=controller({localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}});
  c.state={page:'quarto'};c._visited={quarto:true};c._plushMeet={lugia:true};c._galleryRead={0:true};assert.equal(c.persist(false),true);
  c._plushMeet={};c._galleryRead={};c.loadSave();assert.equal(c._plushMeet.lugia,true);assert.equal(c._galleryRead[0],true);
  c.wipeProgress();assert.equal(c.canContinue(),false);assert.equal(Object.keys(c._plushMeet).length,0);assert.equal(Object.keys(c._galleryRead).length,0);
});

test('every entry finishes its TV opening before language selection or saved-language boot',()=>{
  for(const saved of [null,'ja']){
    const writes=new Map(),timers=new Map();let id=0;
    const {c,context}=controller({localStorage:{getItem:k=>k==='okaru-language'?saved:null,setItem:(k,v)=>writes.set(k,v)},document:{documentElement:{},getElementById:()=>null,addEventListener(){}},setInterval:()=>1,setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
    context.addEventListener=()=>{};c.state={page:'boot'};c.startLoop=()=>{};c.componentDidMount();
    assert.equal(c.state.languageOpen,!saved);assert.equal(c.state.displayStarting,true);assert.equal(!!c.state.bootLog,false);
    assert.equal(c.renderVals().isBoot,false);assert.equal(c.renderVals().notBoot,false);assert.equal(c.renderVals().displayStandby,!!saved);
    assert.equal(writes.has('okaru-boot-seen'),false);assert.equal(c._blT,undefined);
    c.bootLogStart();c.chooseLanguage('en');assert.equal(writes.has('okaru-boot-seen'),false);assert.equal(writes.get('okaru-language'),saved||undefined);
    assert.equal(c._displayOpenT,undefined);assert.equal(c.renderVals().displayPowerGate,true);
    c.powerDisplayOn();assert.equal(c._displayPhase,'approach');timers.get(c._displayApproachT).fn();
    assert.equal(c._displayPhase,'zoom');timers.get(c._displayZoomT).fn();
    const openingTimer=c._displayOpenT;assert.equal(timers.get(openingTimer).delay,4400);
    c.finishDisplayOpening();assert.equal(timers.has(openingTimer),false);assert.equal(c.state.displayStarting,false);
    assert.equal(!!c.state.bootLog,!!saved);if(saved)assert.equal(context.PortfolioI18n.locale,saved);assert.equal(c.canContinue(),false);
    if(!saved){c.chooseLanguage('ja');assert.equal(c.state.bootFault,true);assert.equal(c.state.bootLog,true);}
    const bootTimer=c._blT;c.finishDisplayOpening();assert.equal(c._blT,bootTimer);
  }
});

test('only the opening overlay animation can release startup; fallback and reduced motion also work',()=>{
  for(const reduce of [false,true]){
    const timers=new Map();let id=0;
    const {c,context}=controller({matchMedia:()=>({matches:reduce}),document:{documentElement:{},getElementById:()=>null,addEventListener(){}},setInterval:()=>1,setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
    context.addEventListener=()=>{};c.startLoop=()=>{};c.componentDidMount();c.powerDisplayOn();
    assert.equal(timers.get(c._displayApproachT).delay,reduce?280:760);timers.get(c._displayApproachT).fn();
    assert.equal(timers.get(c._displayZoomT).delay,reduce?280:1560);timers.get(c._displayZoomT).fn();
    const opening=c._displayOpenT;assert.equal(timers.get(opening).delay,reduce?320:4400);
    assert.equal(c.renderVals().rootCls.includes('is-tv-calm'),reduce);
    let blocked=0;c.rootKey({key:'Enter',preventDefault(){blocked++;}});assert.equal(blocked,1);assert.equal(c.state.displayStarting,true);
    const root={},child={},overlay={classList:{contains:k=>k==='tv-power-on'}},event=c.renderVals().displayOpeningEnd;
    event({target:child,currentTarget:root,animationName:'tv-power-sequence'});assert.equal(c.state.displayStarting,true);
    event({target:overlay,currentTarget:root,animationName:'tv-beam-expand'});assert.equal(c.state.displayStarting,true);
    if(reduce)timers.get(opening).fn();else event({target:overlay,currentTarget:root,animationName:'tv-power-sequence'});
    assert.equal(c.state.displayStarting,false);assert.equal(c.state.languageOpen,true);assert.equal(timers.has(opening),false);
    c.chooseLanguage('en');assert.equal(c.state.bootLog,true);assert.equal(c.state.bootFault,true);
  }
});

test('TV opening is cancelled on unmount and never returns for an internal reboot or language change',()=>{
  const timers=new Map();let id=0;
  const {c,context}=controller({document:{documentElement:{},getElementById:()=>null,addEventListener(){},removeEventListener(){}},setInterval:()=>1,clearInterval(){},setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
  context.addEventListener=()=>{};context.removeEventListener=()=>{};c.startLoop=()=>{};c.componentDidMount();c.powerDisplayOn();c.prepareDisplayZoom();c.beginDisplayOpening(false);
  const stale=timers.get(c._displayOpenT).fn;c.componentWillUnmount();assert.equal(c._displayOpenT,null);stale();assert.equal(c.state.bootLog,undefined);
  const next=controller({setTimeout:()=>1,clearTimeout(){}}).c;next._displayStarting=false;next._languageReady=true;next.startLoop=()=>{};next.state={page:'boot'};
  next.bootLogStart();assert.equal(next.renderVals().displayStarting,false);assert.equal(next.renderVals().isBoot,true);
  next.state={page:'quarto',languageOpen:true};next.chooseLanguage('ja');assert.equal(next.renderVals().displayStarting,false);assert.equal(next._displayOpenT,undefined);
});

test('TV button cycles three visual modes, stays open and keeps a separate saved preference',()=>{
  const saved=new Map(),{c,context}=controller({localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)}});
  const tv=c.data().room.findIndex(o=>o.id==='tv');c.state={page:'quarto',roomObj:tv};c.sfx=()=>{};c.rmFxOn=()=>{};c.say=()=>{};c.focusRoot=()=>{};
  assert.equal(c.displayMode().id,'antique');assert.equal(c.data().room[tv].acts.length,1);
  for(const mode of ['crt','hd','antique']){
    c.rmRun('display:cycle');assert.equal(c.displayMode().id,mode);assert.equal(c.state.rmDlg,true);
    assert.equal(c.rmActs().length,2);assert.equal(c.rmActs()[0][0],c.displayMode().action);assert.equal(c.rmActs()[1][1],'close');
    assert.match(c.renderVals().rootCls,new RegExp('display-'+mode));assert.equal(saved.get(context.PortfolioDisplay.storageKey),mode);
    assert.equal(c.canContinue(),false);assert.equal(saved.has('okaru-save-v1'),false);
  }
});

test('display styles restore independently of language, tolerate bad storage and survive new game',()=>{
  for(const value of ['crt','hd','corrupt',null]){
    const {c,context}=controller({localStorage:{getItem:k=>k==='okaru-display'?value:null,setItem(){}},document:{documentElement:{},getElementById:()=>null,addEventListener(){}},setInterval:()=>1,setTimeout:()=>1});
    context.addEventListener=()=>{};c.startLoop=()=>{};c.componentDidMount();
    const expected=['crt','hd'].includes(value)?value:'antique';assert.equal(c.displayMode().id,expected);
    c.wipeProgress();assert.equal(c.displayMode().id,expected);
  }
  const {c,context}=controller({localStorage:{getItem(){throw Error('denied');},setItem(){throw Error('denied');}},document:{documentElement:{},getElementById:()=>null,addEventListener(){}},setInterval:()=>1,setTimeout:()=>1});
  context.addEventListener=()=>{};c.startLoop=()=>{};c.componentDidMount();assert.equal(c.displayMode().id,'antique');
  c.sfx=()=>{};c.rmFxOn=()=>{};c.say=()=>{};c.roomAct('display:cycle');assert.equal(c.displayMode().id,'crt');
});

test('screen effects and TV copy are localized and presentation never intercepts scene controls',()=>{
  const {c,context}=controller(),api=context.PortfolioDisplay,css=read('src/display.css'),html=read('src/template.html');
  for(const lang of ['en','ja']){
    context.PortfolioI18n.set(lang);
    for(const text of [...api.modes.flatMap(m=>[m.label,m.action,m.text]),c.data().room.find(o=>o.id==='tv').text,'Alternar estilo de tela','Ligar a televisão','Ligar TV','Girar o seletor de canal','Volume cenográfico','Clique ou arraste para girar','Canal'])assert.notEqual(context.PortfolioI18n.t(text),text,lang+': '+text);
  }
  assert.match(css,/\.display-surface\{[^}]*pointer-events:none/);
  assert.match(css,/\.display-lines,\.display-vignette\{[^}]*pointer-events:none/);
  assert.match(css,/\.okr\.display-hd>\.grain,\.display-hd>\.display-surface\{display:none\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(html,/sc-camel-on-animation-end="\{\{displayOpeningEnd\}\}"/);
  assert.equal(c.renderVals().languageChoices.length,3);
  assert.match(html,/<sc-for list="\{\{languageChoices\}\}" as="language"><button[^>]+disabled="\{\{displayStarting\}\}"/);
});

function television(state='suspended',extra={}){
  const timers=new Map();let id=0;
  const {c,context}=controller({document:{documentElement:{},getElementById:()=>null,addEventListener(){},removeEventListener(){}},setInterval:()=>1,clearInterval(){},setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i),...extra});
  context.addEventListener=()=>{};context.removeEventListener=()=>{};
  const ac={state,close(){this.state='closed';}};
  c._ac=ac;c.audio=()=>ac;c.startLoop=()=>{};c.state={page:'boot'};
  const sounds=[];c.tvPowerSound=()=>{if(ac.state!=='running')return false;sounds.push(ac.state);return true;};
  return {c,context,ac,timers,sounds};
}

test('the physical TV starts only on power, zooms inside the glass, then synchronizes sound and opening',()=>{
  const {c,ac,timers,sounds}=television();c.componentDidMount();
  assert.equal(c.renderVals().displayPowerGate,true);assert.equal(c.renderVals().languageOpen,false);
  assert.equal(c.renderVals().displayAnimating,false);assert.equal(c.renderVals().isBoot,false);assert.equal(c._displayOpenT,undefined);
  assert.equal(sounds.length,0);assert.equal(timers.size,0);assert.match(c.renderVals().displayPowerLabel,/Power on/);
  c.finishDisplayOpening();assert.equal(c.state.displayStarting,true);assert.equal(c.state.bootLog,undefined);
  c.rootKey({key:'Tab',preventDefault(){assert.fail('Tab must remain available for the power buttons');}});
  c.audio=()=>{ac.state='running';return ac;};c.rootKey({key:'Enter',preventDefault(){}});
  assert.equal(sounds.length,0);assert.equal(c.renderVals().displayPowerGate,true);assert.equal(c.renderVals().displayTvBusy,true);
  assert.equal(timers.get(c._displayApproachT).delay,760);
  const transition=(cls,propertyName='transform')=>c.renderVals().displayCameraEnd({target:{classList:{contains:k=>k===cls}},propertyName});
  transition('vintage-knob-face');assert.equal(c._displayPhase,'approach');
  transition('tv-cabinet');assert.equal(c._displayPhase,'zoom');assert.equal(timers.get(c._displayZoomT).delay,1560);
  transition('tv-camera','border-color');assert.equal(c._displayPhase,'zoom');transition('tv-camera');
  assert.deepEqual(sounds,['running']);assert.equal(c.renderVals().displayPowerGate,false);
  assert.equal(c.renderVals().displayAnimating,true);assert.equal(c.state.bootLog,undefined);
  const opening=c._displayOpenT;assert.equal(timers.get(opening).delay,4400);
  c.powerDisplayOn();assert.equal(sounds.length,1);assert.equal(c._displayOpenT,opening);
  c.finishDisplayOpening();assert.equal(c.state.languageOpen,true);c.chooseLanguage('pt');assert.equal(c.state.bootFault,true);
});

test('even permitted audio waits for power, while stored mute keeps the same visual entry',()=>{
  const live=television('running');live.c.componentDidMount();assert.equal(live.sounds.length,0);assert.equal(live.c.renderVals().displayPowerGate,true);
  live.c.powerDisplayOn();live.c.prepareDisplayZoom();live.c.beginDisplayOpening(live.c._displaySoundWanted);assert.deepEqual(live.sounds,['running']);
  assert.equal(live.c.renderVals().displayPowerGate,false);assert.equal(live.c.renderVals().displayAnimating,true);
  const muted=television();muted.c._sndPref=false;muted.c.audio=()=>assert.fail('Muted preference must not initialize audio');muted.c.componentDidMount();
  muted.c.powerDisplayOn();muted.c.prepareDisplayZoom();muted.c.beginDisplayOpening(muted.c._displaySoundWanted);
  assert.equal(muted.sounds.length,0);assert.equal(muted.c.renderVals().displayPowerGate,false);assert.equal(muted.c.renderVals().displayAnimating,true);
});

test('audio may resume during zoom but never plays late or blocks entry if it remains suspended',()=>{
  const live=television();live.c.componentDidMount();live.c.powerDisplayOn();live.c.prepareDisplayZoom();
  live.ac.state='running';live.c.beginDisplayOpening(true);assert.deepEqual(live.sounds,['running']);
  live.c.beginDisplayOpening(true);assert.equal(live.sounds.length,1);
  const silent=television();silent.c.componentDidMount();silent.c.powerDisplayOn();silent.c.prepareDisplayZoom();silent.c.beginDisplayOpening(true);
  assert.equal(silent.c.renderVals().displayAnimating,true);assert.equal(silent.sounds.length,0);
  silent.ac.state='running';silent.c.beginDisplayOpening(true);assert.equal(silent.sounds.length,0);
  silent.c.finishDisplayOpening();assert.equal(silent.c.state.languageOpen,true);assert.equal(silent.sounds.length,0);
});

test('unmount cancels every camera phase and prevents stale callbacks from starting the portfolio',()=>{
  for(const phase of ['off','approach','zoom','warmup']){
    const {c,timers,sounds}=television();c.componentDidMount();
    if(phase!=='off')c.powerDisplayOn();if(['zoom','warmup'].includes(phase))c.prepareDisplayZoom();if(phase==='warmup')c.beginDisplayOpening(true);
    const stale=[...timers.values()].map(t=>t.fn);c.componentWillUnmount();stale.forEach(fn=>fn());
    assert.equal(timers.size,0);assert.equal(sounds.length,0);assert.equal(c._displayOpenT,null);assert.equal(c.state.bootLog,undefined);
  }
});

test('camera zoom covers desktop and portrait viewports and centers the actual TV glass',()=>{
  const {context}=controller(),zoom=context.PortfolioDisplay.zoomTransform;
  for(const [viewport,screen] of [
    [{left:0,top:0,width:1920,height:1080},{left:678,top:404,width:366,height:240}],
    [{left:8,top:8,width:374,height:820},{left:55,top:350,width:175,height:115}],
    [{left:40,top:30,width:950,height:480},{left:300,top:160,width:255,height:184}]
  ]){
    const z=zoom(screen,viewport);assert.ok(z.scale*screen.width>=viewport.width);assert.ok(z.scale*screen.height>=viewport.height);
    const x=viewport.width/2+z.x+z.scale*(screen.left-viewport.left+screen.width/2-viewport.width/2);
    const y=viewport.height/2+z.y+z.scale*(screen.top-viewport.top+screen.height/2-viewport.height/2);
    assert.ok(Math.abs(x-viewport.width/2)<.001);assert.ok(Math.abs(y-viewport.height/2)<.001);
  }
  assert.equal(zoom(null,{}),null);assert.equal(zoom({left:0,top:0,width:0,height:40},{left:0,top:0,width:500,height:500}),null);
});

test('vintage dials click, drag and use keyboard without starting the TV or changing sound',()=>{
  const {c,sounds,timers}=television();c.componentDidMount();
  c.turnDisplayKnob('channel');c.turnDisplayKnob('volume');assert.equal(c.state.displayChannel,2);assert.equal(c.state.displayVolume,6);
  const target={setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}};
  c.displayVolumeDown({pointerId:1,clientX:0,clientY:100,currentTarget:target});
  c.displayVolumeMove({pointerId:2,clientX:0,clientY:0});assert.equal(c.state.displayVolume,6);
  c.displayVolumeMove({pointerId:1,clientX:0,clientY:0});assert.equal(c.state.displayVolume,10);
  c.displayVolumeUp({pointerId:1,currentTarget:target});c.turnDisplayKnob('volume',{detail:1});assert.equal(c.state.displayVolume,10);
  c.displayVolumeKey({key:'Home',preventDefault(){},stopPropagation(){}});assert.equal(c.state.displayVolume,0);
  c.displayVolumeKey({key:'ArrowDown',preventDefault(){},stopPropagation(){}});assert.equal(c.state.displayVolume,0);
  c.displayVolumeKey({key:'ArrowRight',preventDefault(){},stopPropagation(){}});assert.equal(c.state.displayVolume,1);
  assert.equal(c._displayPhase,'off');assert.equal(sounds.length,0);assert.equal(timers.size,0);
  c.powerDisplayOn();c.turnDisplayKnob('volume');assert.equal(c.state.displayVolume,1);
});

test('entry contains a 3D cabinet with working physical controls and a deliberately slower warmup',()=>{
  const {context}=controller(),api=context.PortfolioDisplay,html=read('src/template.html'),css=read('src/display.css');
  assert.equal(api.approachDuration+api.zoomDuration+api.openingDuration,6200);
  assert.match(css,/transform-style:preserve-3d/);assert.match(css,/tv-power-sequence 4200ms/);
  for(const cls of ['vintage-front','vintage-side','vintage-top','vintage-screen','vintage-power','vintage-volume','vintage-channel'])assert.ok(html.includes(cls),cls);
  assert.match(html,/ref="\{\{setDisplayTvScreen\}\}"/);assert.match(html,/sc-camel-on-pointer-move="\{\{displayVolumeMove\}\}"/);
  assert.doesNotMatch(html,/displayPowerSilent|tv-power-silent/);
});

test('TV blup uses a short descending rounded tone, respects suspended audio and contains no high whistle',()=>{
  const {c}=controller(),tones=[],noise=[];c._ac={state:'running'};c._mix={};c.tone=(...args)=>tones.push(args);c.noise=(...args)=>noise.push(args);
  assert.equal(c.tvPowerSound(),true);assert.equal(tones.length,3);assert.equal(noise.length,2);
  assert.deepEqual(tones[0],[620,.28,'sine',.14,.07,62]);
  for(const [frequency,duration,type,volume,offset,end] of tones){assert.ok(frequency<=620&&end<frequency);assert.ok(duration+offset<.6);assert.ok(volume<=.14);assert.ok(['sine','triangle'].includes(type));}
  c._ac.state='suspended';assert.equal(c.tvPowerSound(),false);assert.equal(tones.length,3);
  c._ac.state='running';c.tone=()=>{throw Error('audio unavailable');};assert.equal(c.tvPowerSound(),false);
});
test('3D model clicks animate while actual drags remain direct manipulation',()=>{
  const {c}=controller();c.state={page:'inicio'};c._wk={page:'inicio',hidden:false};let queued=0,blocked=0;
  const el={tagName:'BUTTON',disabled:false,getAttribute:()=>'',hasAttribute:()=>false,classList:{contains:()=>false}};
  const target={closest:sel=>sel.includes('a[href]')?el:sel==='.m3d'?{}:null};
  const sc={contains:()=>true,getBoundingClientRect:()=>({left:0,top:0})};c.screenEl=()=>sc;c.worldPoke=()=>queued++;
  const event={isTrusted:true,detail:1,target,preventDefault:()=>blocked++,stopPropagation(){},stopImmediatePropagation(){}};
  c.pokeCapture(event);assert.equal(queued,1);assert.equal(blocked,1);c._dragEnd=Date.now();c.pokeCapture(event);assert.equal(queued,1);
});
test('desktop Escape from the terminal input returns to its home screen',()=>{
  const {c}=controller();c.state={page:'quarto',deView:'terminal'};c.renderVals().deInputKey({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(c.state.deView,'home');
});

test('reboot closes the desktop and a new game restores the initial hitbox',()=>{
  const {c}=controller({setTimeout:()=>1});c.state={page:'quarto',deOpen:true,ctl:'pad'};c._desktopSession=true;c.persist=()=>true;c.sfx=()=>{};c.unlock=()=>{};c.musicStop=()=>{};
  c.reboot();assert.equal(c.state.deOpen,false);assert.equal(c._desktopSession,false);c.wipeProgress();assert.equal(c.state.ctl,'hitbox');assert.equal(c.state.hitFighter,'ryu');
});
