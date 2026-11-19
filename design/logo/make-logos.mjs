// Logo exploration for OKARU, built on the Ogasawara clan crest: 三階菱 (sangaibishi, three stacked lozenges).
// Run `node design/logo/make-logos.mjs`: writes one SVG per variant and index.html beside this file.
import { writeFile } from 'node:fs/promises';

const C = { bg: '#0A0F0B', pn: '#131B15', gold: '#D8B24A', gold2: '#F0CE6A', jade: '#62B37F', jade2: '#8FD3A6', tx: '#E8E4D4' };
const out = new URL('./', import.meta.url);

// The crest: three lozenges, each half the height of the one below behind it, widening downward.
// Drawn back to front; the ground-coloured outline cuts the gap between tiers, as on a real mon.
const tiers = (cx = 50, top = 26, h = 10, widths = [14, 24, 34]) => widths.map((w, i) => ({ cx, cy: top + h + i * (h * 1.2), w, h }));
const rhomb = ({ cx, cy, w, h }) => `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
const crest = (fill, gap = C.bg, gw = 2.4, t = tiers()) =>
  t.slice().reverse().map((r) => `<polygon points="${rhomb(r)}" fill="${fill}" stroke="${gap}" stroke-width="${gw}" stroke-linejoin="round"/>`).join('');
const inRhomb = (x, y, { cx, cy, w, h }) => Math.abs(x - cx) / w + Math.abs(y - cy) / h <= 1;

const svg = (body, bg = C.bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img"><rect width="100" height="100" fill="${bg}"/>${body}</svg>`;

// Pixel crest: the same three tiers sampled on a 15-cell grid, like the site's pixel 光 favicon.
function pixelCrest() {
  const t = tiers(50, 24, 11, [16, 27, 38]), n = 15, cell = 80 / n, cells = [];
  for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) {
    const x = 10 + (gx + .5) * cell, y = 10 + (gy + .5) * cell;
    // a cell belongs to the frontmost tier covering it; a thin band under each upper tier stays empty (the gap)
    const k = t.findIndex((r) => inRhomb(x, y, r));
    if (k < 0) continue;
    const upper = t.slice(0, k).some((r) => inRhomb(x, y, { ...r, w: r.w * 1.16, h: r.h * 1.16 }));
    if (!upper) cells.push(`<rect x="${(10 + gx * cell).toFixed(2)}" y="${(10 + gy * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="${k === 0 ? C.gold2 : C.gold}"/>`);
  }
  return cells.join('');
}

const variants = [
  {
    id: 'mon', title: 'Mon', sub: 'Kamon clássico',
    why: 'O 三階菱 do jeito que um brasão de família é desenhado: dentro de um anel duplo, em dourado sólido sobre o fundo do site. A opção mais fiel, com peso de heráldica.',
    body: `<circle cx="50" cy="50" r="42" fill="none" stroke="${C.gold}" stroke-width="3"/><circle cx="50" cy="50" r="36.5" fill="none" stroke="${C.gold}" stroke-width="1"/>${crest(C.gold, C.bg, 2.4, tiers(50, 28, 9, [12, 21, 30]))}`
  },
  {
    id: 'pixel', title: 'Pixel Mon', sub: 'Grade 15 × 15',
    why: 'O brasão amostrado célula por célula, na mesma grade do favicon 光 em pixel. Conversa direto com a pixel art do portfólio e aguenta 16 px.',
    body: pixelCrest()
  },
  {
    id: 'hikari', title: 'Hikari', sub: '光 × 三階菱',
    why: 'O topo do 光 (hikari, o primeiro caractere do nome) ocupa o lugar do losango de cima: três traços de luz saem das duas camadas de baixo. Nome e linhagem num único símbolo.',
    body: `${crest(C.gold, C.bg, 2.4, tiers(50, 34, 10, [14, 24, 34]).slice(1).map((r) => ({ ...r, cy: r.cy - 6 })))}
      <g stroke="${C.gold2}" stroke-width="5" stroke-linecap="square"><line x1="50" y1="12" x2="50" y2="36"/><line x1="30" y1="18" x2="38" y2="32"/><line x1="70" y1="18" x2="62" y2="32"/></g>`
  },
  {
    id: 'tate', title: 'Tate', sub: 'Escudo samurai',
    why: 'O escudo da família ao pé da letra: um tate (盾) de madeira com borda jade e o brasão dourado no centro, como o mon pintado nos escudos e estandartes de um clã.',
    body: `<path d="M50 8 L84 18 V52 C84 72 68 86 50 93 C32 86 16 72 16 52 V18 Z" fill="${C.pn}" stroke="${C.jade}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M50 15 L77 23 V52 C77 68 65 79 50 85 C35 79 23 68 23 52 V23 Z" fill="none" stroke="${C.jade}" stroke-width=".8" opacity=".7"/>${crest(C.gold, C.pn, 2.4, tiers(50, 30, 8.5, [11, 19, 27]))}`
  },
  {
    id: 'circuit', title: 'Circuit Mon', sub: 'Trilhas + vias',
    why: 'Os losangos como contorno de placa, com trilhas saindo para vias: o brasão de quem solda ESP32. Combina com o lado hardware/IoT dos projetos.',
    body: `<g fill="none" stroke="${C.jade2}" stroke-width="2.2" stroke-linejoin="miter">${tiers(50, 26, 10, [14, 24, 34]).map((r) => `<polygon points="${rhomb(r)}"/>`).join('')}
      <path d="M16 60 H8 V83 M84 60 H92 V17 M50 26 V10 H69 M50 70 V91"/></g>
      <g fill="${C.bg}" stroke="${C.gold}" stroke-width="2"><circle cx="8" cy="86" r="3"/><circle cx="92" cy="14" r="3"/><circle cx="72" cy="10" r="3"/><circle cx="50" cy="94" r="3"/></g>
      <circle cx="50" cy="36" r="3.2" fill="${C.gold2}"/>`
  },
  {
    id: 'hanko', title: 'Hanko', sub: 'Carimbo de nome',
    why: 'Um carimbo quadrado, do tipo usado para assinar documentos no Japão, com o brasão vazado no dourado. Serve de assinatura no currículo, no README ou no rodapé do portfólio.',
    body: `<rect x="12" y="12" width="76" height="76" rx="7" fill="${C.gold}"/><rect x="17" y="17" width="66" height="66" rx="4" fill="none" stroke="${C.bg}" stroke-width="1.6"/>${crest(C.bg, C.gold, 2.4, tiers(50, 28, 9.5, [13, 22, 31]))}`
  },
  {
    id: 'power', title: 'Power Mon', sub: 'Botão de boot',
    why: 'Um O de Okaru que também é o símbolo de ligar: o losango de cima é o traço do botão, fechando o anel. Liga o brasão à TV acendendo e ao log de boot.',
    body: `<path d="M33 22 A33 33 0 1 0 67 22" fill="none" stroke="${C.gold}" stroke-width="6" stroke-linecap="round" transform="translate(0 4)"/>
      ${crest(C.gold2, C.bg, 2.6, tiers(50, 10, 9, [9, 15, 21]).map((r, i) => ({ ...r, cy: r.cy + i * 1.5 })))}`
  }
];

for (const v of variants) await writeFile(new URL(`okaru-${v.id}.svg`, out), svg(v.body) + '\n');

const cards = variants.map((v, i) => `
  <article class="card">
    <div class="canvas">${svg(v.body)}</div>
    <p class="num">0${i + 1}</p>
    <h2>${v.title}</h2><h3>${v.sub}</h3>
    <p class="why">${v.why}</p>
    <div class="sizes" aria-label="Tamanhos pequenos">${[64, 32, 16].map((s) => `<span style="width:${s}px;height:${s}px">${svg(v.body)}</span>`).join('')}</div>
    <a href="okaru-${v.id}.svg" download>okaru-${v.id}.svg</a>
  </article>`).join('');

await writeFile(new URL('index.html', out), `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OKARU Logos</title>
<style>
:root{--bg:${C.bg};--pn:#0D130F;--ln:#1E2A21;--tx:${C.tx};--mut:#A3AD9F;--gold:${C.gold}}
*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--tx);font:15px/1.6 ui-monospace,'JetBrains Mono',Consolas,monospace;padding:56px 16px}
header{max-width:1100px;margin:0 auto 48px}h1{font-size:44px;letter-spacing:.12em;font-weight:500;color:var(--gold)}
header p{color:var(--mut);max-width:62ch;margin-top:8px}
main{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px}
.card{background:var(--pn);border:1px solid var(--ln);padding:24px;display:flex;flex-direction:column;gap:6px;transition:transform .5s cubic-bezier(.16,1,.3,1),border-color .5s}
.card:hover{transform:translateY(-4px);border-color:var(--gold)}
.canvas{aspect-ratio:1;margin-bottom:14px;border:1px solid var(--ln)}.canvas svg,.sizes svg{display:block;width:100%;height:100%}
.num{color:var(--gold);font-size:12px;letter-spacing:.2em}h2{font-size:20px;font-weight:500;letter-spacing:.08em;text-transform:uppercase}
h3{font-size:12px;color:var(--mut);font-weight:400;letter-spacing:.1em}.why{color:var(--mut);font-size:13.5px;margin:6px 0 10px}
.sizes{display:flex;align-items:end;gap:12px;margin-top:auto;padding-top:8px}.sizes span{display:block;flex:none}
a{color:var(--gold);font-size:12px;margin-top:10px}a:hover{color:#F0CE6A}
</style></head><body>
<header><h1>OKARU</h1><p>Sete jeitos de levar o brasão da família Ogasawara, o 三階菱 (sangaibishi: três losangos empilhados), para a marca do portfólio. Cada um também aparece em 64, 32 e 16 px.</p></header>
<main>${cards}
</main></body></html>
`);
console.log('wrote', variants.length, 'variants');
