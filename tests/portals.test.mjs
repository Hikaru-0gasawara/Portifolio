import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
function fixture(page='projetos',scrollTop=0){
  const timers=new Map();let timerId=0;
  const context={window:{},console,Date,Math:Object.create(Math),setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;},clearTimeout:id=>timers.delete(id),document:{}};
  context.window=context;
  context.DCLogic=class{constructor(){this.state={page};this.props={};}setState(s){Object.assign(this.state,s);}};
  vm.createContext(context);
  vm.runInContext(read('src/room-props.js'),context);
  vm.runInContext(read('src/scene.js'),context);
  vm.runInContext(read('src/app.js')+';PortfolioRoom.install(Component);PortfolioScene.install(Component);window.Controller=Component;',context);
  const c=new context.Controller(),rect={left:710,top:190-scrollTop,right:772,bottom:242-scrollTop,width:62,height:52};
  const classes=new Set(['portal-anchor']);
  const el={getBoundingClientRect:()=>rect,classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},click:()=>page==='inicio'?c.usePortal('home-contact'):c.teleportHome(),getAttribute:()=>null};
  const hatchClasses=new Set(['portal-anchor','portal-hatch']);
  const hatch={getBoundingClientRect:()=>({left:350,top:160-scrollTop,right:394,bottom:188-scrollTop,width:44,height:28}),classList:{contains:k=>hatchClasses.has(k),add:k=>hatchClasses.add(k),remove:k=>hatchClasses.delete(k)},click:()=>c.usePortal('home-room'),getAttribute:()=>null};
  const home={getBoundingClientRect:()=>({left:80,top:220,right:240,bottom:280,width:160,height:60})};
  const sc={scrollTop,clientWidth:1100,clientHeight:680,scrollHeight:1300,contains:n=>[el,hatch].includes(n),getBoundingClientRect:()=>({left:10,top:90}),querySelector:q=>q==='[data-portal-id="home-room"]'?hatch:q.startsWith('[data-portal-id=')||q==='.portal-anchor'?el:q.startsWith('[data-portal-to=')?home:null,querySelectorAll:()=>page==='inicio'?[el,hatch]:[el]};
  const geo={sc,u:1,W:1100,H:680,CH:1300,top:scrollTop,dy:100};
  c.worldGeo=()=>geo;c.screenEl=()=>sc;c._wk={page,x:50,y:80,hidden:false,anim:null,walk:0};
  c.sfx=()=>{};c.unlock=()=>{};c.persistSoon=()=>{};c.worldFloSpeed=()=>1;c.worldCurve=()=>{};c.worldRoute=()=>[];
  const finishNavigation=()=>{for(const [key,timer]of [...timers])if([680,1420].includes(timer.delay)){timers.delete(key);timer.fn();}};
  return {c,geo,el,hatch,rect,sc,context,finishNavigation};
}

test('portals are real buttons in heading grid, inside the left content column',()=>{
  const html=read('src/template.html'),css=read('src/enhancements.css');
  assert.equal((html.match(/class="page-heading"/g)||[]).length,2);
  assert.equal((html.match(/class="portal-anchor(?: portal-phone| portal-front| portal-phone portal-secret| portal-hatch)?"/g)||[]).length,5);
  for(const [cls,kind] of [['proj-l',''],['ab-s',' portal-front']]){
    const slice=html.slice(html.indexOf('<div class="'+cls+'">'));
    assert.match(slice,new RegExp('^[\\s\\S]*?<div class="page-heading">\\s*<h1[^]*?<button class="portal-anchor'+kind+'"[^]*?</button>\\s*</div>'));
  }
  const portalRule=css.match(/\.portal-anchor\{([^}]+)\}/)[1];
  assert.match(portalRule,/position:relative/);assert.doesNotMatch(portalRule,/position:absolute/);
  assert.match(css,/\.page-heading\{[^}]*grid-template-columns:minmax\(0,1fr\) 62px/);
});

test('Japanese project, profile and contact headings have bounded size and no line breaks',()=>{
  const css=read('src/enhancements.css');
  assert.match(css,/html\[lang=ja\] \.page-heading>\.h1\{font-size:clamp\(24px,min\(3\.2vw,8cqi\),52px\)/);
  assert.match(css,/html\[lang=ja\] \.cont\{font-size:clamp\(32px,min\(4\.2vw,13cqi\),72px\)/);
  assert.match(css,/:is\([^}]*\.cont \.ln-in[^}]*\)\{white-space:nowrap;word-break:keep-all/);
  // Six full-width Japanese glyphs fit even the narrowest supported heading column.
  for(const width of [288,343,360,430,600,1000]){
    const mobile=width<=343,size=mobile?Math.min(42,Math.max(24,width*.08)):Math.min(52,Math.max(24,width*.08));
    assert.ok(size*6<=width-(mobile?66:78),`six glyphs fit a ${width}px column`);
  }
});

test('teleport spawns on the current portal after scrolling and returns inside the home button',()=>{
  for(const page of ['projetos','sobre','contato'])for(const top of [0,120,500]){
    const {c,geo}=fixture(page,top),spot=c.teleportSpot(geo);
    assert.equal(spot.x,731);assert.equal(spot.y,144);
    c._wk.x=spot.x;c._wk.y=spot.y;assert.ok(c.portalHit(geo,c._wk));
  }
  const {c,geo}=fixture('inicio');c._teleportReturnFrom='projetos';
  assert.deepEqual({...c.teleportSpot(geo)},{x:150,y:182});
});

test('portal click walks to the visible stone before activating the return',()=>{
  const {c,geo,el}=fixture();let reached=0;
  c.unlock=id=>{if(id==='portal-return')reached++;};
  c.teleportHome();
  assert.equal(c._wPoke.q[0].el,el);assert.equal(c._wk.anim,null);assert.equal(reached,0);
  for(let frame=0;frame<1200&&!c._wk.anim;frame++)c.worldPokeStep(c._wk,16,geo);
  assert.equal(c._wk.anim?.kind,'teleport-out');assert.equal(c._wk.anim.to,'inicio');
  assert.ok(c.portalHit(geo,c._wk));assert.equal(reached,1);
});

test('E activates the pedestal by its geometry with no dependency on DOM hit testing',()=>{
  for(const page of ['projetos','sobre','contato']){
    const {c,geo}=fixture(page,120);Object.assign(c._wk,c.teleportSpot(geo));
    assert.equal(c._wk.anim,null);assert.equal(c._wHit,undefined);
    let prevented=false;
    assert.equal(c.worldKey({key:'e',preventDefault(){prevented=true;}}),true);
    assert.equal(prevented,true);assert.equal(c._wk.anim?.kind,'teleport-out');
  }
});

test('standing on a portal alone does not activate it and pause keeps E inactive',()=>{
  const {c,geo}=fixture();Object.assign(c._wk,c.teleportSpot(geo));
  assert.ok(c.portalHit(geo,c._wk));assert.equal(c._wk.anim,null);
  c.state.paused=true;
  assert.equal(c.worldKey({key:'e',preventDefault(){}}),false);assert.equal(c._wk.anim,null);
});

test('contact keeps its footer below the social links and pairs its portal with GitHub',()=>{
  const html=read('src/template.html').split('<div class="ct-acts rise"')[1],css=read('src/enhancements.css');
  assert.ok(html.indexOf('ct-social')<html.indexOf('ct-foot'));
  assert.ok(html.indexOf('data-portal-id="contact-home"')<html.indexOf('ct-foot'));
  assert.match(html,/<div class="ct-github">\s*<a class="lnk"[^]*?GitHub[^]*?<\/a>\s*<button[^]*?data-portal-id="contact-home"[^]*?<\/button>\s*<\/div>/);
  assert.match(css,/\.ct-acts>\.ct-foot\{margin-top:0/);
  assert.match(css,/\.ct-github\{display:flex;align-items:center;gap:12px/);
  assert.match(css,/\.ct-github>\.portal-secret\{flex:none;align-self:center;[^}]*margin:0/);
});

test('home contact pedestal follows the about action; full-width hatch preserves its height and furigana',()=>{
  const html=read('src/template.html'),css=read('src/enhancements.css');
  assert.match(html,/<div class="home-r">\s*<div class="sel rise"/);
  assert.match(html,/<div class="ctas home-actions rise"[^]*?data-portal-to="projetos"[^]*?data-portal-to="sobre"[^]*?<\/button>\s*<button class="portal-anchor portal-phone" data-portal-id="home-contact"/);
  assert.doesNotMatch(html,/home-portal-row/);assert.equal((html.match(/data-portal-id="home-contact"/g)||[]).length,1);
  assert.match(html,/<span class="kanji-w">\s*<button[^]*?data-portal-id="home-room"[^]*?<\/button>\s*<button class="kanji-b[^]*?\{\{readName\}\}/);
  assert.match(css,/\.home-actions\{align-items:center;flex-wrap:nowrap/);
  assert.match(css,/\.kanji-w>\.portal-hatch\{position:absolute;bottom:100%;left:0;width:100%;height:28px/);
  assert.match(css,/\.hatch-slot\{[^}]*width:100%;height:7px/);
  assert.match(css,/@media\(max-width:860px\)\{[^]*?\.name-row \.kanji-w\{display:block/);
});

test('E distinguishes both home portals and does not reuse the first portal for the hatch',()=>{
  for(const id of ['home-contact','home-room']){
    const {c,geo,el,hatch}=fixture('inicio'),target=id==='home-room'?hatch:el;
    c._teleportArrival=id;Object.assign(c._wk,c.teleportSpot(geo));c._teleportArrival=null;
    assert.equal(c.portalHit(geo,c._wk),target);
    assert.equal(c.worldKey({key:'e',preventDefault(){}}),true);
    assert.equal(c._wk.anim?.to,id==='home-room'?'quarto':'contato');
    assert.equal(c._teleportArrival,id==='home-room'?'room-home':'contact-home');
    assert.equal(hatch.classList.contains('is-open'),id==='home-room');
  }
});

test('contact return lands on its home pedestal beside the about action, not inside either button',()=>{
  const {c,geo,el,finishNavigation}=fixture('contato');Object.assign(c._wk,c.teleportSpot(geo));
  c.teleportHome();assert.equal(c._teleportArrival,'home-contact');
  c.worldAnim(c._wk,760,geo);finishNavigation();assert.equal(c.curPage(),'inicio');
  const wk=c.worldSpawn('inicio',geo);assert.equal(wk.x,731);assert.equal(wk.y,144);
  assert.equal(wk.anim?.hatch,el);assert.equal(wk.anim?.kind,'teleport-in');assert.equal(c._teleportArrival,null);
});

test('hidden bedroom portal is reachable; walking onto it alone does not teleport',()=>{
  const {c}=fixture('quarto'),o=c.roomPortal(),rm=c.rmInit();
  assert.deepEqual(Array.from(o.t),[23,10,1,1]);assert.equal(c.rmFree(23,10),true);assert.ok(c.rmPath(11,12,[[23,10]]));
  Object.assign(rm,{x:23,y:10,from:[23,10],to:[23,10]});c.rmStepOn(rm);assert.equal(rm.portalTravel,undefined);
  c.rmKey({key:'e',preventDefault(){}});assert.equal(rm.portalTravel?.kind,'out');assert.equal(c._teleportArrival,'home-room');
  const t=rm.portalTravel.t;c.rmUpdate(rm,500,true);assert.equal(rm.portalTravel.t,t);
});

test('click walks to the hidden portal, spins, and bypasses the bedroom door',()=>{
  const {c,geo,hatch,finishNavigation}=fixture('quarto'),o=c.roomPortal(),rm=c.rmInit();
  c.rmExit=()=>{throw new Error('Teleport must not walk through the door');};
  c.rmGoTo(23,10,c.data().room.indexOf(o));assert.ok(rm.path.length);assert.equal(rm.portalTravel,undefined);
  for(let i=0;i<200&&!rm.portalTravel;i++)c.rmUpdate(rm,160,false);
  assert.equal(rm.x,23);assert.equal(rm.y,10);assert.equal(rm.portalTravel?.kind,'out');
  c.rmUpdate(rm,760,false);assert.equal(rm.portalTravel.kind,'wait');finishNavigation();
  assert.equal(c.curPage(),'inicio');const wk=c.worldSpawn('inicio',geo);
  assert.equal(wk.x,362);assert.equal(wk.y,90);assert.equal(hatch.classList.contains('is-open'),true);
  c.worldAnim(wk,760,geo);assert.equal(hatch.classList.contains('is-open'),false);
});

test('home hatch returns to the room portal; ordinary doors still enter through the door',()=>{
  const {c,geo,finishNavigation}=fixture('inicio');c._teleportArrival='home-room';Object.assign(c._wk,c.teleportSpot(geo));c._teleportArrival=null;
  c.usePortal('home-room');c.worldAnim(c._wk,760,geo);finishNavigation();
  assert.equal(c.curPage(),'quarto');const rm=c.rmInit();assert.equal(rm.x,23);assert.equal(rm.y,10);assert.equal(rm.enter,false);assert.equal(rm.portalTravel?.kind,'in');
  c.rmUpdate(rm,760,false);assert.equal(rm.portalTravel,null);
  c.rmWalkIn();assert.equal(rm.enter,true);assert.equal(rm.x,11);assert.equal(rm.y,15);
});

test('reduced motion and missing walking sprite preserve portal destinations',()=>{
  const {c,geo,finishNavigation}=fixture('inicio');c.state.motionReduced=true;c._wk=null;c._rmIntroShown=true;
  c.usePortal('home-room');finishNavigation();assert.equal(c.curPage(),'quarto');assert.equal(c._rm.x,23);assert.equal(c._rm.portalTravel,null);
  c.roomPortalStart();finishNavigation();assert.equal(c.curPage(),'inicio');
  const wk=c.worldSpawn('inicio',geo);assert.equal(wk.x,362);assert.equal(wk.anim,null);assert.equal(wk.hidden,false);
});

test('first room tutorial waits for arrival from the hatch or door and runs only once',()=>{
  for(const entry of ['door','hatch'])for(const reduced of [false,true]){
    const {c}=fixture('quarto');c.state.motionReduced=reduced;
    const spoken=[];c.say=text=>spoken.push(text);
    if(entry==='hatch'){c._teleportDestination='quarto';c._teleportArrival='room-home';}
    c.rmWalkIn();const rm=c.rmInit();
    if(entry==='hatch'&&!reduced){c.rmUpdate(rm,759,false);assert.equal(spoken.length,0);c.rmUpdate(rm,1,false);}
    else for(let i=0;i<30&&!c.state.rmIntro;i++)c.rmUpdate(rm,200,false);
    assert.equal(spoken.length,1,`${entry}, reduced ${reduced}`);assert.equal(c.state.rmIntro,true);assert.equal(c.state.rmStep,0);
    c.state.rmIntro=false;c.state.rmDlg=false;c.rmWalkIn();
    for(let i=0;i<30;i++)c.rmUpdate(rm,200,false);
    assert.equal(spoken.length,1);assert.equal(c.state.rmIntro,false);
  }
});

test('portal odds rise with page distance, the bedroom included, and leave doors as the majority',()=>{
  const {context}=fixture(),chance=context.PortfolioScene.portalChance,pages=['quarto','inicio','projetos','sobre','contato'];
  assert.deepEqual([...context.PortfolioScene.pageOrder],pages);
  for(const from of pages)for(const to of pages){
    const distance=Math.abs(pages.indexOf(from)-pages.indexOf(to));
    assert.equal(chance(from,to),[0,.1,.125,1/6,.25][distance]);
    let portal=0;for(let i=0;i<6000;i++)if(i/6000<chance(from,to))portal++;
    assert.equal(portal,[0,600,750,1000,1500][distance]);assert.ok(portal<3000);
  }
  assert.equal(chance('inicio','lab'),0);assert.equal(chance('lab','quarto'),0);
});

test('automatic portal trips take the passage that joins the two pages and keep every requested destination',()=>{
  const pages=['inicio','projetos','sobre','contato'];
  for(const from of pages)for(const to of pages.filter(p=>p!==from)){
    const {c,geo,el,context,finishNavigation}=fixture(from),api=context.PortfolioScene,link=api.portals[api.directPortal(from,to)];
    // From Início the passages to Projetos and Sobre are the home buttons' trapdoor and staircase.
    const source=link.selector.startsWith('[data-portal-to=')?geo.sc.querySelector(link.selector):el;context.Math.random=()=>0;
    let callbacks=0;c.navGo(to,()=>callbacks++);
    assert.equal(c._wTrip?.portal?.from,from);assert.equal(c._wTrip.portal.id,api.directPortal(from,to));assert.equal(c._wk.anim,null);
    const startX=c._wk.x;c.worldAutoMove(c._wk,16,geo);assert.ok(c._wk.x>startX);assert.equal(c.state.transitioning,undefined);
    for(let i=0;i<1000&&!c._wk.anim;i++)c.worldAutoMove(c._wk,16,geo);
    assert.equal(c._wk.anim?.to,to);assert.equal(c._wk.anim?.hatch,source);assert.ok(c.portalHit(geo,c._wk,source));
    assert.equal(c._wk.anim.style,link.style||'spin');assert.equal(c._teleportArrival,link.arrival);
    assert.equal(c._wTrip,null);assert.equal(callbacks,0);
    c.worldAnim(c._wk,api.passages[link.style]?.out||760,geo);finishNavigation();assert.equal(c.curPage(),to);assert.equal(callbacks,1);
    const wk=c.worldSpawn(to,geo);assert.equal(wk.anim?.kind,'teleport-in');assert.equal(wk.hidden,false);
    if(to==='inicio'&&from==='contato')assert.equal(wk.x,731);
    else if(to==='inicio')assert.equal(wk.x,150);
    else assert.equal(wk.x,731);
  }
});

test('repeated navigation accelerates then skips a portal trip without rerolling',()=>{
  const {c,context,finishNavigation}=fixture('inicio');let rolls=0,callbacks=0;context.Math.random=()=>{rolls++;return 0;};
  c.navGo('contato',()=>callbacks++);assert.equal(rolls,1);assert.equal(c.state.trip,1);
  c.navGo('contato');assert.equal(rolls,1);assert.equal(c.state.trip,2);assert.ok(c._wTrip.portal);
  c.navGo('contato');assert.equal(rolls,1);finishNavigation();assert.equal(c.curPage(),'contato');assert.equal(callbacks,1);assert.equal(c._wTrip,null);
});

test('doors remain explicit and missing portals fall back to the ordinary door trip',()=>{
  const {c,geo,sc,context}=fixture('sobre');context.Math.random=()=>0;
  c.worldUseDoor('L');assert.equal(c._wTrip.to,'projetos');assert.equal(c._wTrip.portal,undefined);
  c.navGo('inicio');assert.ok(c._wTrip.portal);
  sc.querySelector=()=>null;c.worldAutoMove(c._wk,16,geo);assert.equal(c._wTrip.to,'inicio');assert.equal(c._wTrip.portal,undefined);assert.equal(c._wk.auto.side,'L');
  c.navGo('contato');assert.equal(c._wTrip.portal,undefined);
  const changed=fixture('sobre');changed.context.Math.random=()=>0;changed.c.navGo('inicio');
  changed.c.state.page='projetos';changed.c._wk.page='projetos';
  changed.c.worldAutoMove(changed.c._wk,16,changed.geo);assert.equal(changed.c._wTrip.portal,undefined);
});

test('a new destination cancels the previous portal route and its callback',()=>{
  const {c,geo,context,finishNavigation}=fixture('sobre');context.Math.random=()=>0;
  let old=0,newCall=0;c.navGo('inicio',()=>old++);assert.ok(c._wTrip.portal);
  context.Math.random=()=>.9;c.navGo('contato',()=>newCall++);assert.equal(c._wTrip.portal,undefined);
  assert.equal(c._wk.auto.side,'R');c.worldTripSkip();finishNavigation();assert.equal(old,0);assert.equal(newCall,1);
  // Changing the destination during the spin must not execute the old callback either.
  c.state.page='sobre';c._wk={page:'sobre',x:731,y:144,walk:0};context.Math.random=()=>0;
  c.navGo('inicio',()=>old++);c.worldAutoMove(c._wk,16,geo);assert.equal(c._wk.anim.kind,'teleport-out');
  c.navGo('projetos',()=>newCall++);c.worldAnim(c._wk,760,geo);finishNavigation();
  assert.equal(c.curPage(),'projetos');assert.equal(old,0);assert.equal(newCall,2);
});

test('reduced motion completes an automatic portal trip without leaving an active journey',()=>{
  const {c,geo,context,finishNavigation}=fixture('inicio');context.Math.random=()=>0;c.state.motionReduced=true;
  let calls=0;c.navGo('contato',()=>calls++);Object.assign(c._wk,{x:731,y:144});
  c.worldAutoMove(c._wk,16,geo);assert.equal(c._wTrip,null);assert.equal(c._wk.auto,null);finishNavigation();
  assert.equal(c.curPage(),'contato');assert.equal(calls,1);assert.equal(c.worldSpawn('contato',geo).anim,null);
});

test('Ver projetos splits open as a trapdoor and drops Hikaru spinning onto the Projetos pedestal',()=>{
  const {c,geo,finishNavigation,context}=fixture('inicio');const sounds=[];c.sfx=name=>sounds.push(name);
  c.teleport('projetos',null,null,undefined,'fall');const out=c._wk.anim;
  assert.ok(read('src/scene.js').includes("r.goProjetos=()=>this.homePassage('projects-button');r.goSobre=()=>this.homePassage('about-button')"));
  assert.equal(out.kind,'teleport-out');assert.equal(out.style,'fall');assert.equal(out.to,'projetos');
  const api=context.PortfolioScene,{out:leave,in:land}=api.passages.fall;
  c.worldAnim(c._wk,400,geo);assert.equal(api.passageOpen('fall',true,400),1,'the floor has split open');
  assert.equal(api.passagePose('fall',true,400).mark,true,'a beat in the air before the drop');
  assert.ok(api.passagePose('fall',true,700).clip,'he is clipped into the hole');
  // The button is the pit: he is clipped by its edges and shrinks, darkening, towards its depth.
  const hole=[-50,-24,100,29],deep=api.passagePose('fall',true,700,60,hole);
  assert.deepEqual(deep.clip,hole);assert.ok(deep.dark>0&&deep.sx<.6);assert.ok(deep.dy<0,'towards the middle of the pit, not onto its rim');
  assert.equal(c.curPage(),'inicio');c.worldAnim(c._wk,leave-400,geo);finishNavigation();assert.equal(c.curPage(),'projetos');
  assert.deepEqual(sounds.slice(0,4),['crack','door','whoosh','doorShut']);
  const wk=c.worldSpawn('projetos',geo),spot=c.teleportSpot(geo);
  assert.equal(wk.anim.kind,'teleport-in');assert.equal(wk.anim.style,'fall');assert.equal(wk.x,spot.x);assert.equal(wk.y,spot.y);
  assert.ok(api.passagePose('fall',false,0,wk.anim.drop).lift>=(wk.y-geo.top)/geo.u,'he starts above the screen');
  assert.ok(api.passagePose('fall',false,360,wk.anim.drop).rot>0,'and spins while falling');
  assert.equal(api.passagePose('fall',false,719.9,wk.anim.drop).lift<1,true,'he reaches the pedestal');
  sounds.length=0;assert.equal(c.worldAnim(wk,land,geo),false);assert.deepEqual(sounds,['whoosh','stomp']);
  assert.equal(wk.x,spot.x);assert.equal(c._teleportStyle,null);
});

test('Ver sobre slides aside off a secret staircase, Hikaru walks down it and comes out of the door on Sobre',()=>{
  const {c,geo,el,finishNavigation,context}=fixture('inicio');const sounds=[];c.sfx=name=>sounds.push(name);
  const api=context.PortfolioScene,{out:leave,in:arrive}=api.passages.stairs;
  c.teleport('sobre',null,null,undefined,'stairs');assert.equal(c._wk.anim.style,'stairs');
  assert.equal(api.passageOpen('stairs',true,0),0);assert.equal(api.passageOpen('stairs',true,600),1,'the slab has slid aside');
  assert.equal(api.passagePose('stairs',true,600).dir,'u','he turns to the stairs');
  const down=api.passagePose('stairs',true,900,60,[-40,-24,80,29]);
  assert.ok(down.dy<0&&down.walk,'and walks down the steps');assert.ok(down.dark>0&&down.sx<1,'into the dark');assert.deepEqual(down.clip,[-40,-24,80,29],'whose far end takes him');
  assert.equal(api.passagePose('stairs',true,1200).alpha,0,'until he is gone');
  assert.equal(api.passageOpen('stairs',true,leave),0,'the floor closes again');
  c.worldAnim(c._wk,leave,geo);finishNavigation();assert.equal(c.curPage(),'sobre');
  assert.equal(sounds[0],'creak');assert.ok(sounds.indexOf('doorShut')>sounds.lastIndexOf('land'),'the slabs shut after the last step');assert.ok(sounds.filter(s=>s==='land').length>=5,'footsteps');
  // Sobre's end is a door seen from the front: it opens, he walks out of the dark towards us and it shuts.
  el.classList.add('portal-front');
  const wk=c.worldSpawn('sobre',geo),door=api.passages.door.in;assert.equal(wk.anim.style,'door');assert.equal(el.classList.contains('is-open'),true);
  assert.equal(api.passagePose('door',false,0).alpha,0,'he starts inside the doorway');
  assert.ok(api.passagePose('door',false,400).alpha>0);assert.equal(api.passagePose('door',false,door-1).dir,'d','and comes out facing us');
  assert.equal(c.worldAnim(wk,door,geo),false);assert.equal(wk.dir,'d');assert.equal(el.classList.contains('is-open'),false,'the door shuts behind him');
  // The stairs still belong to "Ver sobre": coming back, he climbs out of them at the button.
  assert.equal(c.endStyle({classList:{contains:()=>false},getAttribute:k=>k==='data-portal-to'?'sobre':null}),'stairs');
  assert.equal(api.passagePose('stairs',false,0).alpha,0,'he starts inside the stairs');
  assert.ok(api.passagePose('stairs',false,900).alpha>0);assert.equal(api.passagePose('stairs',false,arrive-1).dy,0,'and ends on the floor');
});

test('the home buttons are the passages: he walks onto one, copies of it open away and the button is the hole',()=>{
  // Clicking (or pressing Enter on) a button walks him onto it first; a tap, with him hidden, puts him there.
  const {c,geo,context}=fixture('inicio'),api=context.PortfolioScene,button=geo.sc.querySelector('[data-portal-to="projetos"]');
  button.matches=q=>q==='.btn[data-portal-to]';
  let poked=null;c.worldPoke=(el,fire,pt,style)=>{poked={el,fire,style};};
  c.homePassage('projects-button');assert.equal(poked.el,button);assert.equal(poked.fire,true);assert.equal(c._wk.anim,null);
  const [x,y]=c.portalPoint(button,geo);Object.assign(c._wk,{x,y:y+3*geo.u});
  c.homePassage('projects-button');assert.equal(c._wk.anim.hatch,button);assert.equal(c._wk.anim.style,'fall');assert.equal(c._teleportArrival,'projetos');
  const tap=fixture('inicio'),stairs=tap.geo.sc.querySelector('[data-portal-to="sobre"]');stairs.matches=button.matches;tap.c._wk.hidden=true;
  tap.c.homePassage('about-button');const spot=tap.c.portalPoint(stairs,tap.geo);
  assert.equal(tap.c._wk.anim.style,'stairs');assert.equal(tap.c._wk.x,spot[0]);assert.equal(tap.c._wk.y,spot[1]+3*tap.geo.u);
  // Coming back from the Projetos pedestal he pops out of the trapdoor, which is shut again before he lands.
  assert.equal(c.endStyle({getAttribute:k=>k==='data-portal-to'?'projetos':null}),'hatch');
  assert.equal(api.passageOpen('hatch',false,150),1);assert.equal(api.passageOpen('hatch',false,560),0);assert.equal(api.passagePose('hatch',false,560).lift,0);
  // The copies: the trapdoor's two halves, or the slab, laid exactly over the button with the look it has now.
  context.getComputedStyle=()=>({color:'#0A0F0B',borderColor:'transparent',backgroundColor:'#F0CE6A',transform:'none'});
  const box={children:[],clientLeft:0,clientTop:0,getBoundingClientRect:()=>({left:100,top:280}),appendChild(n){this.children.push(n);}};
  const fake=(classes,attrs)=>{
    const cls=new Set(classes),vars={},n={attrs:{...attrs},parentNode:box,offsetWidth:172,
      style:{setProperty:(k,v)=>{vars[k]=v;},getPropertyValue:k=>vars[k]},
      classList:{add:(...k)=>k.forEach(x=>cls.add(x)),remove:(...k)=>k.forEach(x=>cls.delete(x)),contains:k=>cls.has(k)},
      matches:q=>q==='.btn[data-portal-to]'&&cls.has('btn')&&'data-portal-to' in n.attrs,getAttribute:k=>n.attrs[k]??null,
      setAttribute:(k,v)=>{n.attrs[k]=v;},removeAttribute:k=>{delete n.attrs[k];},querySelector:()=>null,
      getBoundingClientRect:()=>({left:120,top:300,width:172.5,height:48}),cloneNode:()=>fake([...cls],n.attrs),remove:()=>box.children.splice(box.children.indexOf(n),1),cls};
    return n;
  };
  const trap=fake(['btn','btn-p'],{'data-portal-to':'projetos'}),slab=fake(['btn','btn-g'],{'data-portal-to':'sobre'});
  assert.equal(c.passageButton(trap),trap);assert.equal(c.passageButton({matches:()=>false}),null,'other ends are HTML of their own');
  c.buttonFx(trap,'fall',true,0);
  const [l,r]=box.children;assert.equal(box.children.length,2);assert.ok(l.cls.has('pass-l')&&r.cls.has('pass-r'));
  assert.ok(trap.cls.has('pass-hole')&&trap.cls.has('pass-pit'),'the button itself is the pit');
  for(const half of [l,r]){
    assert.equal(half.attrs['data-portal-to'],undefined,'no second way in');assert.equal(half.attrs['aria-hidden'],'true');assert.equal(half.inert,true);
    assert.deepEqual([half.style.left,half.style.top,half.style.width,half.style.height],['20px','20px','172.5px','48px']);assert.equal(half.style.backgroundColor,'#F0CE6A');
  }
  assert.equal(l.style.getPropertyValue('--open'),'0.000');assert.equal(l.style.getPropertyValue('--seam'),'0.00','closed, before the seam cracks');
  c.buttonFx(trap,'fall',true,400);assert.equal(r.style.getPropertyValue('--open'),'1.000');assert.equal(r.style.getPropertyValue('--seam'),'1.00');
  c.portalHatch(trap,false);assert.equal(box.children.length,0);assert.deepEqual([...trap.cls],['btn','btn-p'],'and it is a button again');
  c.buttonFx(slab,'stairs',true,200);assert.equal(box.children.length,1);assert.ok(box.children[0].cls.has('pass-slab'));assert.ok(slab.cls.has('pass-steps'));
  assert.equal(box.children[0].style.backgroundColor,undefined,'the slab takes the floor colour');assert.notEqual(box.children[0].style.getPropertyValue('--shake'),'0.00px','it grinds as it slides');
  c.buttonFx(trap,'fall',true,0);assert.equal(slab.cls.has('pass-steps'),false,'one button open at a time');assert.equal(box.children.length,2);
  c.buttonFxEnd();assert.equal(box.children.length,0);
  const css=read('src/enhancements.css');
  for(const rule of ['.btn.pass-pit{','.btn.pass-steps{','.pass-l{','.pass-r{','.okr .pass-slab{'])assert.ok(css.includes(rule),rule);
});

test('Sobre’s door is walked into, and Início and Contato call each other from two payphones',()=>{
  const {context}=fixture('sobre'),api=context.PortfolioScene,kind=cls=>fixture().c.endStyle({classList:{contains:k=>k===cls}});
  assert.equal(kind('portal-front'),'door');assert.equal(kind('portal-phone'),'phone');
  const out=api.passages.door.out,call=api.passages.phone;
  assert.equal(api.passagePose('door',true,100).dir,'u','he turns to the door');assert.ok(api.passagePose('door',true,500).dy<0,'and walks into it');
  assert.equal(api.passagePose('door',true,out-1).alpha,0,'until the dark takes him');
  assert.equal(api.passagePose('phone',true,200).dir,'u','he answers with his back to us');
  const thin=api.passagePose('phone',true,1000);assert.ok(thin.sx<.6&&thin.sy>1.4,'the line pulls him thin and tall');
  assert.ok(api.passagePose('phone',true,call.out-1).alpha<.1);
  assert.equal(api.passagePose('phone',false,50).alpha,0);const back=api.passagePose('phone',false,call.in-1);assert.equal(back.dir,'d');assert.equal(back.sx,1);
  const {c,el}=fixture('inicio'),sounds=[];c.sfx=n=>sounds.push(n);el.classList.add('portal-phone');
  c.teleport('contato','contact-home',el);assert.equal(c._wk.anim.style,'phone');assert.equal(el.classList.contains('is-open'),true,'it rings');
  c.passageCue(c._wk.anim,0,call.out);assert.deepEqual(sounds,['ring','ring','dial']);
  const html=read('src/template.html');
  assert.equal((html.match(/class="ph-sym"/g)||[]).length,2,'two payphones');assert.equal((html.match(/class="fd-sym"/g)||[]).length,1,'one door');
  assert.doesNotMatch(html,/data-portal-id="(?:home-contact|sobre|contact-home)"[^>]*><span class="portal-stone"/,'no pedestals left there');
  assert.match(read('src/app.js'),/case 'ring':[^\n]*case 'dial':|case 'ring':[\s\S]{0,200}case 'dial':/);
});

test('home passages respect reduced motion, keep pedestal portals spinning and reset on a new destination',()=>{
  const calm=fixture('inicio');calm.c.state.motionReduced=true;calm.c.teleport('projetos',null,null,undefined,'fall');
  assert.equal(calm.c._wk.anim,null);calm.finishNavigation();assert.equal(calm.c.curPage(),'projetos');assert.equal(calm.c._teleportStyle,null);
  const spin=fixture('inicio');spin.c.teleport('contato','contact-home');assert.equal(spin.c._wk.anim.style,'spin');
  const moved=fixture('inicio');moved.c.teleport('sobre',null,null,undefined,'stairs');moved.c.go('contato');assert.equal(moved.c._teleportStyle,null);
});

test('every page reaches every other through one hidden passage, and each passage leads back',()=>{
  const {c,context}=fixture('quarto'),api=context.PortfolioScene,html=read('src/template.html'),pages=api.pageOrder;
  assert.equal(Object.keys(api.portals).length,20,'five pages, four ends each');
  for(const from of pages)for(const to of pages.filter(p=>p!==from)){
    const id=api.directPortal(from,to),link=api.portals[id],back=api.portals[link?.arrival];
    assert.ok(id,from+' → '+to);assert.equal(link.page,from);assert.equal(link.to,to);
    assert.equal(back.page,to);assert.equal(back.to,from);assert.equal(back.arrival,id,id+' comes back the same way');
    if(from==='quarto'){
      const o=c.roomPortal(id);assert.ok(o,id);assert.equal(o.walk,true);assert.equal(c.rmFree(o.t[0],o.t[1]),true);
      assert.ok(c.rmPath(11,12,[[o.t[0],o.t[1]]]),id+' is reachable from the door');
    }else{
      // The schematic's passages also wait on the quest list for narrow screens, where the schematic is hidden.
      const [,attr,value]=link.selector.match(/\[(data-portal-(?:id|to))="([^"]+)"\]/),twice=['projects-about','projects-contact','projects-room'].includes(id);
      assert.equal((html.match(new RegExp(attr+'="'+value+'"','g'))||[]).length,twice?2:1,id+' has one button per layout');
    }
  }
});

test('hidden doors and hatches sit on the panel lines without changing their layout',()=>{
  const html=read('src/template.html'),css=read('src/enhancements.css');
  const prev=html.split('<div class="prev">')[1].split('<div class="pnl">')[0];
  for(const id of ['projects-about','projects-contact','projects-room'])assert.ok(prev.includes('data-portal-id="'+id+'"'),id+' is in the schematic');
  assert.ok(prev.indexOf('portal-door-l')>prev.indexOf('class="prev-f"'),'the doors follow the schematic, out of its flow');
  assert.match(prev,/<svg class="sch"/);assert.match(prev,/clique pra abrir a missão/);
  assert.match(css,/\.portal-anchor\.portal-door\{position:absolute/);assert.match(css,/\.prev\{position:relative\}/);
  // the leaf is centered on the 1px border and erases it underneath, so a closed door is the line itself
  assert.match(css,/\.portal-anchor\.portal-door-l\{left:-12\.5px\}\.portal-anchor\.portal-door-r\{right:-12\.5px\}/);
  assert.match(css,/\.portal-anchor\.portal-floor\{bottom:-15\.5px/);assert.match(css,/\.door-leaf\{stroke:var\(--ln2\)/);
  assert.match(css,/\.portal-rail\{position:relative;height:0\}/);
  assert.match(html,/<div class="portrait">[^]*?<\/div>\s*<\/div>\s*<div class="portal-rail"><button[^>]*data-portal-id="about-room"/);
  // behind a letter: the heading keeps its name and the "?" lets clicks through to the passage under it
  assert.match(html,/<h1 class="cont" aria-label="Continue\?">[^]*?<span class="q"><button class="portal-anchor portal-letter" data-portal-id="contact-room"[^>]*><\/button><span class="q-g">\?<\/span><\/span>/);
  assert.match(css,/\.q-g\{[^}]*pointer-events:none/);
  for(const id of ['about-projects','about-contact','contact-about','contact-projects','contact-room','projects-about'])assert.match(html,new RegExp('data-portal-id="'+id+'" data-poke="twirl" sc-camel-on-click="\\{\\{portalUse\\}\\}"'));
});

test('each bedroom passage opens its hiding place, plays out and lands on its page end',()=>{
  for(const [id,to] of [['room-projects','projetos'],['room-about','sobre'],['room-contact','contato']]){
    const {c,geo,el,context,finishNavigation}=fixture('quarto'),api=context.PortfolioScene,o=c.roomPortal(id),rm=c.rmInit(),sounds=[];
    c.sfx=name=>sounds.push(name);c.rmExit=()=>{throw new Error('a passage never walks through the door');};
    c.rmGoTo(o.t[0],o.t[1],c.data().room.indexOf(o));assert.equal(rm.portalTravel,undefined,'walking there is not enough');
    for(let i=0;i<300&&!rm.portalTravel;i++)c.rmUpdate(rm,160,false);
    assert.deepEqual([rm.x,rm.y],[o.t[0],o.t[1]]);assert.equal(rm.portalTravel?.kind,'out');assert.equal(rm.portalTravel.id,id);
    assert.equal(c._teleportArrival,api.portals[id].arrival);assert.equal(c._roomSeen[id],true);
    const {out}=api.roomEnds[id].len,last=api.roomPose(id,true,out-1);
    assert.equal(api.roomOpen(id,'out',0),0);assert.equal(api.roomOpen(id,'out',400),1,'the hiding place opens first');
    assert.ok(last.alpha<.1||last.under&&last.dx<=-20,id+': he is gone (or under the bed) by the end');
    c.rmUpdate(rm,out-1,false);assert.equal(rm.portalTravel.kind,'out');c.rmUpdate(rm,1,false);assert.equal(rm.portalTravel.kind,'wait');
    assert.ok(sounds.length>=3,id+' has its own sounds');
    finishNavigation();assert.equal(c.curPage(),to);
    const wk=c.worldSpawn(to,geo);assert.equal(wk.anim?.kind,'teleport-in');assert.equal(wk.anim.hatch,el);
  }
});

test('each page end returns to its bedroom passage, which closes behind him before the tutorial',()=>{
  for(const [from,id] of [['projetos','projects-room'],['sobre','about-room'],['contato','contact-room']]){
    const {c,geo,context,finishNavigation}=fixture(from),api=context.PortfolioScene,back=api.portals[id].arrival,o=c.roomPortal(back),spoken=[];
    c.say=text=>spoken.push(text);
    c._teleportArrival=id;Object.assign(c._wk,c.teleportSpot(geo));c._teleportArrival=null;
    c.usePortal(id);assert.equal(c._wk.anim?.kind,'teleport-out');assert.equal(c._wk.anim.to,'quarto');assert.equal(c._teleportArrival,back);
    c.worldAnim(c._wk,760,geo);finishNavigation();assert.equal(c.curPage(),'quarto');
    const rm=c.rmInit(),len=api.roomEnds[back].len.in,first=api.roomPose(back,false,0);
    assert.deepEqual([rm.x,rm.y],[o.t[0],o.t[1]]);assert.equal(rm.portalTravel?.kind,'in');assert.equal(rm.portalTravel.id,back);assert.equal(rm.enter,false);
    assert.ok(api.roomOpen(back,'in',len-1)<.05,'closed again at the end');assert.ok(first.alpha===0||first.under,'he starts inside the passage');
    c.rmUpdate(rm,len-1,false);assert.equal(spoken.length,0);c.rmUpdate(rm,1,false);assert.equal(rm.portalTravel,null);assert.equal(spoken.length,1);
  }
});

test('leaving the bedroom through the navigation may take the passage to that page instead of the door',()=>{
  const {c,context,finishNavigation}=fixture('quarto'),api=context.PortfolioScene,rm=c.rmInit();
  c._rmCv={};context.Math.random=()=>0;let calls=0;
  c.navGo('sobre',()=>calls++);
  assert.equal(c._rmOut?.portal,'room-about');assert.ok(!rm.exit);assert.ok(rm.path.length);assert.equal(c.state.trip,1);
  for(let i=0;i<400&&!rm.portalTravel;i++)c.rmUpdate(rm,160,false);
  assert.deepEqual([rm.x,rm.y],[0,10]);assert.equal(rm.portalTravel?.kind,'out');assert.equal(c._rmOut,null);assert.equal(c.state.trip,0);
  c.rmUpdate(rm,api.roomEnds['room-about'].len.out,false);finishNavigation();assert.equal(c.curPage(),'sobre');assert.equal(calls,1);
  // a new destination drops the old passage; the door's own action and reduced motion keep the door
  const swap=fixture('quarto');swap.c._rmCv={};swap.context.Math.random=()=>0;swap.c.rmInit();swap.c.navGo('sobre');swap.c.navGo('contato');
  assert.equal(swap.c._rmOut?.portal,'room-contact');assert.equal(swap.c._rmOut.to,'contato');
  const door=fixture('quarto');door.c._rmCv={};door.context.Math.random=()=>0;door.c.rmInit();door.c.roomAct('site');
  assert.equal(door.c._rmOut?.portal,undefined);assert.equal(door.c._rm.exit,true);
  const calm=fixture('quarto');calm.c._rmCv={};calm.context.Math.random=()=>0;calm.c.state.motionReduced=true;calm.c.rmInit();calm.c.navGo('contato');
  assert.equal(calm.c._rmOut?.portal,undefined);
});

test('passage tiles never take an object away: each one still answers from a tile of its own',()=>{
  const {c}=fixture('quarto'),room=c.data().room,ends=new Set(c.roomPortals().map(o=>o.t[0]+','+o.t[1]));
  assert.equal(ends.size,4);
  const spots=(o,skip)=>{const list=[];for(let y=o.t[1];y<o.t[1]+o.t[3];y++)for(let x=o.t[0];x<o.t[0]+o.t[2];x++)for(const [nx,ny,f] of [[x,y+1,'u'],[x-1,y,'r'],[x+1,y,'l'],[x,y-1,'d']])if(c.rmFree(nx,ny)&&(!o.face||o.face===f)&&!(skip&&ends.has(nx+','+ny)))list.push([nx,ny]);return list;};
  for(const o of room.filter(o=>!o.walk&&!o.door)){
    const all=spots(o,false),own=spots(o,true);
    if(all.length&&c.rmPath(11,12,all))assert.ok(own.length&&c.rmPath(11,12,own),o.id+' stays reachable without standing on a passage');
  }
  // walking to an object can still end on a passage tile: the object answers and the passage stays shut
  const rm=c.rmInit(),caderno=room.findIndex(o=>o.id==='caderno');let opened=-1;c.rmOpen=i=>{opened=i;};
  Object.assign(rm,{x:2,y:4,from:[2,4],to:[2,4],dir:'u',goal:caderno,goalDir:'u'});c.rmReach(rm);
  assert.equal(opened,caderno);assert.equal(rm.portalTravel,undefined);
  // E on the tile itself still takes the passage
  c.rmKey({key:'e',preventDefault(){}});assert.equal(rm.portalTravel?.id,'room-contact');
});

test('with the schematic hidden, its passages leave and arrive through the quest list',()=>{
  const html=read('src/template.html'),css=read('src/enhancements.css'),styles=read('src/styles.css');
  assert.match(styles,/@media \(max-width:860px\)\{[^]*?\.proj-r\{display:none\}/);
  assert.match(css,/\.proj-rail\{display:none\}/);assert.match(css,/@media\(max-width:860px\)\{\.proj-rail\{display:block\}\}/);
  assert.match(html,/<\/ol>\s*<div class="portal-rail proj-rail">(?:<button[^>]*data-portal-id="projects-(?:about|contact|room)"[^]*?<\/button>){3}<\/div>/);
  const {c,geo,sc}=fixture('projetos'),hidden={getBoundingClientRect:()=>({left:0,top:0,right:0,bottom:0,width:0,height:0})};
  const shown={getBoundingClientRect:()=>({left:300,top:500,right:340,bottom:530,width:40,height:30})};
  sc.querySelector=()=>hidden;sc.querySelectorAll=()=>[hidden,shown];
  assert.equal(c.portalEl(geo,'[data-portal-id="projects-about"]'),shown);
  c._teleportArrival='projects-about';assert.deepEqual({...c.teleportSpot(geo)},{x:310,y:432});
  sc.querySelectorAll=()=>[hidden];assert.deepEqual({...c.teleportSpot(geo)},{x:440,y:125},'nothing on screen: the default landing');
});

test('short passages (the coin slot, the dot of the ?) register where Hikaru parks on them',()=>{
  const {c,geo}=fixture('contato'),slot={getBoundingClientRect:()=>({left:600,top:300,right:640,bottom:312,width:40,height:12})};
  const [x,y]=c.portalPoint(slot,geo);Object.assign(c._wk,{x,y:y+3*geo.u});
  assert.equal(c.portalHit(geo,c._wk,slot),slot);
  Object.assign(c._wk,{x:x+40});assert.equal(c.portalHit(geo,c._wk,slot),null);
});

test('hidden doors are walked through and hatches dropped into, at both ends of the passage',()=>{
  const {c,geo,el,context,finishNavigation}=fixture('projetos'),api=context.PortfolioScene,sounds=[];c.sfx=name=>sounds.push(name);
  const kind=cls=>c.endStyle({classList:{contains:k=>k===cls}});
  assert.equal(kind('portal-door-l'),'door-l');assert.equal(kind('portal-door-r'),'door-r');assert.equal(kind('portal-floor'),'hatch');assert.equal(kind('portal-letter'),'hatch');
  assert.equal(kind('portal-hatch'),'spin','the kanji hatch keeps its spin');assert.equal(c.endStyle(null),'spin');
  // leaving: he steps back while the door swings open, then the wall line cuts him off as he walks through
  const first=api.passagePose('door-l',true,0),back=api.passagePose('door-l',true,200),gone=api.passagePose('door-l',true,850);
  assert.equal(first.clip,null,'whole while the door opens');assert.equal(first.dir,'r');assert.ok(back.dx<0,'a step back');
  assert.deepEqual(Array.from(back.clip),[-200,-80,200,160],'everything right of the wall is hidden');assert.equal(gone.alpha,0);
  el.classList.add('portal-door');el.classList.add('portal-door-l');
  c._teleportArrival='projects-about';Object.assign(c._wk,c.teleportSpot(geo));c._teleportArrival=null;
  c.usePortal('projects-about');assert.equal(c._wk.anim.style,'door-l');assert.equal(el.classList.contains('is-open'),true);assert.equal(c._teleportStyle,null);
  c.worldAnim(c._wk,899,geo);assert.equal(c.curPage(),'projetos');c.worldAnim(c._wk,1,geo);
  assert.equal(el.classList.contains('is-open'),false,'the door shuts behind him');finishNavigation();assert.equal(c.curPage(),'sobre');
  assert.ok(sounds.includes('door')&&sounds.includes('doorShut')&&sounds.filter(s=>s==='land').length>=3,'door, steps and the door closing');
  // arriving: the door at the other end opens, he walks out of its wall and stays outside
  el.classList.remove('portal-door-l');el.classList.add('portal-door-r');
  const wk=c.worldSpawn('sobre',geo),x0=wk.x;assert.equal(wk.anim.style,'door-r');assert.equal(el.classList.contains('is-open'),true);
  assert.equal(api.passagePose('door-r',false,0).alpha,0,'he starts inside the wall');
  assert.equal(c.worldAnim(wk,900,geo),false);assert.equal(wk.x,x0+12*geo.u,'and ends outside it');assert.equal(el.classList.contains('is-open'),false);
  // hatches: the trapdoor drop on one side, a pop back up on the other
  const drop=api.passagePose('hatch',true,700),up=api.passagePose('hatch',false,350),done=api.passagePose('hatch',false,899);
  assert.ok(drop.clip&&drop.sx<1,'drops into the hatch');assert.ok(up.lift>0&&up.alpha>0,'pops back up');assert.equal(done.sx,1);assert.equal(done.alpha,1);
});
