import {mkdir,readFile,writeFile} from 'node:fs/promises';
const dir=new URL('../public/assets/projects/',import.meta.url);
await mkdir(dir,{recursive:true});
const diagrams=[
  ['aquasense-flow','AquaSense / data flow',['Water sensors','ESP32 / C++','MQTT over TLS','HiveMQ Cloud','React dashboard','Alexa / Lambda']],
  ['aquasense-control','AquaSense / pump logic',['Water + collector','Temperature delta','ON: delta >= 5 C','OFF: delta <= 1 C','60 s anti-cycling','Relay / solar pump']],
  ['infra-network','Infrastructure / network',['Internet','IPFire firewall','Network zones','Proxmox host','Windows / AD / DC','SIEM / event logs']],
  ['infra-validation','Infrastructure / validation',['Access policies','Firewall rules','Host event logs','SIEM correlation','Kali Linux checks','Review configuration']],
  ['safe-hardware','Electronic safe / hardware',['3 x 4 keypad','ESP32','NVS password','I2C / PCF8574','16 x 2 LCD','PWM / servo lock']],
  ['safe-ports','Electronic safe / ports',['Arduino UNO','C++ / EEPROM','Raspberry Pi Pico','MicroPython','ESP32','C++ / Preferences']],
  ['cptm-api','CPTM / API structure',['REST requests','Spring controllers','Trains / stations','Railway lines','Jackson / JSON','Operational statistics']],
  ['cptm-validation','CPTM / API validation',['Create','Query','Update status','Remove','JUnit / 10 classes','Postman / endpoints']]
];
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const translations=JSON.parse(await readFile(new URL('../src/diagram-translations.json',import.meta.url),'utf8'));
for(const [index,[name,englishTitle,englishLabels]] of diagrams.entries())for(const lang of ['pt','en','ja']){
  const [title,labels]=lang==='en'?[englishTitle,englishLabels]:translations[lang][index];
  const boxes=labels.map((label,i)=>{
    const x=70+(i%3)*292,y=170+Math.floor(i/3)*170;
    return `<g><rect x="${x}" y="${y}" width="252" height="100" rx="8" fill="#12261b" stroke="#638a6d"/><text x="${x+18}" y="${y+27}" font-size="12" fill="#c4a663">0${i+1}</text><text x="${x+126}" y="${y+62}" text-anchor="middle" font-size="17" fill="#e3efe5">${escape(label)}</text></g>`;
  }).join('');
  const links='<path d="M322 220H362M614 220H654M780 270V305H196V340M322 390H362M614 390H654" fill="none" stroke="#83b291" stroke-width="2" marker-end="url(#arrow)"/>';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="980" height="540" viewBox="0 0 980 540" role="img" aria-label="${title}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="#83b291"/></marker></defs><rect width="980" height="540" fill="#09120d"/><g font-family="monospace"><text x="70" y="66" font-size="13" fill="#b9a269">HIKARU OGASAWARA / PROJECT NOTES</text><text x="70" y="108" font-size="28" fill="#e3efe5">${title}</text>${links}${boxes}<text x="70" y="500" font-size="13" fill="#8fa595">ILLUSTRATIVE DIAGRAM / NOT A SCREENSHOT</text></g></svg>`;
  const localized=svg.replace('HIKARU OGASAWARA / PROJECT NOTES',{pt:'HIKARU OGASAWARA / NOTAS DO PROJETO',en:'HIKARU OGASAWARA / PROJECT NOTES',ja:'HIKARU OGASAWARA / プロジェクトノート'}[lang]).replace('ILLUSTRATIVE DIAGRAM / NOT A SCREENSHOT',{pt:'ESQUEMA ILUSTRATIVO / NÃO É UMA CAPTURA DE TELA',en:'ILLUSTRATIVE DIAGRAM / NOT A SCREENSHOT',ja:'説明用の構成図 / 実際の画面キャプチャではありません'}[lang]);
  await writeFile(new URL(name+(lang==='pt'?'':'.'+lang)+'.svg',dir),localized);
}
const path=new URL('../src/projects.json',import.meta.url),projects=JSON.parse(await readFile(path,'utf8'));
const captions=[['Fluxo de dados — esquema ilustrativo','Controle da bomba — esquema ilustrativo'],['Rede do laboratório — esquema ilustrativo','Validação do ambiente — esquema ilustrativo'],['Periféricos do cofre — esquema ilustrativo','Portes entre plataformas — esquema ilustrativo'],['Estrutura da API — esquema ilustrativo','Operações e validação — esquema ilustrativo']];
projects.forEach((p,i)=>p.gallery=diagrams.slice(i*2,i*2+2).map((d,j)=>({src:'./assets/projects/'+d[0]+'.svg',localized:{en:'./assets/projects/'+d[0]+'.en.svg',ja:'./assets/projects/'+d[0]+'.ja.svg'},alt:captions[i][j],caption:captions[i][j]})));
await writeFile(path,JSON.stringify(projects,null,2)+'\n');
