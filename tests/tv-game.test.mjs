import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
function game(){const context={window:{}};vm.createContext(context);vm.runInContext(read('src/tv-game.js'),context);return context.window.PortfolioTvGame;}

test('TV game waits for launch and moves the paddle with keyboard or pointer target',()=>{
  const a=game(),s=a.fresh();assert.equal(s.bricks.length,24);assert.equal(s.lives,3);assert.equal(s.mode,'serve');
  s.keys.right=true;for(let i=0;i<100;i++)a.step(s,16);
  assert.equal(s.paddle,a.width-a.paddleWidth/2-8);assert.equal(s.ball.x,s.paddle);assert.equal(s.score,0);
  s.keys={};s.target=100;for(let i=0;i<100;i++)a.step(s,16);assert.equal(s.paddle,100);
  a.launch(s);assert.equal(s.mode,'play');assert.ok(s.ball.vy<0);a.step(s,16);assert.ok(s.ball.y<a.paddleY-6);
});
test('TV ball bounces from walls and paddle edges without falling through',()=>{
  const a=game(),s=a.fresh();a.launch(s);
  s.ball={x:14,y:190,vx:-210,vy:60};a.step(s,20);assert.ok(s.ball.vx>0);
  s.ball={x:466,y:190,vx:210,vy:60};a.step(s,20);assert.ok(s.ball.vx<0);
  for(const side of [-1,1]){s.ball={x:s.paddle+side*40,y:a.paddleY-8,vx:0,vy:270};a.step(s,20);assert.ok(s.ball.vy<0);assert.equal(Math.sign(s.ball.vx),side);assert.ok(s.ball.y<a.paddleY);}
});
test('each TV brick scores once and ball collision removes only the struck block',()=>{
  const a=game(),s=a.fresh();a.launch(s);const brick=s.bricks[16];
  s.ball={x:brick.x+20,y:brick.y+brick.h+6,vx:0,vy:-210};a.step(s,15);
  assert.equal(brick.alive,false);assert.equal(s.score,10);assert.equal(s.bricks.filter(b=>b.alive).length,23);assert.ok(s.ball.vy>0);
  a.step(s,15);assert.equal(s.score,10);
});
test('TV misses reset the ball, then end after three lives',()=>{
  const a=game(),s=a.fresh();
  for(let life=2;life>=0;life--){a.launch(s);s.ball={x:20,y:a.height+6,vx:0,vy:210};a.step(s,5);assert.equal(s.lives,life);assert.equal(s.mode,life?'serve':'over');}
  const snapshot=JSON.stringify(s);a.step(s,500);assert.equal(JSON.stringify(s),snapshot);
});
test('TV game progresses through three stages, restores a life and reaches victory',()=>{
  const a=game(),s=a.fresh();s.lives=2;
  for(let stage=1;stage<=3;stage++){
    a.launch(s);s.bricks.forEach((b,i)=>{b.alive=i===16;});const last=s.bricks[16];
    s.ball={x:last.x+20,y:last.y+last.h+6,vx:0,vy:-210};a.step(s,15);
    assert.equal(s.score,110*stage);assert.equal(s.lives,3);assert.equal(s.mode,stage===3?'win':'serve');
    assert.equal(s.level,Math.min(3,stage+1));
  }
});
test('TV pause freezes the whole simulation and clears held keys',()=>{
  const a=game(),s=a.fresh();a.launch(s);s.keys.left=true;a.pause(s);assert.equal(s.mode,'pause');assert.equal(Object.keys(s.keys).length,0);
  const snapshot=JSON.stringify(s);a.step(s,5000);assert.equal(JSON.stringify(s),snapshot);a.pause(s);assert.equal(s.mode,'play');
  const waiting=a.fresh();a.pause(waiting);a.pause(waiting);assert.equal(waiting.mode,'serve');
  for(const dt of [NaN,Infinity,-1,0]){const before=JSON.stringify(s);a.step(s,dt);assert.equal(JSON.stringify(s),before);}
});
test('TV physics remains finite across a long automated rally',()=>{
  const a=game(),s=a.fresh();
  for(let i=0;i<50000&&s.mode!=='win';i++){
    if(s.mode==='serve')a.launch(s);if(s.mode==='over')break;
    s.target=s.ball.x+Math.sin(i/97)*35;a.step(s,16);
    for(const n of [s.ball.x,s.ball.y,s.ball.vx,s.ball.vy,s.paddle,s.score])assert.ok(Number.isFinite(n));
    assert.ok(s.lives>=0&&s.lives<=3);assert.ok(s.level>=1&&s.level<=3);
  }
  assert.ok(s.score>0);
});
test('TV game labels, statuses and instructions have English and Japanese translations',()=>{
  const a=game(),catalog={};
  for(const file of fs.readdirSync(new URL('../src/',import.meta.url)).filter(file=>/^translations(?:-.*)?\.tsv$/.test(file)))for(const row of read('src/'+file).split(/\r?\n/).filter(Boolean)){const [pt,en,ja]=row.split('\t');catalog[pt]={en,ja};}
  const section=read('src/template.html').split('<sc-if value="{{tvGameOpen}}">')[1].split('<sc-if value="{{shooterOpen}}">')[0];
  const texts=[...Object.values(a.statuses),'Rebote CRT','Jogar na TV','Voltar ao puff','Uma partida no puff','Tela limpa!','Lançar bola','Bola em jogo','Reiniciar partida','Recorde','Fase',...Array.from(section.matchAll(/<p>([^<]+)<\/p>/g),m=>m[1])];
  for(const text of texts.filter(text=>!text.includes('{{')))for(const lang of ['en','ja'])assert.ok(catalog[text]?.[lang],lang+': '+text);
  assert.match(section,/data-nopoke="true"/);assert.match(section,/tabindex="0"/);assert.match(section,/role="status"/);
});
