// Read-only audit using Node's bundled parser. No dependency is shipped to the browser.
import fs from 'node:fs';
import vm from 'node:vm';
const exports={};
vm.runInNewContext(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],{exports,module:{exports}});
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/content.js','utf8'),context);
const catalog=context.window.PORTFOLIO_LOCALES;
// Include current source translations even when the last build predates an edit.
for(const name of fs.readdirSync('src').filter(n=>/^translations(?:-.*)?\.tsv$/.test(n)).sort()){
  for(const line of fs.readFileSync('src/'+name,'utf8').split(/\r?\n/).filter(Boolean)){
    const [pt,en,ja,overridePt]=line.split('\t');
    if(!pt||!en||!ja)throw new Error('Incomplete translation in '+name+': '+line);
    catalog[pt]={en,ja,...(overridePt?{pt:overridePt}:{})};
  }
}
const found=new Map();
function add(text,file,line){
  text=text.replace(/\s+/g,' ').trim();
  if(!text||text.length<3||catalog[text]||!/[a-zA-ZÀ-ÿ]/.test(text))return;
  if(!/\s|[À-ÿ]/.test(text))return;
  if(/^(?:[Mm]\d|[.#@]|https?:|\/?assets\/|translate|rotate|matrix|rgba?\(|data:|linear-gradient|var\(|[a-z-]+:)/.test(text))return;
  if(/[{};]|=>|\bfunction\b|\breturn\b/.test(text))return;
  if(!found.has(text))found.set(text,{text,file,line});
}
for(const file of fs.readdirSync('src').filter(name=>name.endsWith('.js')).map(name=>'src/'+name)){
  const ast=exports.parse(fs.readFileSync(file,'utf8'),{ecmaVersion:'latest',locations:true});
  const walk=node=>{if(!node||typeof node!=='object')return;if(node.type==='Literal'&&typeof node.value==='string')add(node.value,file,node.loc.start.line);for(const key of Object.keys(node))if(key!=='loc')Array.isArray(node[key])?node[key].forEach(walk):walk(node[key]);};walk(ast);
}
const t=fs.readFileSync('src/template.html','utf8');
for(const m of t.matchAll(/>([^<>]+)</g))if(!m[1].includes('{{'))add(m[1],'template',0);
for(const m of t.matchAll(/(?:aria-label|title|placeholder|alt)="([^"{}]+)"/g))add(m[1],'template',0);
fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/untranslated.json',JSON.stringify([...found.values()],null,2));
console.log('Uncatalogued human-text candidates:',found.size);
