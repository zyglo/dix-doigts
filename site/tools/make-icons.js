// Dessine les icônes de l'application (PNG) sans dépendance : le logo du site,
// huit barres aux couleurs des doigts, sur un fond bleu nuit.
// Sortie : app-assets/icons/*.png et favicon.svg
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const out = path.join(__dirname, '..', 'app-assets', 'icons');
fs.mkdirSync(out, { recursive: true });

const BG = [22, 27, 51];                       // --ink du thème clair (#161b33)
const COLORS = ['#ff7e97', '#ffa34f', '#e8cb4c', '#5fd185', '#4dc4e9', '#8199ff', '#b78eff', '#f07fdb'];
const HEIGHTS = [11, 16, 22, 17, 17, 22, 16, 11]; // mêmes proportions que le logo du site
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

function inRound(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
  const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/** size : côté en pixels ; full : fond plein (masquable, iOS) ; group : largeur du logo / côté. */
function draw(size, { full, group }) {
  const shapes = [];
  const bgR = full ? 0 : size * 0.22;
  shapes.push({ rect: [0, 0, size, size], r: bgR, c: BG });
  const unit = (size * group) / 46;           // 8 barres de 4 et 7 écarts de 2 = 46 unités
  const gw = 46 * unit, gh = 22 * unit;
  const left = (size - gw) / 2, bottom = (size + gh) / 2;
  HEIGHTS.forEach((h, i) => {
    const x0 = left + i * 6 * unit, x1 = x0 + 4 * unit;
    shapes.push({ rect: [x0, bottom - h * unit, x1, bottom], r: 2 * unit, c: hex(COLORS[i]) });
  });
  const px = Buffer.alloc(size * size * 4);
  const SS = 4; // suréchantillonnage pour des bords lisses
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const X = x + (sx + 0.5) / SS, Y = y + (sy + 0.5) / SS;
        let col = null;
        for (const s of shapes) if (inRound(X, Y, s.rect[0], s.rect[1], s.rect[2], s.rect[3], s.r)) col = s.c;
        if (col) { r += col[0]; g += col[1]; b += col[2]; a++; }
      }
      const o = (y * size + x) * 4, n = SS * SS;
      if (a) { px[o] = Math.round(r / a); px[o + 1] = Math.round(g / a); px[o + 2] = Math.round(b / a); }
      px[o + 3] = Math.round(255 * a / n);
    }
  }
  return png(size, size, px);
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const v of buf) c = CRC[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const files = [
  ['icon-192.png', 192, { full: false, group: 0.62 }],
  ['icon-512.png', 512, { full: false, group: 0.62 }],
  ['icon-maskable-512.png', 512, { full: true, group: 0.5 }],   // reste dans la zone sûre de 80 %
  ['apple-touch-icon.png', 180, { full: true, group: 0.6 }],     // iOS arrondit lui-même les coins
  ['favicon-32.png', 32, { full: false, group: 0.74 }],
];
for (const [name, size, o] of files) {
  const buf = draw(size, o);
  fs.writeFileSync(path.join(out, name), buf);
  console.log(name, size + ' px', Math.round(buf.length / 1024) + ' Ko');
}

// favicon vectoriel
const u = 100 / 46 * 0.62, left = (100 - 46 * u) / 2, bottom = (100 + 22 * u) / 2;
const bars = HEIGHTS.map((h, i) => `<rect x="${(left + i * 6 * u).toFixed(2)}" y="${(bottom - h * u).toFixed(2)}" width="${(4 * u).toFixed(2)}" height="${(h * u).toFixed(2)}" rx="${(2 * u).toFixed(2)}" fill="${COLORS[i]}"/>`).join('');
fs.writeFileSync(path.join(out, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#161b33"/>${bars}</svg>\n`);
console.log('favicon.svg');
