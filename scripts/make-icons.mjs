// Tab and home-screen icons: the Mon, the Ogasawara crest (三階菱, three stacked lozenges) inside a double ring,
// in gold on the site's ground. Same geometry as design/logo/okaru-mon.svg and the HUD mark; run `npm run icons`
// after changing it. Drawn by sampling the shapes, so no rasteriser dependency.
import { writeFile, mkdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const ground = [0x0A, 0x0F, 0x0B], gold = [0xD8, 0xB2, 0x4A];
// The crest in a 100-unit square: three lozenges [cx, cy, half-width, half-height], back to front, and two rings.
const tiers = [[50, 58.6, 30, 9], [50, 47.8, 21, 9], [50, 37, 12, 9]];
const ringR = 42, innerR = 36.5;

const sizes = [
  { file: 'assets/icons/favicon-16.png', size: 16, keep: false },
  { file: 'assets/icons/favicon-32.png', size: 32, keep: false },
  { file: 'assets/icons/favicon-48.png', size: 48, keep: false },
  { file: 'assets/icons/apple-touch-icon.png', size: 180 },
  { file: 'assets/icons/icon-192.png', size: 192 },
  { file: 'assets/icons/icon-512.png', size: 512 }
];

// Signed distance (in units) from a point to a lozenge's edge: negative inside.
const lozenge = (x, y, [cx, cy, w, h]) => (Math.abs(x - cx) / w + Math.abs(y - cy) / h - 1) / Math.hypot(1 / w, 1 / h);
// Small icons get thicker lines and wider gaps (about a pixel at least), and drop the hairline inner ring below 48 px.
function inMon(x, y, size) {
  const px = 100 / size, gap = Math.max(1.2, px * .6), outer = Math.max(1.5, px * .55), inner = Math.max(.9, px * .5), d = Math.hypot(x - 50, y - 50);
  if (d >= ringR - outer) return true; // the outer ring runs to the round cut, so no dark halo is left outside it
  if (size >= 48 && Math.abs(d - innerR) <= inner) return true;
  return tiers.some((t, k) => lozenge(x, y, t) <= -gap && tiers.slice(k + 1).every((u) => lozenge(x, y, u) > gap));
}

// Round icon: the canvas is cropped to the outer edge of the ring, and everything outside that circle is transparent.
const cutR = 44.5;
function draw({ size }) {
  const px = new Uint8Array(size * size * 4), n = 4;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let hit = 0, disc = 0;
    for (let sy = 0; sy < n; sy++) for (let sx = 0; sx < n; sx++) {
      const mx = 50 + ((x + (sx + .5) / n) * 100 / size - 50) * cutR / 50, my = 50 + ((y + (sy + .5) / n) * 100 / size - 50) * cutR / 50;
      if (Math.hypot(mx - 50, my - 50) > cutR) continue;
      disc++; if (inMon(mx, my, size)) hit++;
    }
    const a = disc ? hit / disc : 0;
    px.set([...ground.map((g, i) => Math.round(g + (gold[i] - g) * a)), Math.round(255 * disc / (n * n))], (y * size + x) * 4);
  }
  return px;
}
// Self-check: tier centres are gold; the gap between tiers and the space inside the ring are ground.
if (!(inMon(50, 37, 512) && inMon(50, 62, 512) && !inMon(50, 46.5, 512) && !inMon(30, 30, 512))) throw new Error('Mon geometry');

const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = table[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function chunk(type, data) {
  const head = Buffer.alloc(8); head.writeUInt32BE(data.length, 0); head.write(type, 4, 'ascii');
  const tail = Buffer.alloc(4); tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, tail]);
}
function png(size, rgba) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) raw.set(rgba.subarray(y * size * 4, (y + 1) * size * 4), y * (size * 4 + 1) + 1);
  // Provenance travels inside the file.
  const text = Buffer.from('Software\0scripts/make-icons.mjs (Hikaru Ogasawara portfolio): Ogasawara crest drawn from code', 'latin1');
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('tEXt', text), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
// ICO with PNG payloads (16, 32, 48), for agents that only ask for /favicon.ico.
function ico(images) {
  const head = Buffer.alloc(6 + images.length * 16); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + i * 16; head.writeUInt8(size % 256, at); head.writeUInt8(size % 256, at + 1); head.writeUInt16LE(1, at + 4); head.writeUInt16LE(32, at + 6);
    head.writeUInt32LE(data.length, at + 8); head.writeUInt32LE(offset, at + 12); offset += data.length;
  });
  return Buffer.concat([head, ...images.map(i => i.data)]);
}
function svg() {
  const pts = ([cx, cy, w, h]) => `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${50 - cutR} ${50 - cutR} ${cutR * 2} ${cutR * 2}"><!-- scripts/make-icons.mjs: Ogasawara crest --><circle cx="50" cy="50" r="${cutR}" fill="#0A0F0B"/><g fill="none" stroke="#D8B24A"><circle cx="50" cy="50" r="${ringR}" stroke-width="5"/><circle cx="50" cy="50" r="${innerR}" stroke-width="1.8"/></g><g fill="#D8B24A" stroke="#0A0F0B" stroke-width="3" stroke-linejoin="round">${tiers.map((t) => `<polygon points="${pts(t)}"/>`).join('')}</g></svg>\n`;
}

await mkdir(path.join(root, 'assets/icons'), { recursive: true });
const made = {};
for (const spec of sizes) {
  const data = png(spec.size, draw(spec)); made[spec.size] = data;
  if (spec.keep !== false) await writeFile(path.join(root, spec.file), data);
}
await writeFile(path.join(root, 'assets/icons/favicon.svg'), svg());
await writeFile(path.join(root, 'favicon.ico'), ico([16, 32, 48].map(size => ({ size, data: made[size] }))));
await writeFile(path.join(root, 'site.webmanifest'), JSON.stringify({
  name: 'Hikaru Ogasawara — Portfólio', short_name: 'okaru', start_url: './', display: 'browser', background_color: '#0A0F0B', theme_color: '#0A0F0B',
  icons: [{ src: 'assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }]
}, null, 2) + '\n');
console.log('Icons written to public/ (favicon.svg, PNGs, favicon.ico, site.webmanifest).');
