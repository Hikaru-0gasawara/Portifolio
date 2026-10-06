// Tab and home-screen icons: the pixel 光 (hikari, the first character of his name) in gold on the site's ground.
// Every file is drawn here from the same 13×13 bitmap the okwm neofetch uses; run `npm run icons` after changing it.
import { writeFile, mkdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const glyph = ['......X......', '.X....X....X.', '..X...X...X..', '...X..X..X...', '......X......', 'XXXXXXXXXXXXX', '....X...X....', '....X...X....', '....X...X....', '...X....X....', '..X.....X...X', '.X......X...X', 'X........XXXX'];
const ground = [0x0A, 0x0F, 0x0B, 255], gold = [0xF0, 0xCE, 0x6A, 255], frame = [0xD8, 0xB2, 0x4A, 255];

// size: canvas; cell: pixels per bitmap cell; border: gold frame width (0 where the OS masks the corners).
const sizes = [
  { file: 'assets/icons/favicon-16.png', size: 16, cell: 1, border: 0, keep: false },
  { file: 'assets/icons/favicon-32.png', size: 32, cell: 2, border: 1, keep: false },
  { file: 'assets/icons/favicon-48.png', size: 48, cell: 3, border: 1, keep: false },
  { file: 'assets/icons/apple-touch-icon.png', size: 180, cell: 12, border: 0 },
  { file: 'assets/icons/icon-192.png', size: 192, cell: 12, border: 0 },
  { file: 'assets/icons/icon-512.png', size: 512, cell: 32, border: 0 }
];

function draw({ size, cell, border }) {
  const px = new Uint8Array(size * size * 4);
  const put = (x, y, c) => px.set(c, (y * size + x) * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const edge = border && (x < border || y < border || x >= size - border || y >= size - border);
    put(x, y, edge ? frame : ground);
  }
  // A 13-cell glyph is odd-sized: on even canvases the extra pixel goes right and bottom, under the hook of 光.
  const offset = Math.floor((size - 13 * cell) / 2);
  glyph.forEach((row, gy) => [...row].forEach((c, gx) => {
    if (c !== 'X') return;
    for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) put(offset + gx * cell + x, offset + gy * cell + y, gold);
  }));
  return px;
}

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
  const text = Buffer.from('Software\0scripts/make-icons.mjs (Hikaru Ogasawara portfolio): pixel 光 drawn from code', 'latin1');
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
  const cells = glyph.flatMap((row, y) => [...row].map((c, x) => c === 'X' ? `<rect x="${3 + x * 2}" y="${3 + y * 2}" width="2" height="2"/>` : '')).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges"><!-- scripts/make-icons.mjs: pixel 光 --><rect width="32" height="32" fill="#D8B24A"/><rect x="1" y="1" width="30" height="30" fill="#0A0F0B"/><g fill="#F0CE6A">${cells}</g></svg>\n`;
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
