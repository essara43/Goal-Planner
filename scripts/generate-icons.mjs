/**
 * Génère les icônes PNG de la PWA (cible concentrique sur fond sombre).
 *
 * Écrit en Node pur avec `zlib` pour éviter d'ajouter une dépendance de build
 * uniquement pour quelques images. Relancer avec `node scripts/generate-icons.mjs`
 * après toute modification de la palette.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const BACKGROUND = [2, 6, 23]; // slate-950
/** Anneaux de la cible, du plus grand au plus petit : [rayon relatif, couleur]. */
const RINGS = [
  [0.42, [56, 189, 248]], // sky-400
  [0.32, [15, 23, 42]], // slate-900
  [0.22, [56, 189, 248]],
  [0.12, [15, 23, 42]],
  [0.06, [244, 63, 94]], // rose-500
];

const SUPERSAMPLE = 3;

function colorAt(x, y, size, scale) {
  const center = size / 2;
  const dx = x - center;
  const dy = y - center;
  const distance = Math.sqrt(dx * dx + dy * dy) / size;
  // Du plus petit anneau au plus grand : le premier qui contient le point gagne.
  for (let i = RINGS.length - 1; i >= 0; i -= 1) {
    const [radius, color] = RINGS[i];
    if (distance <= radius * scale) return color;
  }
  return BACKGROUND;
}

/** `scale` réduit le motif pour tenir dans la zone sûre des icônes maskable. */
function renderRgba(size, scale) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const [cr, cg, cb] = colorAt(
            x + (sx + 0.5) / SUPERSAMPLE,
            y + (sy + 0.5) / SUPERSAMPLE,
            size,
            scale,
          );
          r += cr;
          g += cg;
          b += cb;
        }
      }
      const samples = SUPERSAMPLE * SUPERSAMPLE;
      const offset = (y * size + x) * 4;
      pixels[offset] = Math.round(r / samples);
      pixels[offset + 1] = Math.round(g / samples);
      pixels[offset + 2] = Math.round(b / samples);
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // profondeur 8 bits
  header[9] = 6; // RGBA
  // Chaque ligne est préfixée par son octet de filtre (0 = aucun).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ICONS = [
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  { file: 'icon-512-maskable.png', size: 512, scale: 0.72 },
  { file: 'apple-touch-icon.png', size: 180, scale: 1 },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const { file, size, scale } of ICONS) {
  writeFileSync(join(OUT_DIR, file), encodePng(size, renderRgba(size, scale)));
  console.log(`${file} — ${size}×${size}`);
}
