import { readFile, writeFile, mkdir, cp, access, readdir, rm, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { validateTemplate } from './validate-template.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFile(path.join(root, 'src', name), 'utf8');
const [template, app, projects, translations] = await Promise.all([
  read('template.html'), read('app.js'), read('projects.json'), read('translations.tsv')
]);
validateTemplate(template);
const catalog={};
const extraTSV=(await readdir(path.join(root,'src'))).filter(n=>n.startsWith('translations-')&&n.endsWith('.tsv')).sort();
const allTranslations=[translations,...await Promise.all(extraTSV.map(read))].join('\n');
for(const line of allTranslations.split(/\r?\n/).filter(Boolean)) {
  const [pt,en,ja,overridePt]=line.split('\t');
  if(!pt||!en||!ja)throw new Error('Incomplete translation: '+line);
  // The TSV files are merged in name order; a second, different translation would silently win.
  const prior=catalog[pt];
  if(prior&&(prior.en!==en||prior.ja!==ja||(prior.pt||'')!==(overridePt||'')))throw new Error('Conflicting translations for: '+pt);
  catalog[pt]={en,ja,...(overridePt?{pt:overridePt}:{})};
}
// Resolve translations against the current data, including room and challenge extensions.
const sandbox={window:null,DCLogic:class{constructor(){this.props={};this.state={};}}};sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(app+';window.BuildComponent=Component;',sandbox);
for(const module of ['room-props.js','dice.js','achievements.js'])vm.runInContext(await read(module),sandbox);
sandbox.PortfolioRoom.install(sandbox.BuildComponent);sandbox.PortfolioDice.install(sandbox.BuildComponent);sandbox.PortfolioAchievements.install(sandbox.BuildComponent);
const content=new sandbox.BuildComponent().data();
const localizedData=JSON.parse(await read('localized-data.json'));
function collect(source,translated,where='data'){
  if(typeof source==='string'&&Array.isArray(translated)){
    if(!translated[0]||!translated[1])throw new Error('Incomplete translation: '+where);
    catalog[source.replace(/\s+/g,' ').trim()]={en:translated[0],ja:translated[1],...(translated[2]?{pt:translated[2]}:{})};return;
  }
  for(const [key,value] of Object.entries(translated)){
    const next=Array.isArray(source)&&!/^\d+$/.test(key)?source.find(o=>o.id===key||o.k===key):source?.[key];
    if(next===undefined)throw new Error('Unknown translation path: '+where+'.'+key);
    collect(next,value,where+'.'+key);
  }
}
collect(content,localizedData);
const projectLocales=JSON.parse(await read('project-translations.json'));
const projectData=JSON.parse(projects);
for(const lang of ['en','ja'])projectData.forEach((project,index)=>{
  const translation=projectLocales[lang][index];
  for(const [key,value] of Object.entries(translation)) {
    if(Array.isArray(value))value.forEach((text,i)=>{catalog[project[key][i]]={...catalog[project[key][i]],[lang]:text};});
    else catalog[project[key]]={...catalog[project[key]],[lang]:value};
  }
});
const labStart=template.indexOf('\n<sc-if value="{{isLab}}"'),labEnd=template.indexOf('\n<sc-if value="{{isSobre}}"',labStart);
if(labStart<0||labEnd<0)throw new Error('Lab template section not found');
const lab=template.slice(labStart,labEnd).replace(/^\s*<sc-if[^>]+>/,'').replace(/<\/sc-if>\s*$/,'');
const html = template.replace('<!--__DESKTOP_LAB__-->',()=>lab).replace('/*__APP_LOGIC__*/', () => app + '\nPortfolio.install(Component);');
validateTemplate(html, { generated: true });
const resumes=[];
for(const [locale,label] of [['pt','PT'],['en','EN'],['ja','JP']]){
  await access(path.join(root,'public','resume','hikaru-'+locale+'.pdf'));
  resumes.push({label,href:'./resume/hikaru-'+locale+'.pdf'});
}
const output=path.resolve(root,'dist');
if(path.dirname(output)!==path.resolve(root)||path.basename(output)!=='dist')throw new Error('Invalid generated output path');
const prior=await lstat(output).catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
if(prior?.isSymbolicLink())throw new Error('Refusing to clean a linked output directory');
await rm(output,{recursive:true,force:true});
for (const target of [root, output]) {
  await mkdir(target, { recursive: true });
  await cp(path.join(root, 'public'), target, { recursive: true });
  await mkdir(path.join(target, 'assets'), { recursive: true });
  for (const name of ['styles.css', 'fonts.css', 'enhancements.css', 'desktop.css', 'display.css', 'tv-game.css', 'i18n.js', 'boot.js', 'boot-flow.js', 'skill-tree.js', 'enhancements.js', 'character.js', 'character-care.js', 'room-props.js','dice.js','shooter.js','scene.js','desktop.js','pocket-games.js','hitbox.js','achievements.js','tv3d.js','display.js','tv-game.js','title-sound.js','gamepad.js']) {
    await writeFile(path.join(target, 'assets', name), await read(name));
  }
  const safeJSON = value => JSON.stringify(JSON.parse(value)).replace(/</g, '\\u003c');
  await writeFile(path.join(target, 'assets', 'content.js'), 'window.PORTFOLIO_PROJECTS=' + safeJSON(projects) + ';\nwindow.PORTFOLIO_LOCALES=' + safeJSON(JSON.stringify(catalog)) + ';\nwindow.PORTFOLIO_RESUMES='+JSON.stringify(resumes)+';');
  const resources=[...html.matchAll(/(?:src|href)="(\.\/(?:assets|vendor)\/[^"?]+\.(?:js|css))"/g)];
  let versioned=html;
  for(const [,url] of resources){const hash=createHash('sha256').update(await readFile(path.join(target,url.slice(2)))).digest('hex').slice(0,12);versioned=versioned.replaceAll('"'+url+'"','"'+url+'?v='+hash+'"');}
  await writeFile(path.join(target, 'index.html'), versioned);
  await writeFile(path.join(target, '.nojekyll'), '');
}
console.log('Built index.html and dist/ (all assets local).');
