import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('contact keeps copy email first and compact PDF links beside it, wrapping on narrow screens',()=>{
  const html=read('src/template.html'),css=read('src/enhancements.css');
  const contact=html.split('<div class="ctas ct-primary">')[1]?.split('<div class="ctas ct-social">')[0];
  assert.ok(contact,'dedicated primary contact row');
  assert.match(contact,/<button class="coin [^]*?insertCoin[^]*?<span class="cv-g"/);
  assert.match(contact,/<a href="\{\{cv.href\}\}" target="_blank" rel="noopener"/);
  assert.doesNotMatch(contact,/\bdownload(?:=|\s|>)/);
  assert.match(css,/\.ct-primary\{[^}]*display:flex;flex-wrap:wrap;align-items:stretch;gap:12px/);
  assert.match(css,/\.ct-primary>\.cv-g\{width:auto;flex:0 0 auto\}/);
  assert.match(css,/\.okr \.cv-language a\{width:100%;height:100%;box-sizing:border-box\}/);
});
