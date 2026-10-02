import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
function fixture(){
  const context={window:null,document:{documentElement:{}},navigator:{language:'pt-BR'},localStorage:{getItem(){return null;},setItem(){}},React:{createElement:(type,props,...children)=>({type,props,children})}};
  context.window=context;context.DCLogic=class{constructor(){this.state={};this.props={};}};
  vm.createContext(context);
  for(const file of ['assets/content.js','src/i18n.js','src/boot.js','src/room-props.js','src/dice.js','src/achievements.js','src/desktop.js','src/hitbox.js'])vm.runInContext(read(file),context);
  vm.runInContext(read('src/app.js')+';window.TestComponent=Component;',context);
  for(const name of ['PortfolioRoom','PortfolioDice','PortfolioDesktop','PortfolioAchievements'])context[name].install(context.TestComponent);
  return {context,data:new context.TestComponent().data(),I:context.PortfolioI18n};
}

test('exactly 51 unique achievements and all their text is translated',()=>{
  const {context,data,I}=fixture();assert.equal(data.trophies.length,51);
  assert.equal(new Set(data.trophies.map(t=>t.id)).size,51);
  for(const locale of ['en','ja']){
    I.set(locale);
    for(const trophy of data.trophies)for(const field of ['name','goal','done','hint']){
      const text=trophy[field];if(!text)continue;
      assert.ok(context.PORTFOLIO_LOCALES[text]?.[locale]||I.t(text)!==text,locale+': '+trophy.id+'.'+field+' = '+text);
    }
  }
});

test('arcade play, replay and shooter actions translate at the React boundary',()=>{
  const {context,I,data}=fixture();
  const actions=['Jogar','JOGAR','JOGAR DE NOVO','Jogar / reiniciar','Pausar / continuar',...data.room.filter(o=>o.id.startsWith('fliperama')).flatMap(o=>(o.acts||[]).map(a=>a[0]))];
  for(const locale of ['en','ja']){
    I.set(locale);
    for(const action of actions){const element=context.React.createElement('button',{'aria-label':action},action);assert.notEqual(element.children[0],action,locale+': '+action);assert.equal(element.props['aria-label'],element.children[0]);}
  }
});

test('native language leaves survive rendering in every locale without changing normal translation',()=>{
  const {context,I}=fixture();
  for(const locale of ['pt','en','ja']){
    I.set(locale);
    for(const [text,lang] of [['Português','pt-BR'],['English','en'],['日本語','ja'],['Entrar →','pt-BR'],['Enter →','en'],['はじめる →','ja']]){
      const native=I.nativeText(text,lang),element=context.React.createElement('button',null,native);
      assert.equal(element.children[0],native);
      assert.equal(native.children[0],text);
      assert.equal(native.props.lang,lang);
      assert.equal(native.props.translate,'no');
    }
    assert.equal(context.React.createElement('p',null,'Português').children[0],{pt:'Português',en:'Portuguese',ja:'ポルトガル語'}[locale]);
  }
});

test('desktop app labels, fictional profile and hardware have localized copy',()=>{
  const {context,I}=fixture(),api=context.PortfolioDesktop;
  for(const locale of ['en','ja']){
    I.set(locale);
    for(const text of [...api.apps.map(a=>a[2]),...api.system,...api.profile]){
      if(text.startsWith('Hikaru Ogasawara'))continue;
      assert.ok(context.PORTFOLIO_LOCALES[text]?.[locale]||I.t(text)!==text,locale+': '+text);
    }
  }
});

test('every fighting tribute and fighter has Japanese display text',()=>{
  const {context,I}=fixture();I.set('ja');
  for(const text of [...context.PortfolioHitbox.fighters.map(f=>f[1]),...context.PortfolioHitbox.moves.map(m=>m.name)])assert.notEqual(I.t(text),text,text);
  assert.equal(I.t('UUDDLRLRBA'),'UUDDLRLRBA');
  assert.equal(I.t('LP MP HP LK MK HK A1 A2'),'LP MP HP LK MK HK A1 A2');
});

test('every source translation row contains three languages and valid direction',()=>{
  for(const file of fs.readdirSync(new URL('../src/',import.meta.url)).filter(n=>/^translations(?:-.*)?\.tsv$/.test(n))){
    for(const line of read('src/'+file).split(/\r?\n/).filter(Boolean)){
      const [pt,en,ja]=line.split('\t');assert.ok(pt&&en&&ja,file+': '+line);
      assert.ok(!/[\u202a-\u202e\u2066-\u2069]/.test(line),'Unexpected directional override: '+file);
    }
  }
});

test('skip and jump are different words: the tutorial and the walk chip skip, the games jump',()=>{
  const {context,I}=fixture(),app=read('src/app.js'),c=new context.TestComponent();
  assert.ok(app.includes("['Pular o tutorial', 'close']"));assert.ok(app.includes("'PULAR A CAMINHADA'"));
  c.state={page:'quarto',rmIntro:true,rmStep:0};assert.deepEqual(Array.from(c.rmActs().map(a=>a[0])),['Próxima','Pular o tutorial']);
  const expect={pt:['Pular','PULAR','Pular','PULAR'],en:['Skip','SKIP','Jump','JUMP'],ja:['スキップ','スキップ','ジャンプ','ジャンプ']};
  for(const [locale,words] of Object.entries(expect)){I.set(locale);assert.deepEqual(['Pular o tutorial','PULAR A CAMINHADA','Pular','PULAR'].map(I.t),words,locale);}
});
