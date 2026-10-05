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
  for(const f of ['assets/content.js','src/i18n.js','src/boot.js','src/boot-flow.js','src/skill-tree.js','src/character.js','src/character-care.js','src/room-props.js','src/dice.js','src/shooter.js','src/scene.js','src/desktop.js','src/pocket-games.js','src/hitbox.js','src/achievements.js','src/tv3d.js','src/display.js','src/tv-game.js','src/title-sound.js','src/gamepad.js','src/enhancements.js'])vm.runInContext(read(f),context);
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
test('dust appears at the fall impact and remains after getting up',()=>{
  const {c}=controller();c.state={page:'inicio'};c.sfx=()=>{};c.unlock=()=>{};
  const wk={page:'inicio',x:120,y:150,dir:'d',moving:true};c._wk=wk;c.tripStart(wk);
  c.worldFloStep(wk,800);assert.equal(!!c._characterDust,false);
  c.worldFloStep(wk,200);assert.equal(c._characterDust,true);assert.equal(c.state.characterDirty,true);
  c.worldFloStep(wk,700);assert.equal(wk.flo,null);assert.equal(c._characterDust,true);
});
test('face wipe, clothes brush and shake finish on the same walking page',()=>{
  const {c,context}=controller();c.sfx=()=>{};
  for(const [index,page] of ['inicio','projetos','sobre','contato'].entries()){
    c.state={page};c._wk={page,x:180,y:190,dir:'r',moving:false};c._characterDust=true;
    const kind=context.PortfolioCharacterCare.kinds[index%3];assert.equal(c.characterClean(kind),true);assert.equal(c._characterClean.kind,kind);
    for(let i=0;i<21;i++)c.worldFloStep(c._wk,60);
    assert.equal(c._characterDust,false);assert.equal(c._characterClean,null);assert.equal(c.state.page,page);assert.equal(c._wk.x,180);assert.equal(c._wk.y,190);
  }
});
test('cleanup requires six alternating presses and ignores repeats, typing and control inputs',()=>{
  const {c,context}=controller();c.state={page:'sobre'};c._wk={page:'sobre',dir:'d'};c._characterDust=true;c.sfx=()=>{};
  for(const key of 'adada')assert.equal(c.characterCareKey({key,preventDefault(){}}),false);
  assert.equal(c.characterCareKey({key:'d',preventDefault(){}}),true);assert.equal(c._characterClean.kind,'shake');
  c._characterClean=null;c._characterShake=null;
  for(let i=0;i<12;i++)c.characterCareKey({key:i%2?'d':'a',repeat:true,preventDefault(){}});assert.equal(c._characterClean,null);
  for(const key of 'adadad')c.characterCareKey({key,target:{closest:()=>true},preventDefault(){}});assert.equal(c._characterClean,null);
  const input=context.PortfolioCharacterCare.shakeInput;
  let sequence=null;for(let i=0;i<6;i++)sequence=input(sequence,i%2?'a':'d',i*300);assert.equal(sequence.count,6);
  sequence=input(sequence,'d',2401);assert.equal(sequence.count,1);assert.equal(input(sequence,'w',2500),null);
});
test('cleanup is cosmetic, does not block ordinary walking, and cannot start behind a game or menu',()=>{
  const {c}=controller();c.state={page:'inicio'};c._wk={page:'inicio',dir:'d'};c.sfx=()=>{};
  assert.equal(c.characterClean(),false);c._characterDust=true;
  c.worldKey({key:'w',preventDefault(){}});assert.equal(c._wKeys.w,true);
  for(const flag of ['paused','languageOpen','tvGameOpen','deOpen','rmDlg','shooterOpen']){c.state[flag]=true;assert.equal(c.characterClean(),false);c.state[flag]=false;}
  assert.equal(c.characterClean('wipe'),true);c.state.paused=true;c.characterCareStep(60);assert.equal(c._characterClean.t,0);
  c.state.paused=false;c.characterCareStep(60);assert.equal(c._characterClean.t,60);
});
test('clicking the room sprite clears dust without walking to another tile',()=>{
  const {c}=controller();c.state={page:'quarto'};c.sfx=()=>{};const rm=c.rmInit();rm.enter=false;rm.exit=false;rm.moving=false;c._characterDust=true;
  const [x,y]=[rm.x,rm.y];c.rmPxAt=()=>[x*16+8,y*16];let clicks=0;
  c.rmPointer({preventDefault(){clicks++;}});assert.equal(clicks,1);assert.equal(c._characterClean.actor,'room');
  for(let i=0;i<20;i++)c.rmUpdate(rm,60,false);
  assert.equal(c._characterDust,false);assert.equal(rm.x,x);assert.equal(rm.y,y);assert.equal(c.state.page,'quarto');
});
test('cleanup poses stay finite and reduced motion avoids rotation and particles',()=>{
  const {context}=controller(),api=context.PortfolioCharacterCare,poses=[];
  for(const kind of api.kinds){const pose=api.cleanPose({kind,t:420,dur:1200});poses.push(pose.rot);for(const value of Object.values(pose))assert.ok(typeof value==='string'||Number.isFinite(value));
    const calm=api.cleanPose({kind,t:180,dur:360,calm:true});assert.equal(calm.rot,0);assert.equal(calm.sx,1);assert.equal(calm.sy,1);
  }
  assert.equal(new Set(poses).size,3);
});
test('the clickable character area follows scrolling and hides during cleanup',()=>{
  const {c}=controller();c.state={page:'inicio'};c._wk={page:'inicio',x:100,y:200,dir:'d',walk:0};c._characterDust=true;c.sfx=()=>{};c.worldImg=()=>null;
  const ctx=new Proxy({},{get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)}),cv={width:600,height:400,style:{},getContext:()=>ctx};
  const geo={W:600,H:400,CH:900,u:2,top:50,dy:20},el={style:{},hidden:true};c._characterCleanTarget=el;c.worldDraw(cv,geo,c._wk);
  assert.equal(el.hidden,false);assert.equal(el.style.transform,'translate(78px,98px)');assert.equal(el.style.width,'44px');
  c.characterClean();c.worldDraw(cv,geo,c._wk);assert.equal(el.hidden,true);
});
test('cleanup prompts are localized and do not add progress to a save',()=>{
  const saved=new Map(),{c,context}=controller({localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)}});
  for(const locale of ['en','ja']){context.PortfolioI18n.set(locale);for(const text of ['Limpar a poeira de Hikaru','Clique para limpar a poeira','Um pouco de poeira. Clique em Hikaru ou alterne A/D seis vezes.','Limpar o rosto','Sacudir a roupa'])assert.notEqual(context.PortfolioI18n.t(text),text);}
  c._characterDust=true;c._visited={boot:true};assert.equal(c.canContinue(),false);assert.equal(c.persist(),false);
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
  const {c,context}=controller();c.state={openProj:0,galleryIndex:0};c.galleryMove(-1);
  const last=c.data().projects[0].gallery.length-1;assert.equal(c.state.galleryIndex,last,'back from the first goes to the last');c.galleryMove(1);assert.equal(c.state.galleryIndex,0);
  for(const p of c.data().projects)for(const img of p.gallery)assert.ok(fs.existsSync(new URL('../public/'+img.src.slice(2),import.meta.url)));
  // AquaSense opens on screenshots of the real dashboard, light enough to page through, captioned in every language.
  const shots=c.data().projects[0].gallery.filter(img=>img.src.endsWith('.jpg'));
  assert.equal(shots.length,9);assert.match(shots[0].src,/aquasense-overview\.jpg$/);assert.equal(c.data().projects[0].gallery.indexOf(shots[0]),0);
  for(const img of shots){
    assert.ok(fs.statSync(new URL('../public/'+img.src.slice(2),import.meta.url)).size<200*1024,img.src);
    for(const lang of ['en','ja']){context.PortfolioI18n.set(lang);assert.notEqual(context.PortfolioI18n.t(img.caption),img.caption,lang+': '+img.caption);}
  }
  context.PortfolioI18n.set('pt');
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

test('both playable room cabinets present play, their interaction and close in that order',()=>{
  const {c,context}=controller();
  for(const [id,play,interaction] of [['fliperama','arcade','cab:fliperama'],['fliperama-slug','shooter','cab:fliperama-slug']]){
    c.state={page:'quarto',roomObj:c.data().room.findIndex(o=>o.id===id),rmDlg:true};
    assert.deepEqual(Array.from(c.rmActs(),a=>a[1]),[play,interaction,'close']);assert.equal(c.rmActs()[0][0],'Jogar');
    assert.match(c.renderVals().rmDlgCls,/is-arcade/);assert.equal(c.renderVals().propOn,false);
    for(const lang of ['en','ja']){context.PortfolioI18n.set(lang);for(const [text] of c.rmActs())assert.notEqual(context.PortfolioI18n.t(text),text);}
  }
});

test('both arcade dialogs share the right-side close header and screen-controls-help structure',()=>{
  const html=read('src/template.html'),css=read('src/enhancements.css');
  for(const fragment of [html.split('<sc-if value="{{arcOpen}}"')[1].split('<sc-if value="{{deOpen}}"')[0],html.split('<sc-if value="{{shooterOpen}}">')[1].split('<sc-if value="{{debug}}">')[0]]){
    assert.match(fragment,/class="arc arcade-game/);assert.match(fragment,/class="arc-mq"[^]*?class="arc-t pix"[^]*?class="x-b"[^]*?aria-label="Sair do fliperama"/);
    assert.ok(fragment.indexOf('class="arc-sc"')<fragment.indexOf('class="arc-p'));
    assert.ok(fragment.indexOf('class="arc-p')<fragment.indexOf('<aside class="arc-how'));
  }
  assert.match(css,/\.shooter-cv\{aspect-ratio:64 \/ 30/);assert.doesNotMatch(css,/\.shooter\{display:block/);
  assert.match(css,/\.rm-dlg\.is-arcade\{grid-template-areas:'head actions' 'text actions'/);
  const {context}=controller();for(const lang of ['en','ja']){context.PortfolioI18n.set(lang);for(const row of read('src/translations-arcade.tsv').trim().split(/\r?\n/)){const [pt,en,ja]=row.split('\t');assert.equal(context.PortfolioI18n.t(pt),lang==='en'?en:ja);}}
});

test('shooter controls support keyboard holds, native button activation and stable modal refs',()=>{
  const {c}=controller();c.state={page:'quarto'};c.startLoop=()=>{};c.sfx=()=>{};c.unlock=()=>{};c.shooterOpen();c.shooterStart();
  const r=c.renderVals(),fire=r.shooterControls.find(x=>x.label==='Atirar');let stops=0;
  const e={key:' ',preventDefault(){},stopPropagation(){stops++;}};fire.keyDown(e);assert.equal(c._shooter.keys.fire,true);fire.keyUp(e);assert.equal(c._shooter.keys.fire,false);assert.equal(stops,2);
  const game=c._shooter;c.shooterKey({...e,key:'Enter',target:{closest:()=>({})}},true);assert.equal(c._shooter,game,'Enter on a focused button keeps its native action');
  assert.equal(r.setShooter,c.renderVals().setShooter);assert.equal(r.setShooterWrap,c.renderVals().setShooterWrap);
  const el={focus(){stops++;}};r.setShooterWrap(el);assert.equal(stops,3);r.shooterBackdrop({target:{},currentTarget:el});assert.equal(c.state.shooterOpen,true);
  r.shooterBackdrop({target:el,currentTarget:el});assert.equal(c.state.shooterOpen,false);
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

test('hitbox is default, exposes twelve inputs and 42 adapted classic moves',()=>{
  const {c,context}=controller(),r=c.renderVals();assert.equal(r.isHitbox,true);assert.equal(r.isGb,false);
  assert.equal(r.hitDirections.length,4);assert.equal(r.hitAttacks.length,8);assert.equal(context.PortfolioHitbox.moves.length,42);
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
test('desktop has twelve apps, embedded locale resume and an allowlisted terminal',()=>{
  const {c,context}=controller({setTimeout:()=>1,clearTimeout(){}}),got=[];c.state={page:'quarto'};c.unlock=x=>got.push(x);c.sfx=()=>{};c.startLoop=()=>{};
  c.openPc();c.desktopReady();assert.equal(c.state.deOpen,true);assert.equal(c.renderVals().deApps.length,12);
  for(const lang of ['pt','en','ja']){context.PortfolioI18n.set(lang);c.desktopApp('resume');assert.equal(c.renderVals().dePdf,'./resume/hikaru-'+lang+'.pdf');}
  context.PortfolioI18n.set('pt');c.setState({deResumeLocale:'ja'});assert.equal(c.renderVals().dePdf,'./resume/hikaru-ja.pdf','Files can pick another résumé language');
  for(const cmd of ['neofetch','whoami','htop','date','ls','ls projects','projetos','contact','history','sudo rm -rf /']){c.state.deInput=cmd;c.desktopCommand();assert.ok(c.state.deOutput,cmd);}
  assert.ok(got.includes('fetch-yourself'));assert.ok(got.includes('desktop-resume'));
  assert.equal(c.state.deLog.length,10,'The terminal keeps its scrollback');assert.match(c.state.deOutput,/sudoers/);
  c.state.deInput='window.evil=true';c.desktopCommand();assert.equal(context.evil,undefined);assert.match(c.state.deOutput,/Comando não encontrado/);
  c.state.deInput='open arquivos';c.desktopCommand();assert.equal(c.state.deView,'files','open launches an app by its localized name');
  c.desktopApp('game');assert.equal(c.state.deOpen,true);assert.equal(c.state.pcOpen,true);assert.equal(c.renderVals().pcOpen,false);c.closePc();assert.equal(c.state.deOpen,true);assert.equal(c.state.pcOpen,false);
});

test('tiling helpers split the longer side, never overlap and keep the gap',()=>{
  const {context}=controller(),{insert,remove,swap,layout,leaves,neighbor,setRatio}=context.PortfolioDesktop.tile,area={x:8,y:8,w:984,h:634};
  let tree=null;for(const id of ['terminal','files','monitor','music']){const {rects}=layout(tree,area),target=leaves(tree).at(-1);tree=insert(tree,target,id,rects[target]||area);}
  assert.equal(JSON.stringify(tree),JSON.stringify({split:'h',ratio:.5,a:{app:'terminal'},b:{split:'v',ratio:.5,a:{app:'files'},b:{split:'h',ratio:.5,a:{app:'monitor'},b:{app:'music'}}}}),'terminal left, files over monitor and player');
  const {rects,gutters}=layout(tree,area),ids=Object.keys(rects);assert.equal(gutters.length,3);
  for(const a of ids){const r=rects[a];assert.ok(r.x>=8&&r.y>=8&&r.x+r.w<=992&&r.y+r.h<=642,a);
    for(const b of ids)if(a<b){const o=rects[b],gapX=Math.max(o.x-(r.x+r.w),r.x-(o.x+o.w)),gapY=Math.max(o.y-(r.y+r.h),r.y-(o.y+o.h));assert.ok(gapX>=8||gapY>=8,a+'/'+b);}}
  assert.equal(neighbor(rects,'music','l'),'monitor');assert.equal(neighbor(rects,'monitor','u'),'files');assert.equal(neighbor(rects,'files','l'),'terminal');assert.equal(neighbor(rects,'terminal','l'),null);
  assert.deepEqual(Array.from(leaves(swap(tree,'terminal','music'))),['music','files','monitor','terminal']);
  assert.deepEqual(Array.from(leaves(remove(tree,'files'))),['terminal','monitor','music']);assert.equal(remove({app:'x'},'x'),null);
  assert.equal(setRatio(tree,'',2).ratio,.85);assert.equal(setRatio(tree,'b',0).b.ratio,.15);
});

test('desktop zoom centers the actual monitor on wide and portrait viewports',()=>{
  const {context}=controller(),zoom=context.PortfolioDesktop.zoomGeometry;
  for(const viewport of [{left:8,top:8,width:1904,height:1064},{left:0,top:0,width:390,height:844}]){
    const canvas={left:80,top:100,width:768,height:448},size={width:384,height:224},camera={camX:80,camY:0};
    const z=zoom(canvas,viewport,size,camera),x=canvas.left-viewport.left+(338-80)*2,y=canvas.top-viewport.top+21*2;
    assert.ok(Math.abs(x*z.scale+z.x-viewport.width/2)<.001);
    assert.ok(Math.abs(y*z.scale+z.y-viewport.height/2)<.001);
    assert.ok(44*z.scale>=viewport.width);assert.ok(28*z.scale>=viewport.height);
  }
  assert.equal(zoom(null,null,null),null);assert.equal(zoom({left:0,top:0,width:0,height:2},{left:0,top:0,width:1,height:2},{width:1,height:2}),null);
});

test('desktop waits for zoom, supports reduced motion and cancels an interrupted entry',()=>{
  for(const reduced of [false,true,'system']){
    const timers=new Map();let id=0;
    const {c}=controller({matchMedia:()=>({matches:reduced==='system'}),setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:key=>timers.delete(key)});
    c.state={page:'quarto',motionReduced:reduced===true};c.unlock=()=>{};c.sfx=()=>{};c.persistSoon=()=>{};c.startLoop=()=>{};
    c.openPc();const entry=c._deEntryT;assert.equal(timers.get(entry).delay,reduced===true?160:2300);assert.equal(c.renderVals().deReady,false);
    c.desktopApp('terminal');assert.equal(c.state.deView,'home');c.openPc();assert.equal(c._deEntryT,entry);
    timers.get(entry).fn();assert.equal(c.renderVals().deReady,true);assert.equal(timers.has(entry),false);
    c.desktopClose();c.openPc();const late=timers.get(c._deEntryT).fn;c.desktopClose();late();assert.equal(c.state.deOpen,false);assert.equal(c.state.dePhase,'closed');
  }
});

test('desktop applications are separate retained windows with close and minimize',()=>{
  const {c}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.unlock=()=>{};c.sfx=()=>{};c.startLoop=()=>{};
  c.openPc();c.desktopReady();c.desktopApp('terminal');c.state.deInput='whoami';c.desktopCommand();const output=c.state.deOutput;
  c.desktopApp('resume');c.desktopApp('skills');c.desktopApp('resume');
  assert.deepEqual(Array.from(c.state.deWindows),['terminal','resume','skills']);
  assert.deepEqual(Array.from(c.renderVals().deWindows.filter(w=>!w.hidden),w=>w.id),['terminal','skills','resume']);
  c.desktopMinimize();assert.equal(c.state.deView,'skills');assert.equal(c.state.deWindows.length,3);
  c.desktopApp('terminal');assert.equal(c.state.deOutput,output);c.desktopWindowClose();
  assert.deepEqual(Array.from(c.state.deWindows),['resume','skills']);assert.equal(c.state.deOpen,true);
  assert.equal(c.renderVals().deApps.find(a=>a.id==='resume').cls,'is-open');c.desktopApp('unknown');assert.equal(c.state.deView,'skills');
});

test('live desktop glass expands to precisely the final shell bounds without a replacement fade',()=>{
  const {context}=controller(),zoom=context.PortfolioDesktop.zoomGeometry;
  for(const viewport of [{left:8,top:8,width:1904,height:1064},{left:0,top:0,width:390,height:844}]){
    const canvas={left:80,top:100,width:768,height:448},z=zoom(canvas,viewport,{width:384,height:224},{camX:80});
    const margin=viewport.width<=760?6:16,w=Math.min(1800,viewport.width-2*margin),h=viewport.height-2*margin,left=(viewport.width-w)/2;
    const glassX=canvas.left-viewport.left+(327-80)*2,glassY=canvas.top-viewport.top+14*2;
    assert.ok(Math.abs(left+z.fromX-glassX)<.001);assert.ok(Math.abs(margin+z.fromY-glassY)<.001);
    assert.ok(Math.abs(w*z.fromSX-44)<.001);assert.ok(Math.abs(h*z.fromSY-28)<.001);
    assert.ok(Math.abs(glassX*z.cameraSX+z.cameraX-left)<.001);assert.ok(Math.abs(glassY*z.cameraSY+z.cameraY-margin)<.001);
  }
  const html=read('src/template.html'),css=read('src/desktop.css');
  assert.doesNotMatch(html,/<sc-if value="\{\{deReady\}\}"><section class="desktop-shell"/);
  assert.match(html,/desktop-shell" inert="\{\{deSurfaceInert\}\}"/);assert.doesNotMatch(css,/de-entry-fade/);
});

test('sitting immediately mounts the landing surface and starting zoom preserves that session',()=>{
  const timers=[];const {c}=controller({setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){}});
  c.state={page:'quarto'};c.sfx=()=>{};c.unlock=()=>{};c.startLoop=()=>{};c.persistSoon=()=>{};
  c.pcSit();assert.equal(c.state.dePhase,'seated');assert.equal(c.state.deOpen,true);assert.ok(c._rm.sit);
  assert.equal(c.renderVals().deSurfaceInert,'');const windows=c.state.deWindows;
  timers.find(t=>t.ms===480).fn();assert.equal(c.state.dePhase,'zoom');assert.equal(c.state.deWindows,windows);
  c.desktopReady();assert.equal(c.renderVals().deSurfaceInert,undefined);
  c.desktopClose();assert.equal(c._desktopSession,false);assert.equal(c.state.deOpen,false);
  assert.match(read('src/app.js'),/rm\.sit && rm\.sit\.kind !== 'puff' && !this\._desktopSession/);
});

test('taskbar toggles its own window and closing the top game reveals the profile underneath',()=>{
  const {c}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.sfx=()=>{};c.unlock=()=>{};c.startLoop=()=>{};c.persistSoon=()=>{};
  c.openPc();c.desktopReady();c.desktopApp('profile');const whole=c.renderVals().deWindows.find(w=>w.id==='profile').style;c.desktopApp('game');
  assert.equal(c.renderVals().deWindows.filter(w=>!w.hidden).length,2);assert.notEqual(c.renderVals().deWindows.find(w=>w.id==='profile').style,whole,'the game split the profile tile');c.desktopWindowClose('game');
  assert.equal(c.state.deView,'profile');assert.equal(c.renderVals().deWindows.find(w=>w.id==='profile').style,whole,'closing gives the space back');assert.equal(c._pc,null);
  c.desktopApp('profile');assert.equal(c.state.deView,'home');assert.equal(c.renderVals().deWindows.find(w=>w.id==='profile').hidden,true);
  c.desktopApp('profile');assert.equal(c.state.deView,'profile');assert.equal(c.renderVals().deWindows.find(w=>w.id==='profile').style,whole);
  for(const id of ['terminal','clock','settings'])c.desktopApp(id);
  assert.equal(c.renderVals().deWindows.filter(w=>!w.hidden).length,4);
  c.desktopWindowClose('clock');assert.equal(c.state.deView,'settings');
  c.desktopWindowClose('settings');assert.equal(c.state.deView,'terminal');
  const slots=c.renderVals().deWindows.map(w=>w.id).join();c.desktopWindowClose('profile');
  assert.equal(c.renderVals().deWindows.map(w=>w.id).join(),slots,'Stable loop slots prevent remounting another app');
});

test('gutters resize within bounds, title drags swap tiles and both release pointer capture',()=>{
  const {c,context}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.sfx=()=>{};c.unlock=()=>{};c.startLoop=()=>{};
  c.openPc();c.desktopReady();for(const id of ['terminal','files','monitor','music'])c.desktopApp(id);
  let held=false,dragging=null;const painted={},node=id=>painted[id]||(painted[id]={style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}});
  c._deWorkspace={getBoundingClientRect:()=>({left:0,top:0,width:1000,height:650}),setAttribute(k,v){dragging=v;},removeAttribute(){dragging=null;},querySelector:sel=>node(sel)};
  const el={setPointerCapture(){held=true;},hasPointerCapture:()=>held,releasePointerCapture(){held=false;},closest:()=>node('terminal-tile')};
  const e={button:0,pointerId:1,currentTarget:el,target:{closest:()=>null},clientX:500,clientY:300,preventDefault(){}};
  c.desktopGutterStart('',e);assert.equal(held,true);assert.equal(dragging,'true');
  c.desktopGutterMove({...e,clientX:700});assert.ok(Object.values(painted).some(n=>n.style.width),'gutter drags paint the DOM directly');
  c.setState({now:Date.now()});assert.equal(c.state.deTrees[1].ratio,.5,'nothing commits before release');
  c.desktopGutterMove({...e,clientX:5000});c.desktopEndDrag(e);assert.equal(held,false);assert.equal(dragging,null);assert.equal(c.state.deTrees[1].ratio,.85,'clamped');
  context.document.elementFromPoint=()=>({closest:()=>({getAttribute:()=>'music',setAttribute(){},removeAttribute(){}})});
  c.desktopTitleStart('terminal',e);c.desktopTitleMove({...e,clientX:900,clientY:600});assert.equal(dragging,'swap');c.desktopEndDrag(e);
  assert.deepEqual(Array.from(context.PortfolioDesktop.tile.leaves(c.state.deTrees[1])),['music','files','monitor','terminal']);
  c.desktopTitleStart('terminal',{...e,target:{closest:()=>({})}});assert.equal(c._deDrag,null,'Title buttons never initiate dragging');
  c.desktopGutterStart('',e);c.desktopWindowClose('terminal');assert.equal(held,false);assert.equal(c._deDrag,null);
  assert.equal(c.renderVals().setDeWorkspace,c.renderVals().setDeWorkspace,'Stable refs avoid resize observer render loops');
});

test('Alt bindings move focus, swap tiles, switch areas and go full screen; narrow screens tab the tiles',()=>{
  const {c}=controller({setTimeout:fn=>{fn();return 1;},clearTimeout(){}});c.state={page:'quarto'};c.sfx=()=>{};c.unlock=()=>{};c.startLoop=()=>{};c.tone=()=>{};c.persistSoon=()=>{};
  c.openPc();assert.equal(c.state.deLocked,false);assert.deepEqual(Array.from(c.state.deWindows),['terminal','files','monitor','music']);assert.equal(c.state.deView,'terminal');
  const key=(code,shiftKey=false)=>{const e={altKey:true,shiftKey,code,key:'',preventDefault(){},stopPropagation(){}};c.rootKey(e);};
  key('KeyL');assert.notEqual(c.state.deView,'terminal');c.desktopRaise('music',true);
  key('KeyH');assert.equal(c.state.deView,'monitor');key('KeyK');assert.equal(c.state.deView,'files');key('KeyH');assert.equal(c.state.deView,'terminal');
  key('KeyL',true);assert.notEqual(c.desktopLayout().rects.terminal.x,8,'Alt+Shift moves the tile');
  const ratio=c.state.deTrees[1].ratio;c.desktopGutterKey('',{key:'ArrowRight',preventDefault(){},stopPropagation(){}});assert.ok(Math.abs(c.state.deTrees[1].ratio-ratio-.05)<1e-9);
  key('KeyM');assert.equal(c.state.deFull,'terminal');assert.equal(c.renderVals().deWindows.filter(w=>!w.hidden).length,1);key('KeyM');assert.equal(c.state.deFull,null);
  key('Digit2');assert.equal(c.state.deWs,2);assert.deepEqual(Array.from(c.state.deWindows).slice(4),['skills','profile','notes'],'a new area opens its own set');
  assert.equal(c.renderVals().deWindows.filter(w=>!w.hidden).length,3);
  key('Digit1');c.desktopApp('skills');assert.equal(c.state.deWs,2,'opening an app on another area goes there');
  key('KeyP');assert.equal(c.state.deLauncher,true);c.rootKey({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(c.state.deLauncher,false);
  key('KeyQ',true);assert.equal(c.state.deWindows.includes('skills'),false);
  c._deWorkspace={getBoundingClientRect:()=>({width:420,height:600})};const r=c.renderVals();
  assert.equal(r.deNarrow,true);assert.equal(r.deTabs.length,2);assert.equal(r.deWindows.filter(w=>!w.hidden).length,1,'one tab at a time');
});

test('lock screen types the password, restores the dev area once and Escape leaves from it',()=>{
  const queue=[];const flush=()=>{for(let i=0;queue.length&&i<200;i++)queue.shift()();};
  const {c,context}=controller({setTimeout:fn=>{queue.push(fn);return queue.length;},clearTimeout(){}});c.state={page:'quarto'};const got=[];c.sfx=()=>{};c.unlock=x=>got.push(x);c.startLoop=()=>{};c.tone=()=>{};c.persistSoon=()=>{};
  c.openPc();assert.equal(c.renderVals().deLocked,true,'the glass shows the lock screen during the zoom');
  queue.shift()();assert.equal(c.state.dePhase,'ready');assert.equal(c.state.deLocked,true);assert.equal(c.state.deWindows.length,0);
  flush();assert.equal(c.state.deLocked,false);assert.equal(c.state.deLockDots,8);assert.deepEqual(Array.from(c.state.deWindows),['terminal','files','monitor','music']);
  assert.equal(c.state.deLog[0].cmd,'neofetch');assert.equal(got.includes('fetch-yourself'),false,'only a typed neofetch earns the achievement');
  c.desktopLock();assert.equal(c.state.deLocked,true);c.rootKey({key:'a',preventDefault(){},stopPropagation(){},target:{closest:()=>null}});assert.equal(c.state.deLocked,false);
  assert.equal(c.state.deWindows.length,4,'unlocking again keeps the session');queue.length=0;
  c.desktopLock();c.rootKey({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(c.state.deOpen,false);
  context.PortfolioI18n.set('pt');
});

test('launcher filters apps and actions in the visitor language and opens on Enter',()=>{
  const {c,context}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.sfx=()=>{};c.unlock=()=>{};c.startLoop=()=>{};
  c.openPc();c.desktopReady();c.desktopLauncher(true);assert.equal(c.state.deLocked,false);assert.equal(c.renderVals().deLaunchItems.length,14);
  c.setState({deLaunchQ:'monit'});const keys={preventDefault(){},stopPropagation(){}};c.renderVals().deLaunchKey({...keys,key:'Enter'});
  assert.equal(c.state.deView,'monitor');assert.equal(c.state.deLauncher,false);
  context.PortfolioI18n.set('en');c.desktopLauncher(true);c.setState({deLaunchQ:'files'});assert.equal(c.desktopLaunchItems()[0].id,'files');
  c.setState({deLaunchQ:'lock'});assert.equal(c.desktopLaunchItems()[0].id,'lock','a name that starts with the query beats Clock');
  c.renderVals().deLaunchKey({...keys,key:'Enter'});assert.equal(c.state.deLocked,true);
  context.PortfolioI18n.set('pt');
});

test('files browse the project folders, preview their files and hand résumés to the viewer',()=>{
  const {c,context}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.sfx=()=>{};c.unlock=()=>{};c.startLoop=()=>{};
  c.openPc();c.desktopReady();c.desktopApp('files');let r=c.renderVals();
  assert.equal(r.deFileItems.length,4);assert.ok(r.deFileItems.every(i=>i.folder));assert.equal(r.dePreviewFolder,true);
  r.deFileItems[1].pick();r=c.renderVals();assert.equal(r.deFolderOpen,false,'the first click selects');r.deFileItems[1].pick();r=c.renderVals();
  assert.equal(r.deFolderOpen,true);assert.equal(r.dePreviewReadme,true);assert.equal(r.deFileItems.some(i=>i.name==='repository.url'),false,'the lab has no public repository');
  r.deFilesBack();c.renderVals().deFileItems[0].pick();c.renderVals().deFileItems[0].pick();r=c.renderVals();const names=r.deFileItems.map(i=>i.name);
  for(const name of ['README.md','stack.txt','repository.url','aquasense-overview.jpg'])assert.ok(names.includes(name),name);
  context.PortfolioI18n.set('en');c.renderVals().deFilesBack();c.renderVals().deFileItems[2].pick();c.renderVals().deFileItems[2].pick();r=c.renderVals();
  r.deFileItems.find(i=>i.image).pick();r=c.renderVals();assert.equal(r.dePreviewImage,true);assert.match(r.dePreview.src,/\.en\.svg$/);
  r.dePlaces[1].go();r=c.renderVals();assert.equal(r.deFileItems.length,3);r.deFileItems[2].pick();c.renderVals().dePreview.view();
  assert.equal(c.state.deView,'resume');assert.equal(c.renderVals().dePdf,'./resume/hikaru-ja.pdf');
  context.PortfolioI18n.set('pt');
});

test('player plays the title and language themes as copies the screens never stop, and the monitor reports measurements',()=>{
  const {c,context}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.sfx=()=>{};c.unlock=()=>{};c.startLoop=()=>{};c.persistSoon=()=>{};
  const param={value:1,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}};
  const ac={state:'running',currentTime:0,createGain:()=>({gain:{...param},connect(){},disconnect(){}})};c.audio=()=>ac;c._ac=ac;c._mix={};c._snd=true;
  c.openPc();c.desktopReady();c.desktopApp('music');c.desktopPlay(4);
  assert.equal(c.desktopPlaying(),true);assert.equal(c._mTrack.language,undefined);c.titleMusicSync();c.languageMusicSync();assert.equal(c.desktopPlaying(),true);
  assert.equal(c.renderVals().deHasNowPlaying,true);assert.equal(c.renderVals().dePlaylist[4].cls,'is-cur is-playing');
  c.desktopPause();assert.equal(c.desktopPlaying(),false);c.desktopPlay(1);assert.equal(c.state.track,1,'room tracks go through the jukebox');c.desktopSkip(-1);assert.equal(c.state.deTrack,0);
  c._fps=57;c._ft=[1000/60,1000/57,50];const r=c.renderVals();assert.equal(r.deFps,'57');assert.equal(r.deNoHeap,true,'no invented memory figures');
  assert.equal(r.deFpsBars.filter(b=>b.cls).length,3);assert.equal(r.deFpsBars.at(-1).cls,'is-low');
  assert.equal(r.deProcs[0].name,'okwm');assert.ok(r.deProcs.some(p=>p.state==='tocando'),'the playing track is a process');
  for(const lang of ['en','ja']){context.PortfolioI18n.set(lang);for(const text of ['Este navegador não informa a memória do JavaScript.','Tempo nesta página','Quadros, memória e processos desta página','Escreva algo. Fica só no seu navegador.'])assert.notEqual(context.PortfolioI18n.t(text),text);}
  context.PortfolioI18n.set('pt');
});

test('desktop UI removes demo qualifiers and localizes floating window controls',()=>{
  const {c,context}=controller(),html=read('src/template.html').split('<sc-if value="{{deOpen}}">')[1].split('<sc-if value="{{pcOpen}}"')[0];
  assert.doesNotMatch(html,/fictício|demonstrativo|demonstração|simulad/i);assert.doesNotMatch(context.PortfolioDesktop.system.join(' '),/fictício|demonstração|simulad/i);
  c.state={deInput:'htop'};c.desktopCommand();assert.equal(c.state.deOutput,'Monitor de processos');
  for(const lang of ['en','ja']){
    context.PortfolioI18n.set(lang);
    for(const text of ['Arraste para mover. Setas movem; Shift + setas redimensionam.','Redimensionar janela','Monitor de processos','Atualização a cada segundo','CPU: 8 núcleos','Memória: 4,2 / 16 GB'])assert.notEqual(context.PortfolioI18n.t(text),text);
  }
});

test('desktop game stays inside the desktop and suspends while another window is active',()=>{
  const {c,context}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.unlock=()=>{};c.sfx=()=>{};c.startLoop=()=>{};c.persistSoon=()=>{};
  c.openPc();c.desktopReady();c.desktopApp('game');const game=c._pc;c.loopPc(40);assert.equal(game.t,.04);
  assert.equal(c.renderVals().pcOpen,false,'No unrelated fullscreen game overlay');assert.equal(c.state.deOpen,true);
  game.keys={j:true};c.desktopApp('profile');c.loopPc(40);assert.equal(game.t,.04);assert.deepEqual({...game.keys},{});
  c.desktopApp('game');assert.equal(c._pc,game);c.loopPc(40);assert.equal(game.t,.08);
  context.document.hidden=true;c.loopPc(40);assert.equal(game.t,.08);context.document.hidden=false;
  c.desktopMinimize();c.loopPc(40);assert.equal(game.t,.08);c.closePc();assert.equal(c._pc,null);assert.equal(c.state.deOpen,true);
});

test('desktop game keyboard buttons release jump/duck and native controls keep Enter',()=>{
  const {c}=controller();c._pc=c.pcNew();c.sfx=()=>{};c.pcStart();let stopped=0;
  const e={key:' ',preventDefault(){},stopPropagation(){stopped++;}},r=c.renderVals();
  r.deDuckKeyDown(e);assert.equal(c._pc.duck,true);r.deDuckKeyUp(e);assert.equal(c._pc.duck,false);
  r.deJumpKeyDown(e);assert.equal(c._pc.air,true);r.deJumpKeyUp(e);assert.equal(c._pc.keys.j,false);assert.equal(stopped,4);
  const keys={...c._pc.keys};r.deGameKey({...e,key:'Enter',target:{closest:()=>({})}});assert.deepEqual({...c._pc.keys},keys);
});

test('desktop skills expose four populated categories and localized skill descriptions',()=>{
  const {c,context}=controller();c.sfx=()=>{};
  for(const lang of ['pt','en','ja']){
    context.PortfolioI18n.set(lang);const r=c.renderVals();assert.equal(r.skNodes.length,21);assert.equal(r.deSkillGroups.length,4);
    assert.equal(r.deSkillGroups.reduce((n,g)=>n+g.nodes.length,0),16);
    for(const group of r.deSkillGroups)for(const skill of group.nodes){
      skill.pick();const selected=c.renderVals();assert.equal(selected.skName,skill.label);assert.ok(selected.skDesc.length>15);
      if(lang!=='pt')assert.notEqual(context.PortfolioI18n.t(selected.skDesc),selected.skDesc);
    }
  }
});

test('desktop has a local power button, bottom icon taskbar, internal windows and no boot skip',()=>{
  const html=read('src/template.html'),desktop=html.split('<sc-if value="{{deOpen}}">')[1].split('<sc-if value="{{pcOpen}}"')[0],css=read('src/desktop.css');
  assert.match(desktop,/class="desktop-bar"[^]*?on-click="\{\{deClose\}\}"[^]*?aria-label="Desligar o computador"[^]*?class="desktop-power"/);
  assert.match(html,/class="hb pwr"[^]*?on-pointer-down="\{\{pwrDown\}\}"/);
  assert.match(desktop,/list="\{\{deWindows\}\}"/);assert.match(desktop,/hidden="\{\{win.hidden\}\}"/);
  assert.match(desktop,/on-click="\{\{win.close\}\}"[^]*?aria-label="Fechar janela"/);
  assert.ok(desktop.indexOf('desktop-dock')>desktop.indexOf('desktop-window-body'));
  assert.match(desktop,/path sc-camel-d="\{\{app.icon\}\}"/);assert.doesNotMatch(desktop,/<small>/);
  assert.match(css,/\.desktop-window\[hidden\]\{display:none\}/);assert.match(css,/\.desktop-dock \.de-apps>button\{[^}]*white-space:nowrap/);
  assert.match(desktop,/class="desktop-lock"/);assert.match(desktop,/list="\{\{deGutters\}\}"/);assert.match(desktop,/class="desktop-launcher"/);
  assert.match(css,/\.desktop-window-body\{[^}]*overflow:auto/);assert.doesNotMatch(html,/bootSkip|blog-skip/);
});

test('desktop entry beat is short, muted correctly and released on cancellation',()=>{
  const {c}=controller();let created=0,stops=0;const starts=[],ends=[];
  const param={setValueAtTime(){},exponentialRampToValueAtTime(){}};
  const ac={state:'running',currentTime:0,createGain:()=>({gain:{...param},connect(){},disconnect(){}}),createOscillator:()=>{created++;return {frequency:param,connect(){},disconnect(){},start:t=>starts.push(t),stop:t=>{stops++;if(t!==undefined)ends.push(t);}};}};
  c.audio=()=>ac;c._mix={};c._snd=false;c.desktopBeat();assert.equal(created,0);
  c._snd=true;ac.state='suspended';c.desktopBeat();assert.equal(created,0);
  ac.state='running';c.desktopBeat();assert.equal(created,14);assert.ok(Math.max(...ends)<2.3);assert.equal(starts[0],0);
  const scheduled=stops;c.desktopStopBeat();assert.equal(stops,scheduled+14);assert.equal(c._deBeatNodes.length,0);assert.equal(c._deBeatBus,null);
});

test('desktop focus is requested once and Escape closes windows before leaving the computer',()=>{
  const {c}=controller({setTimeout:()=>1,clearTimeout(){}});c.state={page:'quarto'};c.unlock=()=>{};c.sfx=()=>{};c.startLoop=()=>{};c.persistSoon=()=>{};
  let focus=0;const target={focus(){focus++;}};c._deShell={querySelector:()=>target,focus(){focus++;}};
  c.openPc();c.desktopFocus();c.desktopReady();c.desktopApp('terminal');c.desktopFocus();c.desktopFocus();assert.equal(focus,2);
  const e={key:'Escape',preventDefault(){},stopPropagation(){}};c.rootKey(e);assert.equal(c.state.deOpen,true);assert.equal(c.state.deView,'home');
  c.rootKey(e);assert.equal(c.state.deOpen,false);assert.equal(c._desktopSession,false);assert.equal(c.state.powering,undefined);
});

test('new desktop window, taskbar, skill and game instructions are translated',()=>{
  const {context}=controller(),copy=['Abrindo o computador…','Abra um aplicativo na barra inferior.','Minimizar janela','Fechar janela','Desligar o computador','Explore os ramos ou selecione uma habilidade para ver como eu a uso.','Espaço ou ↑: pular · ↓: abaixar · P: pausar · Esc: fechar a janela.','Segure o salto para ir mais alto. Trocar de aplicativo suspende a partida.','Pausar / continuar','Reiniciar partida'];
  for(const lang of ['en','ja']){context.PortfolioI18n.set(lang);for(const text of copy)assert.notEqual(context.PortfolioI18n.t(text),text,lang+': '+text);}
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

test('the first bedroom tutorial is saved, restored and reset with a new game',()=>{
  const saved=new Map(),storage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
  const options={localStorage:storage,setTimeout:()=>1,clearTimeout(){}};
  const {c}=controller(options);c.state={page:'quarto'};c._visited={inicio:true,quarto:true};c.sfx=()=>{};
  c.roomIntro();assert.equal(c.state.rmIntro,true);assert.equal(c._rmIntroShown,true);
  assert.equal(c.persist(),true);assert.equal(JSON.parse(saved.get('okaru-save-v1')).roomIntro,true);
  const {c:restored}=controller(options);restored.loadSave();restored.state.page='quarto';
  assert.equal(restored._rmIntroShown,true);restored.roomIntro();assert.notEqual(restored.state.rmIntro,true);
  restored.wipeProgress();assert.equal(restored._rmIntroShown,false);restored.roomIntro();assert.equal(restored.state.rmIntro,true);
});

test('a legacy portfolio-only save still gets the room tutorial; experienced room visitors do not repeat it',()=>{
  const save={v:1,visited:{inicio:true},room:{}};
  const {c}=controller({localStorage:{getItem:()=>JSON.stringify(save)},setTimeout:()=>1,clearTimeout(){}});
  c.loadSave();assert.equal(c._rmIntroShown,false);
  save.room={janela:true,espelho:true,celular:true};c.loadSave();assert.equal(c._rmIntroShown,true);
  save.roomIntro=false;c.loadSave();assert.equal(c._rmIntroShown,false,'Explicit new-format flag supersedes the legacy inference');
  save.roomIntro='true';c.loadSave();assert.equal(c._rmIntroShown,false,'Only boolean true counts');
});

test('room tutorial uses all five translated steps after hatch arrival in every language',()=>{
  for(const lang of ['pt','en','ja']){
    const {c,context}=controller({setTimeout:()=>1,clearTimeout(){}});context.PortfolioI18n.set(lang);
    c.state={page:'quarto',motionReduced:true};c.sfx=()=>{};
    c._teleportDestination='quarto';c._teleportArrival='room-home';c.rmWalkIn();
    assert.equal(c.state.rmIntro,true);assert.equal(c.state.rmStep,0);
    const lines=c.rmIntroLines();assert.equal(lines.length,5);
    for(let i=0;i<lines.length;i++){
      c.rmIntroStep(i);assert.equal(c.state.rmStep,i);
      assert.equal(c._dlg.text,context.PortfolioI18n.t(lines[i].text));
      if(lang!=='pt')assert.notEqual(c._dlg.text,lines[i].text);
    }
  }
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
  assert.match(log,/<span class="bll-t">\{\{bootRecoverText\}\}<\/span>/);
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
  assert.equal(c.renderVals().bootLines.length,96);assert.equal(c.renderVals().bootFailures.length,context.PortfolioBootFlow.popupMax);
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

test('a first visit chooses its language before the television, a saved language starts on it, and the boot waits for the entry',()=>{
  for(const saved of [null,'ja']){
    const writes=new Map(),timers=new Map();let id=0;
    const {c,context}=controller({localStorage:{getItem:k=>k==='okaru-language'?saved:null,setItem:(k,v)=>writes.set(k,v)},document:{documentElement:{},getElementById:()=>null,addEventListener(){}},setInterval:()=>1,setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
    context.addEventListener=()=>{};c.state={page:'boot'};c.startLoop=()=>{};c.componentDidMount();
    let r=c.renderVals();
    assert.equal(r.languageOpen,!saved);assert.equal(r.displayPowerGate,!!saved,'the television waits for the first choice');assert.equal(c.state.displayStarting,true);
    assert.equal(r.isBoot,false);assert.equal(r.notBoot,false);assert.equal(r.displayStandby,!!saved);
    assert.equal(writes.has('okaru-boot-seen'),false);assert.equal(c._blT,undefined);
    if(!saved){
      c.bootLogStart();assert.equal(!!c.state.bootLog,false);
      c.chooseLanguage('en');r=c.renderVals();
      assert.equal(writes.get('okaru-language'),'en');assert.equal(r.languageOpen,false);assert.equal(r.displayPowerGate,true);assert.match(r.displayTvClass,/is-tv-arrive/,'the set turns on like a tube');
      assert.equal(!!c.state.bootLog,false,'nothing boots behind the television');assert.equal(writes.has('okaru-boot-seen'),false);
    }else assert.doesNotMatch(r.displayTvClass,/is-tv-arrive/);
    assert.equal(c._displayOpenT,undefined);
    c.enterDisplay();assert.equal(c._displayPhase,'zoom');assert.equal(!!c.state.bootLog,false);assert.doesNotMatch(c.renderVals().displayTvClass,/is-tv-arrive/);timers.get(c._displayZoomT).fn();
    assert.equal(c._displayPhase,'reveal');assert.equal(!!c.state.bootLog,false);
    const openingTimer=c._displayOpenT;assert.equal(timers.get(openingTimer).delay,520);
    c.finishDisplayOpening();assert.equal(timers.has(openingTimer),false);assert.equal(c.state.displayStarting,false);
    assert.equal(c.state.bootLog,true);assert.equal(context.PortfolioI18n.locale,saved||'en');assert.equal(c.canContinue(),false);
    if(!saved)assert.equal(c.state.bootFault,true,'a first visit still panics, after the entry');
    const bootTimer=c._blT;c.finishDisplayOpening();assert.equal(c._blT,bootTimer);
  }
});

test('only the gate fade releases startup; WebGL entry and the Movimento setting also work',()=>{
  for(const reduce of [false,true]){
    const timers=new Map();let id=0;
    // The system asks for reduced motion in both runs: only the portfolio setting decides.
    const {c,context}=controller({matchMedia:()=>({matches:true}),document:{documentElement:{},getElementById:()=>null,addEventListener(){}},setInterval:()=>1,setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
    context.addEventListener=()=>{};c.startLoop=()=>{};c.state={motionReduced:reduce};c.componentDidMount();
    c.chooseLanguage('en');assert.equal(c.state.bootLog,undefined);
    assert.equal(c.renderVals().rootCls.includes('is-tv-calm'),reduce);
    assert.equal(c._displayPhase,'idle');assert.equal(c.renderVals().displayAnimating,false,'the television can be explored first');
    const tv=fakeTv(c,{gl:true});c.enterDisplay();
    assert.equal(tv.calls[0][0],'enter');assert.equal(tv.calls[0][1].reduced,reduce);assert.equal(c._displayPhase,'entering');
    assert.equal(timers.get(c._displayWarmT).delay,9000);
    const gate={classList:{contains:k=>k==='tv-power-gate'}},end=c.renderVals().displayOpeningEnd;
    end({target:gate,animationName:'tv-gate-reveal'});assert.equal(c._displayPhase,'entering','the gate cannot finish before the camera is inside');
    c.displayEntered();assert.equal(c._displayPhase,'reveal','WebGL already flew into the glass');assert.equal(timers.has(c._displayWarmT),false);
    const opening=c._displayOpenT;assert.equal(timers.get(opening).delay,reduce?360:520);
    let blocked=0;c.rootKey({key:'Enter',preventDefault(){blocked++;}});assert.equal(blocked,1);assert.equal(c.state.displayStarting,true);
    if(reduce)timers.get(opening).fn();else end({target:gate,animationName:'tv-gate-reveal'});
    assert.equal(c.state.displayStarting,false);assert.equal(c.state.languageOpen,false);assert.equal(timers.has(opening),false);assert.ok(tv.calls.includes('destroy'));
    assert.equal(c.state.bootLog,true);assert.equal(c.state.bootFault,true);
  }
});

test('TV opening is cancelled on unmount and never returns for an internal reboot or language change',()=>{
  const timers=new Map();let id=0;
  const {c,context}=controller({document:{documentElement:{},getElementById:()=>null,addEventListener(){},removeEventListener(){}},setInterval:()=>1,clearInterval(){},setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
  context.addEventListener=()=>{};context.removeEventListener=()=>{};c.startLoop=()=>{};c.componentDidMount();c.enterDisplay();timers.get(c._displayZoomT).fn();
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
    for(const text of [...api.modes.flatMap(m=>[m.label,m.action,m.text]),c.data().room.find(o=>o.id==='tv').text,'Alternar estilo de tela','Ligar a televisão','Ligar TV','Girar o seletor de canal','Volume cenográfico','Clique ou arraste para girar','Canal',
      'Modo recrutador','ESTÁ COM PRESSA?','QUEBRE AQUI','DE NOVO!','MAIS UMA!','VIDRO QUEBRADO','MODO RECRUTADOR','Quebre a tela para abrir o modo recrutador','Clique na tela para abrir o modo recrutador','Toque na tela para abrir o modo recrutador',
      'Quebrar a tela','Abrir modo recrutador','Clique na tela para quebrar o vidro · arraste para girar a TV','Toque na tela para quebrar o vidro · arraste para girar a TV','Clique na tela para abrir o modo recrutador · arraste para girar a TV','Toque na tela para abrir o modo recrutador · arraste para girar a TV'])assert.notEqual(context.PortfolioI18n.t(text),text,lang+': '+text);
  }
  assert.match(css,/\.display-surface\{[^}]*pointer-events:none/);
  assert.match(css,/\.display-lines,\.display-vignette\{[^}]*pointer-events:none/);
  assert.match(css,/\.okr\.display-hd>\.grain,\.display-hd>\.display-surface\{display:none\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(html,/sc-camel-on-animation-end="\{\{displayOpeningEnd\}\}"/);
  assert.equal(c.renderVals().languageChoices.length,3);
  assert.doesNotMatch(html,/<sc-for list="\{\{languageChoices\}\}" as="language"><button[^>]+disabled=/,'the language screen comes before the television, so its options are live');
});

function fakeTv(c,{gl=true}={}){
  const calls=[],tv={gl,screen:{remove(){}},calls,press:name=>calls.push(name),orbit:(a,b)=>calls.push(['orbit',a,b]),enter:opts=>{calls.push(['enter',opts]);return true;},destroy:()=>calls.push('destroy')};
  c._tv=tv;c._tvGl=gl;c.state.displayGl=gl;return tv;
}
function television(state='suspended',extra={}){
  const timers=new Map();let id=0;
  const {c,context}=controller({document:{documentElement:{},getElementById:()=>null,addEventListener(){},removeEventListener(){}},setInterval:()=>1,clearInterval(){},setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i),...extra});
  context.addEventListener=()=>{};context.removeEventListener=()=>{};
  const ac={state,close(){this.state='closed';}};
  c._ac=ac;c.audio=()=>ac;c.startLoop=()=>{};c.state={page:'boot'};
  const sounds=[];c.tvPowerSound=c.tvWarmupSound=()=>{if(ac.state!=='running')return false;sounds.push(ac.state);return true;};
  return {c,context,ac,timers,sounds};
}

test('the opening television starts on and explorable, and its dock and keys drive the set until Enter',()=>{
  const {c,timers}=television();c.componentDidMount();
  let r=c.renderVals();assert.equal(r.languageOpen,true);assert.equal(r.displayPowerGate,false,'the language comes first');
  c.chooseLanguage('pt');r=c.renderVals();
  assert.equal(r.displayPowerGate,true);assert.equal(r.languageOpen,false);assert.equal(r.displayAnimating,false);assert.equal(r.isBoot,false);
  assert.equal(r.displayPowered,true);assert.equal(r.displayPowerLabel,'Desligar TV');assert.equal(r.displayChannel,'CH 01');assert.equal(r.displayVolume,4);
  assert.equal(r.displayRush,true);assert.equal(r.displayChannelName,'Modo recrutador');assert.match(r.displayHint,/quebrar o vidro/);
  c.finishDisplayOpening();assert.equal(c.state.displayStarting,true);
  r.displayChannelNext();r.displayVolRaise();r.displayPower();r=c.renderVals();
  assert.equal(r.displayChannel,'CH 02');assert.equal(r.displayVolume,5);assert.equal(r.displayPowered,false);assert.equal(r.displayPowerLabel,'Ligar TV');
  assert.equal(r.displayRush,false,'the break button belongs to the first channel');
  const tv=fakeTv(c,{gl:false}),free={closest:()=>null};
  for(const [key,action] of [['PageUp','channel+'],[']','channel+'],['PageDown','channel-'],['+','volume+'],['-','volume-'],['p','power']]){c.rootKey({key,target:free,preventDefault(){}});assert.equal(tv.calls.at(-1),action,key);}
  c.rootKey({key:'ArrowLeft',target:free,preventDefault(){}});assert.equal(tv.calls.at(-1)[0],'orbit');
  c.rootKey({key:'Tab',preventDefault(){assert.fail('Tab must reach the dock buttons');}});
  c.rootKey({key:'Enter',target:free,preventDefault(){}});assert.equal(c._displayPhase,'entering');assert.equal(tv.calls.at(-1)[0],'enter');
  c.renderVals().displayChannelNext();assert.equal(tv.calls.at(-1)[0],'enter','controls are locked while entering');
  c.displayEntered();assert.equal(c._displayPhase,'zoom','the CSS fallback still zooms into the glass');assert.equal(timers.get(c._displayZoomT).delay,1560);
  const transition=(cls,propertyName='transform')=>c.renderVals().displayCameraEnd({target:{classList:{contains:k=>k===cls}},propertyName});
  transition('tv-camera','border-color');assert.equal(c._displayPhase,'zoom');transition('tv-camera');assert.equal(c._displayPhase,'reveal');
  c.finishDisplayOpening();assert.equal(c.renderVals().displayPowerGate,false);assert.equal(c.state.languageOpen,false);assert.equal(c.state.bootLog,true);
});

test('the television host unlocks audio only from a gesture and respects the stored mute',()=>{
  const live=television('running');live.c.componentDidMount();let unlocked=0;live.c.audio=()=>{unlocked++;return live.ac;};
  const host=live.c.tvHost();assert.equal(unlocked,0,'nothing plays before the visitor interacts');
  assert.equal(host.soundOn(),true);host.unlock();assert.equal(unlocked,1);assert.equal(host.initialVolume,4);
  host.onChange({power:'off',channel:3,volume:7});const r=live.c.renderVals();assert.equal(r.displayPowered,false);assert.equal(r.displayChannel,'CH 04');assert.equal(r.displayVolume,7);
  const muted=television();muted.c._sndPref=false;muted.c.audio=()=>assert.fail('Muted preference must not initialize audio');muted.c.componentDidMount();
  const mh=muted.c.tvHost();assert.equal(mh.soundOn(),false);mh.unlock();muted.c.enterDisplay();assert.equal(muted.c._displayPhase,'zoom');
});

test('holding the power button turns the portfolio off back to the opening TV, and Enter boots it again',()=>{
  const timers=new Map();let id=0;
  const {c,context}=controller({localStorage:{getItem:k=>k==='okaru-language'?'en':null,setItem(){}},document:{documentElement:{},getElementById:()=>null,addEventListener(){}},setInterval:()=>1,setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
  context.addEventListener=()=>{};c.startLoop=()=>{};c.sfx=()=>{};c.focusRoot=()=>{};c.state={page:'boot'};c.componentDidMount();
  c._bootSafe=true;c.enterDisplay();timers.get(c._displayZoomT).fn();c.finishDisplayOpening();assert.equal(c.state.bootLog,true);
  Object.assign(c.state,{page:'quarto',bootLog:false});
  c.holdDone({kind:'pwr'});assert.equal(c.state.powering,true);assert.equal(timers.get(c._t3).delay,760);timers.get(c._t3).fn();
  let r=c.renderVals();
  assert.equal(c.state.page,'boot');assert.equal(r.displayPowerGate,true);assert.equal(r.isBoot,false);assert.equal(r.languageOpen,false);
  assert.equal(!!c.state.bootLog,false,'nothing boots behind the television');
  assert.equal(c._displayPhase,'exit','the camera comes back out of the glass');assert.equal(r.displayAnimating,true);assert.equal(r.displayTvBusy,true);assert.match(r.displayStatus,/Voltando à TV/);
  assert.doesNotMatch(r.displayTvClass,/is-tv-return/,'no fade: it starts inside the glass');assert.match(r.rootCls,/is-tv-starting/);
  assert.equal(c.tvHost().exit,true);
  let blocked=0;c.rootKey({key:'Enter',preventDefault(){blocked++;}});c.enterDisplay();assert.equal(blocked,1);assert.equal(c._displayPhase,'exit','nothing interrupts the pull back');
  assert.equal(timers.get(c._displayExitT).delay,context.PortfolioDisplay.exitTimeout);
  c.tvHost().onExited();r=c.renderVals();
  assert.equal(c._displayPhase,'idle');assert.equal(timers.has(c._displayExitT),false);assert.equal(r.displayAnimating,false);
  assert.equal(r.displayPowered,true,'the set is back on and explorable');assert.doesNotMatch(r.displayTvClass,/is-tv-return|is-tv-arrive/);
  c._bootSafe=true;c.enterDisplay();timers.get(c._displayZoomT).fn();c.finishDisplayOpening();
  assert.equal(c.state.displayStarting,false);assert.equal(c.state.bootLog,true,'the language is kept, so the boot follows the entry');
  assert.doesNotMatch(c.renderVals().displayTvClass,/is-tv-return/);
  Object.assign(c.state,{page:'quarto',bootLog:false});c.renderVals().pauseReboot();timers.get(c._t3).fn();
  assert.equal(c.state.displayStarting,false,'Voltar ao Press Start still goes straight to the boot');assert.equal(c.state.bootLog,true);
  assert.match(read('src/template.html'),/class="hb pwr"[^>]+aria-label="Energia: segure para desligar e voltar à TV"/);
  // With Movimento reduzido the set just fades in, already on and explorable.
  Object.assign(c.state,{page:'quarto',bootLog:false,motionReduced:true});c.calm=()=>true;
  c.holdDone({kind:'pwr'});timers.get(c._t3).fn();r=c.renderVals();
  assert.equal(c._displayPhase,'idle');assert.match(r.displayTvClass,/is-tv-return/);assert.equal(c.tvHost().exit,false);assert.equal(c._displayExitT,null);
});

test('the way back out of the portfolio runs the entry backwards: inside the glass, pull back, swing round, warm up',()=>{
  const {context}=controller(),TV=context.PortfolioTV,D=TV.durations,s=TV.createState({aspect:16/10}),home={...s.cam};
  assert.equal(TV.beginExit(s),true);assert.equal(TV.beginExit(s),false,'once at a time');
  assert.ok(Math.abs(s.cam.dist-TV.finalDistance(16/10))<1e-9,'it starts where the entry ends');assert.equal(s.cam.yaw,0);assert.equal(s.fx,0);
  assert.equal(s.power,'cooling','the dot the portfolio collapsed into fades out');
  assert.equal(TV.press(s,'channel+'),false);assert.equal(TV.beginEnter(s,false),false);assert.equal(TV.knock(s,.5,.5),null,'nothing works on the way out');
  s.cam.vy=.01;TV.step(s,16);assert.ok(Math.abs(s.cam.yaw)<1e-9,'no leftover spin');
  for(let t=16;t<D.EXIT_HOLD;t+=20)TV.step(s,20);
  TV.step(s,20);assert.equal(s.exit.stage,'pull');assert.equal(s.power,'off');assert.ok(s.events.includes('pull'));
  let last=s.cam.dist;
  for(let t=0;t<D.DOLLY-40;t+=40){TV.step(s,40);assert.ok(s.cam.dist>=last-1e-9,'it only pulls back');last=s.cam.dist;}
  assert.ok(s.fx>0&&s.fx<=1);
  TV.step(s,80);assert.equal(s.exit.stage,'swing');assert.equal(s.fx,1);assert.equal(s.power,'warming','the set turns back on as the camera swings round');assert.ok(s.events.includes('degauss'));
  for(let t=0;t<D.ALIGN+40;t+=40)TV.step(s,40);
  assert.equal(s.exit.stage,'done');for(const k of ['yaw','pitch','dist','tx','ty','tz'])assert.ok(Math.abs(s.cam[k]-home[k])<1e-6,k+' is back at the first view');
  s.exit=null;for(let t=0;t<D.POWER_ON;t+=50)TV.step(s,50);assert.equal(s.power,'on');assert.equal(TV.channels[s.channel].id,'rush');
  const flat=TV.createState();TV.beginExit(flat,{flat:true});for(let t=0;t<D.EXIT_HOLD+D.DOLLY+80;t+=40)TV.step(flat,40);
  assert.equal(flat.exit.stage,'done','the CSS fallback has no camera to swing');assert.equal(flat.power,'warming');
  const css=read('src/display.css');assert.ok(css.includes('.tv-power-gate:not(.tv-phase-idle) .tv-dock{opacity:0;pointer-events:none}'),'the dock waits for the camera');
});

test('the recruiter glass is the television’s first channel: three knocks open the recruiter view over it and its links skip the boot',()=>{
  const writes=new Map(),timers=new Map();let id=0;
  const {c,context}=controller({navigator:{language:'ja-JP'},localStorage:{getItem:k=>writes.get(k)??null,setItem:(k,v)=>writes.set(k,v)},document:{documentElement:{},getElementById:()=>null,addEventListener(){}},setInterval:()=>1,setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:i=>timers.delete(i)});
  context.addEventListener=()=>{};c.startLoop=()=>{};c.sfx=()=>{};c.focusRoot=()=>{};c.state={page:'boot'};c.componentDidMount();
  const I=context.PortfolioI18n;
  assert.equal(I.locale,'ja','a first visit is greeted in the browser language');assert.equal(writes.has('okaru-language'),false,'shown, not saved');
  let r=c.renderVals();assert.equal(r.languageOpen,true);assert.equal(r.languageQuestionLang,'ja');assert.equal(r.languageChoices.find(x=>x.cls==='is-cur').lang,'ja','the cursor starts on it');
  r.languageChoices[0].choose();assert.equal(writes.get('okaru-language'),'pt');assert.equal(I.locale,'pt');
  r=c.renderVals();assert.equal(r.displayPowerGate,true);assert.equal(r.displayRush,true,'the set starts on the recruiter channel');assert.equal(r.displayKnockLabel,'Quebrar a tela');
  r.displayKnock();r.displayKnock();assert.equal(!!c.state.recOpen,false,'two knocks only crack it');assert.equal(!!c.state.broke,false);
  r.displayKnock();assert.equal(c.state.broke,true);assert.equal(c.state.shatter,true,'the shards fly out of the set');
  timers.get(c._recT).fn();assert.equal(c.state.recOpen,true);assert.equal(c.state.displayStarting,true,'over the television');assert.equal(c.state.got.glass,true);
  assert.equal(c.renderVals().displayKnockLabel,'Abrir modo recrutador');
  c.rootKey({key:'Escape',target:{},preventDefault(){}});assert.equal(c.state.recOpen,false);assert.equal(c.state.displayStarting,true,'closing returns to the set');
  c.renderVals().displayKnock();assert.equal(c.state.recOpen,true,'a broken glass opens the view at once');
  c.renderVals().recSite();
  assert.equal(c.state.displayStarting,false);assert.equal(c._displayPhase,'done');assert.equal(!!c.state.bootLog,false,'no boot behind the shortcut');
  assert.equal(c.state.transitioning,true);assert.equal(c.state.nextPage,'inicio');
  const html=read('src/template.html'),at=html.indexOf('<section class="language-screen"');
  assert.ok(!html.slice(at,html.indexOf('</section>',at)).includes('glass'),'the language screen has no glass any more');
  assert.ok(!html.slice(html.indexOf('<section class="boot"'),html.indexOf('<sc-if value="{{notBoot}}"')).includes('glassDown'),'Press Start has no glass');
  assert.match(html,/<sc-if value="\{\{displayRush\}\}"><button class="tv-btn tv-knock" disabled="\{\{displayTvBusy\}\}" sc-camel-on-click="\{\{displayKnock\}\}">/);
  assert.ok(html.includes('class="vintage-screen" ref="{{setDisplayTvScreen}}" aria-hidden="true" sc-camel-on-click="{{displayScreenClick}}"'),'the CSS fallback glass takes knocks too');
  const css=read('src/display.css');assert.ok(css.includes('.tv-power-gate~.rec-l{z-index:960}'));assert.ok(css.includes('.tv-power-gate~.shat{z-index:970}'));
});

test('the recruiter channel cracks on the first two knocks, breaks on the third and then opens with one',()=>{
  const {context}=controller(),TV=context.PortfolioTV,s=TV.createState({aspect:1.6});
  assert.equal(TV.channels[0].id,'rush');assert.equal(TV.channels[0].score,undefined,'the set’s theme plays on it');assert.equal(TV.knocks,3);
  const off=TV.createState();off.channel=1;assert.equal(TV.knock(off,.5,.5),null,'only the first channel takes knocks');
  off.channel=0;off.power='off';assert.equal(TV.knock(off,.5,.5),null,'nor a set that is off');
  const tuning=TV.createState();tuning.tuneT=100;assert.equal(TV.knock(tuning,.5,.5),null);
  assert.equal(TV.knock(s,.4,.5),'crack');assert.equal(s.glass.hits.length,1);assert.ok(s.glass.cracks.length>=5);assert.ok(s.events.includes('knock')&&s.events.includes('crack'));
  assert.ok(s.glass.knockT>0);TV.step(s,1000);assert.equal(s.glass.knockT,0,'the shake settles');
  assert.equal(TV.knock(s,.6,.45),'crack');s.events.length=0;
  assert.equal(TV.knock(s,.5,.5),'break');assert.equal(s.glass.broken,true);assert.equal(s.glass.holes.length,1);assert.ok(s.events.includes('shatter'));
  for(const line of s.glass.cracks)for(const [x,y] of line)assert.ok(Number.isFinite(x)&&Number.isFinite(y));
  const cracks=s.glass.cracks.length;assert.equal(TV.knock(s,.2,.2),'open');assert.equal(s.glass.cracks.length,cracks,'a broken glass does not crack further');
  const again=TV.createState({broken:true});assert.equal(again.glass.broken,true);assert.ok(again.glass.cracks.length>0,'a set that comes back keeps its broken glass');
  const entering=TV.createState();TV.beginEnter(entering,false);assert.equal(TV.knock(entering,.5,.5),null,'nothing to knock while entering');
  const front={yaw:0,pitch:0,dist:2,tx:-.2,ty:0,tz:0},hit=TV.screenPoint(front,1.6,0,0);
  assert.ok(Math.abs(hit.u-.5)<.02&&Math.abs(hit.v-.5)<.02,'the middle of the view lands on the middle of the glass');
  assert.equal(TV.screenPoint({...front,tx:.54,ty:.24},1.6,0,0),null,'the dials are not glass');
  assert.equal(TV.screenPoint({...front,yaw:Math.PI},1.6,0,0),null,'nor is the back of the set');
});

test('the opening television plays its own theme through its volume, only while on and on channels without music',()=>{
  const {context}=controller(),TV=context.PortfolioTV,theme=TV.theme,notes=theme.ev.flat().filter(e=>!e.drum);
  assert.equal(theme.len,128);assert.ok(notes.length>80);
  const lead=notes.filter(n=>n.type==='square').map(n=>n.m);assert.ok(Math.min(...lead)>=67&&Math.max(...lead)<=79,'the lead stays between G4 and G5');
  assert.deepEqual(Array.from(TV.channels.filter(ch=>ch.score),ch=>ch.id),['show','rpg']);
  const started=[],param=()=>({value:1,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});let sound=true;
  const ac={state:'running',currentTime:0,sampleRate:8000,createGain:()=>({context:ac,gain:param(),connect(){},disconnect(){}}),
    createOscillator:()=>({frequency:param(),connect(){},start:t=>started.push(t),stop(){}}),createBuffer:(n,len,rate)=>({sampleRate:rate,getChannelData:()=>new Float32Array(len)}),
    createBufferSource:()=>({connect(){},start:t=>started.push(t),stop(){}}),createBiquadFilter:()=>({frequency:{},connect(){}})};
  const audio=TV.createAudio({ac:()=>ac,mix:()=>({}),soundOn:()=>sound,volume:()=>4}),s=TV.createState();
  audio.music(s);const first=started.length;assert.ok(first>0,'the theme starts as soon as audio runs');assert.ok(started.every(t=>t>=0&&t<=.2));
  audio.music(s);assert.equal(started.length,first,'nothing is scheduled twice');
  for(let t=.05;t<=2;t+=.05){ac.currentTime=t;audio.music(s);}assert.ok(started.length>first+15,'and it keeps going');
  for(const quiet of [()=>{s.power='off';},()=>{s.power='on';s.channel=3;},()=>{s.channel=4;},()=>{s.channel=0;sound=false;},()=>{sound=true;s.enter={stage:'tune'};}]){
    quiet();const n=started.length;for(let i=0;i<10;i++){ac.currentTime+=.05;audio.music(s);}assert.equal(started.length,n);
  }
});

test('television state: power cycles, tuning, volume, knobs and the flight into the glass',()=>{
  const {context}=controller(),TV=context.PortfolioTV,D=TV.durations,s=TV.createState({aspect:16/10});
  assert.equal(s.power,'on');assert.equal(TV.channels[s.channel].id,'rush','idle shows the recruiter channel');
  assert.deepEqual(Array.from(TV.channels,c=>c.id),['rush','fight','monsters','show','rpg','western']);
  TV.press(s,'channel+');assert.equal(s.channel,1);assert.ok(s.tuneT>0);assert.ok(s.events.includes('tune'));TV.step(s,D.TUNE);assert.equal(s.tuneT,0);
  TV.press(s,'channel-');TV.press(s,'channel-');assert.equal(s.channel,TV.channels.length-1);
  s.events.length=0;for(let i=0;i<20;i++)TV.press(s,'volume+');assert.equal(s.volume,10);for(let i=0;i<20;i++)TV.press(s,'volume-');assert.equal(s.volume,0);
  assert.equal(s.events.filter(e=>e==='vol').length,40);assert.equal(TV.gainFor(0),0);assert.ok(TV.gainFor(10)>TV.gainFor(5));assert.ok(s.volT>0,'the volume bar shows on screen');
  TV.press(s,'power');assert.equal(s.power,'cooling');TV.step(s,D.POWER_OFF);assert.equal(s.power,'off');
  TV.press(s,'power');assert.equal(s.power,'warming');s.events.length=0;for(let t=0;t<D.POWER_ON;t+=50)TV.step(s,50);assert.equal(s.power,'on');
  for(const sound of ['dot','crackle','snow','blup'])assert.ok(s.events.includes(sound),sound);
  for(let i=0;i<40;i++)TV.step(s,16);const k=TV.knobTargets(s);assert.ok(Math.abs(s.knob.volume-k.volume)<.01,'the volume knob turns to its position');
  TV.press(s,'power');TV.step(s,D.POWER_OFF);assert.equal(TV.beginEnter(s,false),true);assert.equal(s.power,'warming');assert.equal(s.card,true);
  assert.equal(TV.press(s,'channel+'),false,'controls are locked while entering');
  for(let t=0;t<D.POWER_ON+D.ALIGN+D.DOLLY+200;t+=40)TV.step(s,40);
  assert.equal(s.enter.stage,'done');assert.equal(s.fx,0);assert.ok(Math.abs(TV.finalDistance(16/10)-s.cam.dist)<1e-6);assert.ok(Math.abs(s.cam.yaw)<1e-9&&Math.abs(s.cam.pitch)<1e-9);
  const reduced=TV.createState();TV.beginEnter(reduced,true);for(let t=0;t<D.TUNE+40;t+=40)TV.step(reduced,40);assert.equal(reduced.enter.stage,'done','reduced motion skips the flight');assert.equal(reduced.fx,1);
});
test('the television camera orbits all the way round and only front panel controls can be clicked',()=>{
  const {context}=controller(),TV=context.PortfolioTV,s=TV.createState({aspect:1.6});
  for(const [name,c] of Object.entries(TV.layout.controls))assert.equal(TV.pick({yaw:0,pitch:0,dist:2,tx:c.x,ty:c.y,tz:0},1.6,0,0),name);
  assert.equal(TV.pick({yaw:Math.PI,pitch:0,dist:2,tx:.62,ty:-.21,tz:0},1.6,0,0),null,'from behind the set nothing on the front is clickable');
  assert.equal(TV.pick({yaw:0,pitch:0,dist:2,tx:-.2,ty:0,tz:0},1.6,0,0),null,'the glass itself is not a button');
  assert.equal(TV.controlAction({name:'volume+',x:.5,y:0}),'volume-');assert.equal(TV.controlAction({name:'volume+',x:.58,y:0}),'volume+');assert.equal(TV.controlAction({name:'channel+',x:.5,y:.24}),'channel-');
  s.cam.vy=.01;s.cam.vp=.01;for(let i=0;i<200;i++)TV.step(s,16);assert.ok(Math.abs(s.cam.pitch)<=1.45);assert.equal(s.cam.vy,0,'the spin settles');
  const top=TV.orbitEye({yaw:0,pitch:1.45,dist:3,tx:0,ty:0,tz:0}),bottom=TV.orbitEye({yaw:0,pitch:-1.45,dist:3,tx:0,ty:0,tz:0}),behind=TV.orbitEye({yaw:Math.PI,pitch:0,dist:3,tx:0,ty:0,tz:0});
  assert.ok(top[1]>2.9);assert.ok(bottom[1]<-2.9);assert.ok(behind[2]<-2.9);
  assert.ok(TV.finalDistance(1.6)<TV.fitDistance(1.6));
});

test('unmount cancels every opening phase and prevents stale callbacks from starting the portfolio',()=>{
  for(const phase of ['idle','entering','zoom','reveal']){
    const {c,timers}=television();c.componentDidMount();const tv=phase==='entering'?fakeTv(c,{gl:true}):null;
    if(phase!=='idle')c.enterDisplay();if(phase==='reveal')timers.get(c._displayZoomT).fn();
    assert.equal(c._displayPhase,phase);
    const stale=[...timers.values()].map(t=>t.fn);c.componentWillUnmount();stale.forEach(fn=>fn());c.displayEntered();
    assert.equal(timers.size,0);assert.equal(c._displayOpenT,null);assert.equal(c.state.bootLog,undefined);if(tv)assert.ok(tv.calls.includes('destroy'));
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

test('the CSS fallback dials still click, drag and take arrow keys through the same television actions',()=>{
  const {c,timers}=television();c.componentDidMount();
  c.turnDisplayKnob('channel');c.turnDisplayKnob('volume');assert.equal(c.state.displayChannel,1);assert.equal(c.state.displayVolume,5);
  const target={setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}};
  c.displayVolumeDown({pointerId:1,clientX:0,clientY:100,currentTarget:target});
  c.displayVolumeMove({pointerId:2,clientX:0,clientY:0});assert.equal(c.state.displayVolume,5);
  c.displayVolumeMove({pointerId:1,clientX:0,clientY:60});assert.equal(c.state.displayVolume,10);
  c.displayVolumeUp({pointerId:1,currentTarget:target});c.turnDisplayKnob('volume');assert.equal(c.state.displayVolume,10,'the click after a drag is ignored');
  c.displayVolumeKey({key:'ArrowDown',preventDefault(){},stopPropagation(){}});assert.equal(c.state.displayVolume,9);
  c.displayVolumeKey({key:'ArrowRight',preventDefault(){},stopPropagation(){}});assert.equal(c.state.displayVolume,10);
  assert.equal(c._displayPhase,'idle');assert.equal(timers.size,0);
  c.enterDisplay();c.turnDisplayKnob('volume');assert.equal(c.state.displayVolume,10,'dials are locked once entering');
});

test('the entrance mounts a WebGL stage with a dock, keeps the CSS television as fallback and matches the card to the zoom',()=>{
  const {context}=controller(),api=context.PortfolioDisplay,TV=context.PortfolioTV,html=read('src/template.html'),css=read('src/display.css');
  assert.match(html,/<div class="tv-stage" ref="\{\{setDisplayStage\}\}"><\/div>/);
  for(const handler of ['displayPower','displayChannelPrev','displayChannelNext','displayVolLower','displayVolRaise','displayEnter'])assert.ok(html.includes('sc-camel-on-click="{{'+handler+'}}"'),handler);
  assert.ok(css.includes('.tv-power-gate.has-gl .tv-camera{display:none}'));assert.ok(css.includes('.tv-power-gate:not(.tv-phase-idle) .tv-dock{opacity:0;pointer-events:none}'));
  assert.match(css,new RegExp('tv-gate-reveal '+api.revealDuration+'ms'));assert.match(css,new RegExp('transition:transform '+api.zoomDuration+'ms'));
  assert.doesNotMatch(html+css,/tv-tube|tv-power-on/);
  for(const cls of ['vintage-front','vintage-side','vintage-top','vintage-screen','vintage-power','vintage-volume','vintage-channel'])assert.ok(html.includes(cls),cls);
  assert.ok(read('scripts/build.mjs').includes("'tv3d.js','display.js'"));assert.ok(html.indexOf('assets/tv3d.js')<html.indexOf('assets/display.js'));
  const screen={left:400,top:200,width:420,height:300},viewport={left:0,top:0,width:1440,height:900};
  assert.ok(Math.abs(api.pictureScale(screen,viewport)*api.zoomTransform(screen,viewport).scale-1)<1e-9,'the fallback zoom lands on the full-size card');
  assert.equal(TV.create(null),null,'without a document there is no television');
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

function hitboxController(){
  const {c,context}=controller();c.sfx=()=>{};c.persistSoon=()=>{};c.unlock=()=>{};c.moveFx=()=>{};c.calm=()=>false;
  return {c,api:context.PortfolioHitbox,context};
}
test('combos only run when the whole entry is exactly the sequence',()=>{
  const {c}=hitboxController();c.state.hitFighter='ryu';c._wk={};
  for(const k of 'KDRP')c.hitInput(k);
  assert.equal(c.state.hitResult,'','a stray button before the combo cancels it');
  assert.equal(c.renderVals().padSub,'Sequência inválida · SELECT limpa');
  assert.match(c.renderVals().lcdCls,/is-invalid/);
  for(const k of 'DRP')c.hitInput(k);
  assert.equal(c.state.hitResult,'','further input does not recover an invalid entry');
  c.padReset();assert.equal(c.renderVals().hitInvalid,false);
  for(const k of 'DRP')c.hitInput(k);
  assert.equal(c.state.hitResult,'Hadouken');
  assert.equal(c._pad.length,0);
  c.state.hitResult='';for(const k of 'DRDRP')c.hitInput(k);
  assert.equal(c.state.hitResult,'','a combo surrounded by other inputs is not recognised');
});
test('every move is reachable: no sequence is a prefix of another in the same list',()=>{
  const {c,api}=hitboxController();
  for(const [id] of api.fighters){
    c.state.hitFighter=id;const list=c.hitMoves().concat(c.data().secrets);
    for(const a of list)for(const b of list)if(a!==b)assert.ok(!b.seq.startsWith(a.seq),id+': '+a.seq+' blocks '+b.seq);
  }
});
test('roster swaps Peacock for Squigly, Big Band, Annie, Ms. Fortune, Falke and Iroh',()=>{
  const {api}=hitboxController(),ids=api.fighters.map(f=>f[0]);
  assert.ok(!ids.includes('peacock'));assert.ok(!api.moves.some(m=>m.fighter==='peacock'));
  for(const id of ['squigly','bigband','annie','fortune','falke','iroh'])assert.ok(api.moves.filter(m=>m.fighter===id).length>=2,id);
  for(const m of api.moves)assert.ok(api.kinds[m.kind],m.name+' has a dummy reaction');
});
test('the dummy drops in, takes each move and leaves',()=>{
  const {api}=hitboxController(),spec=name=>api.specFor(api.moves.find(m=>m.name===name));
  const hadouken=spec('Hadouken'),h=hadouken.hits[0];
  assert.ok(api.dummyState(hadouken,0).lift>0,'drops in from above');
  assert.equal(api.dummyState(hadouken,h-1).dx,0);
  assert.ok(api.dummyState(hadouken,h+200).dx>4,'the fireball knocks it back');
  const spear=spec('Spear'),pulled=api.dummyState(spear,spear.hits[0]+400);
  assert.equal(Math.round(pulled.dx),-(spear.reach-18),'Get over here pulls the dummy to Scorpion');
  assert.equal(pulled.stars,true);
  const sho=spec('Shoryuken');assert.ok(api.dummyState(sho,sho.hits[0]+320).lift>25,'the uppercut launches it');
  assert.equal(api.dummyState(spec('Ice Ball'),spec('Ice Ball').hits[0]+100).tint,'ice');
  assert.equal(api.dummyState(spec('Daisy Pusher'),spec('Daisy Pusher').hits[0]+600).sink,30,'Daisy Pusher buries it');
  assert.equal(api.dummyState(spec('Redirecionar o relâmpago'),spec('Redirecionar o relâmpago').hits[0]+30).tint.startsWith('shock'),true);
  assert.equal(api.dummyState(hadouken,api.lifetime(hadouken)).alpha,0);
  assert.equal(api.effective(h+20,hadouken.hits),h,'hit-stop holds the impact');
  assert.equal(api.effective(h+200,hadouken.hits),h+155);
});
test('Hikaru strikes from where he stands and the dummy uses the side with room',()=>{
  const {c,api}=hitboxController();c.state={page:'sobre',hitFighter:'ryu'};
  c.worldGeo=()=>({u:3,W:1000,H:700,top:0});
  c._wk={x:200,y:300};c.hitStrike(api.moves.find(m=>m.name==='Hadouken'));
  assert.equal(c._dummy.side,1);assert.equal(c._dummy.x0,200);assert.equal(c._dummy.page,'sobre');
  c._wk={x:950,y:300};c.hitStrike(api.moves.find(m=>m.name==='Hadouken'));
  assert.equal(c._dummy.side,-1,'near the right edge he turns around');
  c._wk={x:300,y:300};c.hitStrike(api.moves.find(m=>m.name==='Spinning Bird Kick'));
  c.worldAnim(c._wk,400,{u:3});assert.ok(c._wk.x>300,'travelling moves carry him to the dummy');
  c.worldAnim(c._wk,1000,{u:3});assert.equal(c._wk.x,300,'and he ends where he started');
  assert.equal(c.worldPose(c._wk).dir!==undefined,true);
});

test('entering the monitor keeps the desktop glued to the glass while the camera pushes in',()=>{
  const {context}=controller(),api=context.PortfolioDesktop;
  const z=api.zoomGeometry({left:103,top:85,width:1234,height:719},{left:0,top:0,width:1440,height:900},{width:384,height:224},{camX:0,camY:0});
  const {camera,shell}=api.zoomFrames(z);
  const parse=t=>t.match(/-?\d[\d.]*(?:e-?\d+)?/g).map(Number);
  assert.equal(camera[0].offset,0);assert.equal(camera.at(-1).offset,1);
  let last=0;
  camera.forEach((frame,i)=>{
    const [tx,ty,sx,sy]=parse(frame.transform),[ux,uy,kx,ky]=parse(shell[i].transform);
    // the glass seen through the camera is exactly where the desktop is drawn
    const gx=tx+sx*(z.shellLeft+z.fromX),gy=ty+sy*(z.shellTop+z.fromY);
    assert.ok(Math.abs(z.shellLeft+ux-gx)<1e-6&&Math.abs(z.shellTop+uy-gy)<1e-6,'frame '+i+' position');
    assert.ok(Math.abs(kx-z.fromSX*sx)<1e-9&&Math.abs(ky-z.fromSY*sy)<1e-9,'frame '+i+' size');
    assert.ok(sx>=last-1e-9,'the camera only moves forward');last=sx;
  });
  const [,,sx0,sy0]=parse(camera[0].transform),[ex,ey,esx,esy]=parse(shell.at(-1).transform);
  assert.equal(sx0,1);assert.equal(sy0,1);
  assert.ok(Math.abs(ex)<1e-6&&Math.abs(ey)<1e-6&&Math.abs(esx-1)<1e-9&&Math.abs(esy-1)<1e-9,'ends as the full desktop');
  const mid=parse(camera[24].transform)[2];
  // perceived zoom (log of the scale) follows the strong ease-in-out: about 60% of the way at half time
  const perceived=Math.log(mid)/Math.log(z.cameraSX);assert.ok(perceived>.55&&perceived<.65,String(perceived));
  const css=read('src/desktop.css');
  assert.doesNotMatch(css,/@keyframes de-camera|@keyframes de-monitor/);
  assert.match(css,/is-calm\.is-zoom \.desktop-shell\{transform:none;animation:de-fade/);
});
test('the pause-menu Movimento setting alone decides the push-in, and it persists',()=>{
  const store={};const storage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}};
  const first=controller({localStorage:storage,matchMedia:()=>({matches:true})}).c;first.state={page:'quarto'};
  assert.equal(first.desktopReduced(),false,'the system preference does not cancel the zoom');
  first.toggleMotion();assert.equal(first.calm(),true);assert.equal(store['okaru-motion'],'reduced');
  const next=controller({localStorage:storage}).c;next.state={page:'quarto'};assert.equal(next.desktopReduced(),true,'restored on the next visit');
  next.toggleMotion();assert.equal(store['okaru-motion'],'full');assert.equal(next.renderVals().motionLabel,'Completo');
  next.wipeProgress?.();assert.equal(next.calm(),false,'a new game keeps the preference');
});
test('reduced motion swaps the push-in for a short fade',()=>{
  for(const [state,system,calm] of [[{},false,false],[{motionReduced:true},false,true],[{},true,false]]){
    const {c}=controller({matchMedia:()=>({matches:system})});c.state={page:'quarto',...state};
    assert.equal(c.renderVals().dePhaseClass.includes('is-calm'),calm);
  }
});

test('audit: translation files never disagree, every module installs and controller games translate',()=>{
  const files=fs.readdirSync(new URL('../src/',import.meta.url)).filter(n=>/^translations(?:-.*)?\.tsv$/.test(n)),seen=new Map(),conflicts=[];
  for(const file of files)for(const line of read('src/'+file).split(/\r?\n/).filter(Boolean)){
    const [pt,en,ja,override='']=line.split('\t'),value=[en,ja,override].join('\t');
    if(seen.has(pt)&&seen.get(pt).value!==value)conflicts.push(pt+' ('+seen.get(pt).file+' / '+file+')');
    seen.set(pt,{value,file});
  }
  assert.deepEqual(conflicts,[]);
  const {c,context}=controller(),I=context.PortfolioI18n;
  assert.ok(context.Portfolio.modules.length>=13);
  for(const name of context.Portfolio.modules)assert.equal(typeof context[name]?.install,'function',name);
  I.set('en');for(const item of c.ctlList())if(!['Hitbox','Game Boy'].includes(item.game))assert.notEqual(I.t(item.game),item.game,item.game);
});

test('the title screen follows the sound preference, plays its theme and mutes with the button or M',()=>{
  const {c,ac,context}=television('running');c.componentDidMount();
  const bus=()=>({gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}},connect(){},disconnect(){}});
  Object.assign(ac,{currentTime:0,createGain:bus});c._mix={};c.tone=()=>{};c.noise=()=>{};
  assert.equal(c._snd,true,'new visitors start with sound');assert.equal(c.state.snd,true);
  c.titleMusicSync();assert.equal(c.titlePlaying(),false,'not behind the opening television');
  c._displayStarting=false;Object.assign(c.state,{page:'boot',bootLog:false,languageOpen:false});
  c.titleMusicSync();assert.equal(c.titlePlaying(),true);assert.equal(c._mTrack.name,'Tela de título');
  c.state.recOpen=true;c.titleMusicSync();assert.equal(c.titlePlaying(),true,'the recruiter glass keeps the theme');
  c.rootKey({key:'m',target:{},preventDefault(){}});assert.equal(c._snd,true,'M belongs to the recruiter view while it is open');
  c.state.recOpen=false;c.rootKey({key:'m',target:{},preventDefault(){}});assert.equal(c._snd,false);assert.equal(c.titlePlaying(),false);assert.equal(c._sndPref,false);
  c.renderVals().toggleSnd();assert.equal(c._snd,true);assert.equal(c.titlePlaying(),true);
  c.state.transitioning=true;c.titleMusicSync();assert.equal(c.titlePlaying(),false,'Novo jogo and the recruiter links leave the title screen');
  assert.equal(c._snd,true,'the pages keep the sound the title screen had');
  const html=read('src/template.html');
  assert.match(html,/<div class="boot-top"><span>Créditos \{\{credits\}\}<\/span><button class="boot-snd" sc-camel-on-click="\{\{toggleSnd\}\}" aria-pressed="\{\{sndPressed\}\}"/);
  const muted=television('running');muted.c._sndPref=false;muted.c.componentDidMount();assert.equal(muted.c._snd,false,'a saved mute is respected');
  const theme=context.PortfolioTitleSound.titleTrack(),notes=theme.ev.flat().filter(e=>!e.drum);
  assert.equal(theme.len,64);assert.ok(notes.length>40);assert.ok(Math.max(...notes.map(n=>n.m))<=79,'nothing above G5');
});

test('the portfolio stays quiet behind the opening TV, never starts audio before a gesture and paces the failure alarm',()=>{
  const {c}=controller(),tones=[];c.tone=(...a)=>tones.push(a);c.noise=()=>{};c._snd=true;c.audio=()=>({});c._mix={};c.state={page:'boot'};
  c._displayStarting=true;c.sfx('hover');assert.equal(tones.length,0);
  c._displayStarting=false;c.sfx('hover');assert.equal(tones.length,1);
  c.state.bootLog=true;tones.length=0;c.sfx('error');c.sfx('error');assert.equal(tones.length,2,'one alarm (two tones) at a time');
  c._bootSfxAt-=1000;c.sfx('error');assert.equal(tones.length,4);
  c.state.bootLog=false;c.sfx('error');c.sfx('error');assert.equal(tones.length,8,'outside the boot log every error sounds');
  let made=0;const gesture={hasBeenActive:false};
  const {c:fresh}=controller({navigator:{language:'en',userActivation:gesture},AudioContext:function(){made++;this.state='running';this.destination={};this.createGain=()=>({gain:{},connect(){}});}});
  assert.equal(fresh.audio(),null);assert.equal(made,0);
  gesture.hasBeenActive=true;assert.ok(fresh.audio());assert.equal(made,1);
});

test('the language screen plays one loop in three styles that its cursor swaps, only before the television',()=>{
  const {context}=controller(),api=context.PortfolioTitleSound,tracks=['pt','en','ja'].map(api.languageTrack);
  for(const tr of tracks){
    assert.equal(tr.len,64);assert.equal(tr.bpm,120);assert.equal(tr.ev.length,64);
    const lead=tr.ev.flat().filter(e=>e.lead).map(e=>e.m);
    assert.ok(lead.length>=20);assert.ok(Math.min(...lead)>=65&&Math.max(...lead)<=79,tr.language+': the lead stays between F4 and G5');
    assert.ok(tr.ev.flat().some(e=>e.drum==='kick'));
  }
  assert.deepEqual(tracks.map(t=>t.language),['pt','en','ja']);
  assert.notEqual(JSON.stringify(tracks[0].ev),JSON.stringify(tracks[2].ev),'each language has its own groove');
  assert.ok(tracks[2].ev.flat().filter(e=>e.lead).every(e=>[0,2,4,7,9].includes(e.m%12)),'the matsuri lead is pentatonic');

  const {c,ac,context:ctx}=television('running');
  const bus=()=>({gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}},connect(){},disconnect(){}});
  Object.assign(ac,{currentTime:0,createGain:bus});c._mix={};c.tone=()=>{};c.noise=()=>{};c.calm=()=>false;
  c.componentDidMount();assert.equal(c.state.languageOpen,true);
  c.languageMusicSync();assert.equal(c.languagePlaying(),true);assert.equal(c._mTrack.language,'en','it starts in the style under the cursor');assert.equal(c.languageMusicState(),'on');
  c._mStep=21;c.languagePoint(0);assert.equal(c.state.langCursor,0);assert.equal(c._mTrack.language,'pt');assert.equal(c._mStep,21,'the groove keeps its place');
  const key=(k,target={})=>c.languageKey({key:k,preventDefault(){},target});
  key('ArrowUp');assert.equal(c.state.langCursor,2,'the cursor wraps');assert.equal(c._mTrack.language,'ja');
  // The big question follows the cursor; the other two stay small, and all three keep one cell so nothing moves.
  let ask=c.renderVals();assert.equal(ask.languageQuestionLang,'ja');assert.equal(ask.languageQuestion.children[0],'どの言語を話しますか？');
  assert.deepEqual(Array.from(ask.languageOtherQuestions,n=>n.children[0]),['Qual idioma você fala?','What language do you speak?']);
  assert.deepEqual(Array.from(ask.languageQuestions,q=>[q.cls,q.hidden]),[['',true],['',true],['is-on',false]]);
  assert.equal(ctx.PortfolioI18n.locale,'en','pointing at a language does not choose it');
  key('ArrowDown');assert.equal(c.state.langCursor,0);
  let r=c.renderVals();assert.equal(r.languageNowLang,'pt-BR');assert.equal(r.languageNow.children[0],'Tocando agora · samba 8-bit');assert.equal(r.languageSndPressed,true);
  assert.equal(r.languageChoices[0].cls,'is-cur');assert.equal(r.languageChoices[0].hello.children[0],'Olá!');
  key('m');assert.equal(c._snd,false);assert.equal(c.languagePlaying(),false);assert.equal(c.languageMusicState(),'off');
  key('M');assert.equal(c._snd,true);assert.equal(c.languagePlaying(),true);
  // The equalizer follows the sixteenth that is sounding.
  const props=[],make=()=>({dataset:{},style:{setProperty:(k,v)=>props.push([k,v])}});
  const bars=Array.from({length:api.vizBars},make),notes=Array.from({length:6},make),cells=Array.from({length:16},make);
  c.renderVals().setLanguageViz({isConnected:true,dataset:{},querySelectorAll:sel=>sel==='.language-bar'?bars:notes});c.renderVals().setLanguageDeck({querySelectorAll:()=>cells});
  ac.currentTime=.3;c.languageVizFrame();
  assert.equal(c._langViz.dataset.live,'1');assert.ok(props.some(([k])=>k==='--lv'));assert.equal(cells.filter(cell=>cell.dataset.on==='1').length,1);
  c.calm=()=>true;c.languageVizFrame();assert.equal(c._langViz.dataset.live,'0','Movimento reduzido keeps it still');
  key('Enter',{closest:()=>null});assert.equal(c.state.languageOpen,false);assert.equal(ctx.PortfolioI18n.locale,'pt');
  c.languageMusicSync();assert.equal(c.languagePlaying(),false,'the television takes over');
  c._displayStarting=false;c.state.languageOpen=true;c.languageMusicSync();assert.equal(c.languagePlaying(),false,'later language changes have no music');
  const html=read('src/template.html');
  for(const ref of ['setLanguageViz','setLanguageDeck','languageSound','languageWake'])assert.ok(html.includes('{{'+ref+'}}'),ref);
  assert.match(html,/<h1 class="language-ask" lang="\{\{languageQuestionLang\}\}"><sc-for list="\{\{languageQuestions\}\}" as="ask"><span class="language-q \{\{ask\.cls\}\}"/);
  assert.ok(read('src/display.css').includes('.language-q{grid-area:1/1;'),'the questions share one cell');
  assert.match(html,/<button class="\{\{language\.cls\}\}" lang="\{\{language\.lang\}\}" sc-camel-on-click="\{\{language\.choose\}\}" sc-camel-on-pointer-enter="\{\{language\.point\}\}" sc-camel-on-focus="\{\{language\.point\}\}">/);
});

test('the touch pad turns the stick into W A S D, A into E and B into back or run, only on touch screens',()=>{
  const {context}=controller(),api=context.PortfolioGamepad,keys=(x,y)=>Array.from(api.stickKeys(x,y)).join('');
  assert.equal(keys(1,0),'d');assert.equal(keys(-1,0),'a');assert.equal(keys(0,1),'s');assert.equal(keys(0,-1),'w');
  assert.equal(keys(.7,.7),'ds');assert.equal(keys(-.7,-.7),'aw');assert.equal(keys(.1,.1),'','a dead zone in the middle');assert.equal(keys(NaN,0),'');
  const desk=controller().c;desk.state={page:'projetos'};assert.equal(desk.renderVals().padOn,false,'no pad without a touch screen');
  const writes=new Map(),{c}=controller({matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}}),localStorage:{getItem:k=>writes.get(k)??null,setItem:(k,v)=>writes.set(k,v)}});
  c.state={page:'projetos'};c.sfx=()=>{};
  // The regular pages start without it (a small button brings it); the bedroom, the game, starts with it.
  let r=c.renderVals();assert.equal(r.padOn,false,'the regular pages start without the pad');assert.equal(r.padMini,true);assert.doesNotMatch(r.rootCls,/ has-pad( |$)/);assert.match(r.rootCls,/has-padmini/,'its button gets a slot in the bottom bar');
  c.padToggle();assert.equal(writes.get(api.storageKey+'-pages'),'on');
  r=c.renderVals();assert.equal(r.padOn,true);assert.match(r.rootCls,/ has-pad( |$)/);assert.equal(r.padBLabel,'correr');
  const log=[];c.rootKey=e=>log.push('+'+e.key);c.rootKeyUp=e=>log.push('-'+e.key);
  c.padStick(1,0);c.padStick(1,.05);c.padStick(0,1);c.padStick(0,0);
  assert.deepEqual(log,['+d','-d','+s','-s'],'only changes are pressed, so a held stick does not repeat');
  log.length=0;c.padADown();c.padADown();c.padAUp();assert.deepEqual(log,['+e','-e']);
  log.length=0;c.padBDown();assert.equal(c._padRun,true);assert.equal(c.worldFloSpeed({}),1.8,'B runs');c.padBUp();assert.equal(c.worldFloSpeed({}),1);assert.deepEqual(log,[]);
  c.state.rmDlg=true;assert.equal(c.renderVals().padBLabel,'fechar');c.padBDown();assert.deepEqual(log,['+Escape'],'B closes a bedroom dialog');c.state.rmDlg=false;
  log.length=0;c.padStick(-1,0);c.state.paused=true;assert.equal(c.renderVals().padOn,false,'a menu takes the pad away');c.componentDidUpdate({},{});assert.deepEqual(log,['+a','-a'],'and releases what was held');
  c.state.paused=false;c.state.page='quarto';assert.equal(c.renderVals().padOn,true,'the bedroom has it too');assert.match(c.renderVals().rmHelp,/Joystick/);
  const room=controller({matchMedia:()=>({matches:true,addEventListener(){}})}).c;room.state={page:'quarto'};assert.equal(room.renderVals().padOn,true,'the bedroom starts with it');
  room.sfx=()=>{};room.padToggle();assert.equal(room.renderVals().padOn,false);room.state.page='inicio';assert.equal(room.renderVals().padMini,true,'each place keeps its own choice');
  c.state.page='boot';assert.equal(c.renderVals().padOn,false);c.state.page='sobre';
  c.padToggle();r=c.renderVals();assert.equal(r.padOn,false);assert.equal(r.padMini,true);assert.equal(writes.get(api.storageKey+'-pages'),'off');
  c.padToggle();assert.equal(c.renderVals().padOn,true);
  const html=read('src/template.html');
  for(const h of ['padStickDown','padStickMove','padStickUp','padADown','padAUp','padBDown','padBUp','padToggle','setPadKnob'])assert.ok(html.includes('{{'+h+'}}'),h);
  assert.match(html,/<button class="tpad-hide"[^>]*><svg class="tpad-x"/,'the close mark is drawn, not a text glyph');
  assert.ok(html.indexOf('assets/gamepad.js')<html.indexOf('assets/enhancements.js'));assert.ok(read('scripts/build.mjs').includes("'gamepad.js'"));
  assert.equal(context.Portfolio.modules.at(-1),'PortfolioGamepad');
  // The pad is its own row of the scene, above the bottom bar, so the page and the dust hint sit above it.
  const css=read('src/enhancements.css');assert.match(css,/\.tpad\{position:relative;[^}]*flex:none;height:var\(--tpad\)/);assert.match(css,/\.tpad-stick,\.tpad-k\{touch-action:none/);
  assert.ok(css.includes('.okr.has-pad .character-care-hint{bottom:calc(66px + var(--tpad))}'));
  assert.doesNotMatch(css,/(^|\})\.pad\{/m,'the Game Boy pad keeps its own .pad class');
  assert.ok(html.indexOf('<div class="tpad"')>html.indexOf('</main>')&&html.indexOf('<div class="tpad"')<html.indexOf('<footer class="ground">'),'between the page and the bottom bar');
  // After a fall, A wipes the dust first and says so.
  c.state.page='inicio';c.characterCareActor=()=>({kind:'world'});c._characterDust=true;let cleaned='';c.characterClean=k=>{cleaned=k;};
  r=c.renderVals();assert.equal(r.padALabel,'limpar');assert.equal(r.padACls,'is-clean');assert.match(r.characterCareText,/Aperte A/);
  log.length=0;c.padADown();assert.equal(cleaned,'wipe');assert.deepEqual(log,[],'no E while wiping');c._characterDust=false;assert.equal(c.renderVals().padALabel,'usar');
  for(const text of ['usar','correr','Esconder o controle de toque','Mostrar o controle de toque','Joystick pra andar · A pra interagir · B pra correr · ou toque']){context.PortfolioI18n.set('en');assert.notEqual(context.PortfolioI18n.t(text),text,text);}
});

test('on phones and tablets the name fits, and the side doors and Hikaru clear the page titles',()=>{
  const css=read('src/styles.css');
  assert.ok(css.includes('.okr{--hf:min(22.4vw,140px)}'));assert.ok(css.includes('.screen{--side:max(16px,calc(var(--hf) * .148 + 3px));padding:26px var(--side) 24px'));
  assert.match(css,/@media \(min-width:600px\) and \(max-width:860px\)\{\s*\.okr\{--hf:min\(21vw,140px\)\}\s*\.screen\{--side:calc\(var\(--hf\) \* \.21 \+ 6px\)\}/);
  // The same sizes the browser computes: the world unit is 2.104% of --hf, shrunk to 76%; doors are 9u wide
  // below 600px and 13u above; the name is about 4.02 times --hf wide.
  // The name itself fills its column (container units), apart from --hf, which only sizes the doors and Hikaru.
  assert.match(css,/@media \(max-width:860px\)\{\s*\.home-l\{container-type:inline-size\}\s*\.name\{font-size:min\(calc\(100cqi \/ 4\.06\),200px\)\}/);
  for(const width of [320,360,390,430,520,599,600,680,690,768,820,860]){
    const tablet=width>=600,hf=Math.min((tablet?.21:.224)*width,140),side=tablet?hf*.21+6:Math.max(16,hf*.148+3),u=hf*.02104*.76,door=(tablet?13:9)*u;
    const column=width-2*side,name=Math.min(column/4.06,200);
    assert.ok(door<=side,width+'px: the door ('+door.toFixed(1)+') stays in the side margin ('+side.toFixed(1)+')');
    assert.ok(name*4.02<=column,width+'px: the name fits its column');
    assert.ok(name>=hf*.98,width+'px: and is at least as big as before ('+name.toFixed(0)+' vs '+hf.toFixed(0)+')');
  }
});

test('the failure buries the log under ten kinds of made-up error pop-ups, and a tap anywhere reboots after it',()=>{
  const {c,context}=controller(),api=context.PortfolioBootFlow,h=context.React.createElement;
  assert.equal(api.popupKinds.length,10);
  assert.equal(api.failurePopups(1,5,h).length,0,'none on the first line');
  const all=api.failurePopups(96,123,h);assert.equal(all.length,api.popupMax,'up to the cap');
  assert.equal(new Set(all.map(p=>p.kind)).size,10,'every kind shows up');
  assert.notEqual(all[0].kind,all[1].kind,'neighbours differ');
  for(const p of all){
    const [,cx,cy]=p.style.match(/--cx:(-?[\d.]+)%;--cy:(-?[\d.]+)%/).map(Number);
    assert.ok(cx>0&&cx<100&&cy>0&&cy<100,'centred inside the screen: '+p.style);
    assert.equal(Math.min(3,Math.floor(cx/25))+4*Math.min(3,Math.floor(cy/25)),p.cell,'inside its own cell');
    assert.equal(p.cls,'be-'+p.kind);
    // every pop-up says it is a simulation, and nothing names a real brand, site or phone number
    const text=JSON.stringify(p.body);assert.match(text,/simulação/);
    assert.doesNotMatch(text,/McAfee|Norton|Microsoft|Apple|Windows|\.com\b|\+1-8/);
  }
  // The whole screen fills up, the middle most: every cell of the 4×4 grid gets pop-ups, the four middle ones twice as many.
  for(const seed of [1,123,4567]){
    const per=new Map();for(const p of api.failurePopups(96,seed,h))per.set(p.cell,(per.get(p.cell)||0)+1);
    assert.equal(per.size,16,'every part of the screen');
    const middle=[5,6,9,10].reduce((s,c)=>s+per.get(c),0)/4,edge=[0,3,12,15].reduce((s,c)=>s+per.get(c),0)/4;assert.ok(middle>edge,'the middle fills up most');
  }
  assert.deepEqual(api.failurePopups(40,123,h).map(p=>p.style),all.slice(0,20).map(p=>p.style),'a pile grows, it never reshuffles');
  assert.notDeepEqual(api.failurePopups(96,124,h).map(p=>p.style),all.map(p=>p.style),'each boot piles them differently');
  const classic=api.failurePopups(96,123,h).find(p=>p.kind==='classic');assert.equal(classic.body.length,5,'the old error leaves a trail');
  // Recovery: Enter, a click or a tap anywhere on the console reboots; the button keeps its own click.
  c.data().bootLog=api.failureLines();c.state={page:'boot',bootLog:true,bootFault:true,bootN:96,bootRecovery:true};c._languageReady=true;
  let rebooted=0;c.bootRecover=()=>rebooted++;
  const r=c.renderVals();assert.match(r.bootRecoverText,/clique na tela/);
  r.bootTap({target:{closest:()=>({})}});assert.equal(rebooted,0,'the reboot button handles itself');
  r.bootTap({target:{closest:()=>null}});assert.equal(rebooted,1);
  c.padTouch=()=>true;assert.equal(c.renderVals().bootRecoverText,'Toque na tela para reiniciar');
  c.state.bootRecovery=false;c.renderVals().bootTap({target:{closest:()=>null}});assert.equal(rebooted,1,'nothing to reboot while the log runs');
  const html=read('src/template.html');
  assert.match(html,/<div class="blog \{\{bootLogCls\}\}" aria-label="Iniciando o sistema" sc-camel-on-click="\{\{bootTap\}\}">/);
  assert.match(html,/<div class="boot-errors" aria-hidden="true"><sc-for list="\{\{bootFailures\}\}" as="bf"><div class="boot-error \{\{bf.cls\}\}" style="\{\{bf.style\}\}">\{\{bf.body\}\}<\/div>/);
  const css=read('src/enhancements.css');for(const kind of api.popupKinds)assert.ok(css.includes('.be-'+kind+'{'),kind+' has its own look');
  for(const text of ['simulação','AVISO: SEU SISTEMA PODE TER ENCONTRADO VÍRUS','Um BUG selvagem apareceu!','Número de mentira. Não ligue.','Toque na tela para reiniciar','Pressione Enter ou clique na tela para reiniciar'])for(const lang of ['en','ja']){context.PortfolioI18n.set(lang);assert.notEqual(context.PortfolioI18n.t(text),text,lang+': '+text);}
  context.PortfolioI18n.set('pt');
});

test('on narrow screens the section buttons fold into the logo, which opens and closes them',()=>{
  const {c,context}=controller();c.sfx=()=>{};let went=[];c.navGo=to=>went.push(to);
  // Wide: the logo goes home and the sections stay in the bar.
  c.state={page:'projetos',hudNarrow:false};let r=c.renderVals();
  assert.equal(r.brandAria,'okaru: ir pro Início');assert.equal(r.brandExpanded,undefined);assert.equal(r.brandCls,'');
  r.brandHome();assert.deepEqual(went,['inicio']);went=[];
  // Narrow: the logo holds them and shows where you are.
  c.state={page:'projetos',hudNarrow:true};r=c.renderVals();
  assert.equal(r.brandExpanded,'false');assert.equal(r.brandControls,'hud-nav');assert.equal(r.brandCls,'is-menu');assert.equal(r.navCur,'Projetos');
  r.brandHome();assert.deepEqual(went,[],'it no longer goes home');assert.equal(c.navMenuOpen(),true);
  r=c.renderVals();assert.equal(r.brandExpanded,'true');assert.equal(r.navCls,'is-open');assert.equal(r.brandCls,'is-menu is-open');assert.equal(r.brandAria,'Seções: fechar o menu');
  assert.deepEqual([...r.nav].map(n=>n.style),['--i:0','--i:1','--i:2','--i:3'],'they come out one after another');
  // Picking a section folds them back as he heads for it; so does Esc, before the pause menu.
  r.nav[3].go();assert.deepEqual(went,['contato']);assert.equal(c.navMenuOpen(),false);
  c.renderVals().brandHome();let prevented=false;c.rootKey({key:'Escape',preventDefault:()=>{prevented=true;}});
  assert.equal(c.navMenuOpen(),false);assert.equal(prevented,true);assert.notEqual(c.state.paused,true);
  // The menu belongs to the page it was opened on, and the bedroom keeps its own logo.
  c.renderVals().brandHome();c.state.page='sobre';assert.equal(c.navMenuOpen(),false);
  c.state={page:'quarto',hudNarrow:true};r=c.renderVals();assert.equal(r.brandCls,'');assert.equal(r.brandExpanded,undefined);
  for(const text of ['Seções: abrir o menu','Seções: fechar o menu'])for(const lang of ['en','ja']){context.PortfolioI18n.set(lang);assert.notEqual(context.PortfolioI18n.t(text),text,lang+': '+text);}
  context.PortfolioI18n.set('pt');
  const html=read('src/template.html'),css=read('src/enhancements.css');
  assert.match(html,/<button class="brand \{\{brandCls\}\}" sc-camel-on-click="\{\{brandHome\}\}" aria-label="\{\{brandAria\}\}" title="\{\{brandTitle\}\}" aria-expanded="\{\{brandExpanded\}\}" aria-controls="\{\{brandControls\}\}">/);
  assert.match(html,/<nav class="nav \{\{navCls\}\}" id="hud-nav" aria-label="Seções">/);
  assert.match(css,/@media\(max-width:860px\)\{[^]*\.hud>\.nav:not\(\.nav-game\)\{position:absolute;[^}]*transform-origin:20px -38px;transform:scale\(\.1\);opacity:0;visibility:hidden/,'closed, it is folded into the chip');
});
