import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
function fixture(page='projetos',scrollTop=0){
  const timers=new Map();let timerId=0;
  const context={window:{},console,Date,Math,setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;},clearTimeout:id=>timers.delete(id),document:{}};
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
  return {c,geo,el,hatch,rect,sc,finishNavigation};
}

test('portals are real buttons in heading grid, inside the left content column',()=>{
  const html=read('src/template.html'),css=read('src/enhancements.css');
  assert.equal((html.match(/class="page-heading"/g)||[]).length,2);
  assert.equal((html.match(/class="portal-anchor(?: portal-secret| portal-hatch)?"/g)||[]).length,5);
  for(const cls of ['proj-l','ab-s']){
    const slice=html.slice(html.indexOf('<div class="'+cls+'">'));
    assert.match(slice,/^[\s\S]*?<div class="page-heading">\s*<h1[^]*?<button class="portal-anchor"[^]*?<\/button>\s*<\/div>/);
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

test('contact footer follows social links and its portal sits below on the left',()=>{
  const html=read('src/template.html').split('<div class="ct-acts rise"')[1],css=read('src/enhancements.css');
  assert.ok(html.indexOf('ct-social')<html.indexOf('ct-foot'));
  assert.ok(html.indexOf('ct-foot')<html.indexOf('data-portal-id="contact-home"'));
  assert.match(css,/\.ct-acts>\.ct-foot\{margin-top:0/);
  assert.match(css,/\.portal-secret\{align-self:flex-start;[^}]*margin:2px 0 0 8px/);
});

test('home contact pedestal is outside the selector; separate hatch preserves furigana',()=>{
  const html=read('src/template.html'),css=read('src/enhancements.css');
  assert.match(html,/<div class="home-r">\s*<div class="home-portal-row">[^]*?data-portal-id="home-contact"[^]*?<\/div>\s*<div class="sel rise"/);
  assert.match(html,/<span class="kanji-w">\s*<button[^]*?data-portal-id="home-room"[^]*?<\/button>\s*<button class="kanji-b[^]*?\{\{readName\}\}/);
  assert.match(css,/\.home-portal-row\{display:grid;place-items:center/);
  assert.match(css,/\.kanji-w>\.portal-hatch\{position:absolute;bottom:100%/);
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

test('contact return lands on the selector pedestal, not on the project or about buttons',()=>{
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
  const {c,geo,finishNavigation}=fixture('inicio');c.state.motionReduced=true;c._wk=null;
  c.usePortal('home-room');finishNavigation();assert.equal(c.curPage(),'quarto');assert.equal(c._rm.x,23);assert.equal(c._rm.portalTravel,null);
  c.roomPortalStart();finishNavigation();assert.equal(c.curPage(),'inicio');
  const wk=c.worldSpawn('inicio',geo);assert.equal(wk.x,362);assert.equal(wk.anim,null);assert.equal(wk.hidden,false);
});
