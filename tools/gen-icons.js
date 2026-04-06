'use strict';
// Pure Node.js PNG icon generator — no native dependencies.
// Uses zlib (built-in) for deflate compression and manual CRC32.
// Run from repo root: node tools/gen-icons.js

const zlib = require('zlib');
const fs = require('fs');

// --- CRC32 ---
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// --- PNG chunk builder ---
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const forCrc = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(forCrc), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

// --- Icon pixel function ---
// Draws a gold flame on a dark marble background.
function getPixel(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;

  // Normalize coords so ±1 = 45% of size from center
  const nx = (x - cx) / (size * 0.45);
  const ny = (y - cy) / (size * 0.45); // -1 = top, +1 = bottom

  // Default: dark background (#070605)
  let r = 7, g = 6, b = 5, a = 255;

  const flameTip    = -0.85; // top of flame (negative = upper half)
  const flameBottom =  0.70; // base of flame

  if (ny >= flameTip && ny <= flameBottom) {
    const t = (ny - flameTip) / (flameBottom - flameTip); // 0=tip, 1=base

    // Width profile: zero at tip, widening with a sinusoidal curve
    const halfWidth = 0.52 * Math.pow(t, 0.55) * Math.sin(t * Math.PI * 0.90 + 0.10);

    if (Math.abs(nx) <= halfWidth) {
      const distFrac = Math.abs(nx) / Math.max(halfWidth, 0.001);
      const tipAlpha = t < 0.12 ? t / 0.12 : 1.0;

      // Core (#FFF5C0) → mid (#F0C860) → outer gold (#D4AA50)
      let pr, pg, pb;
      if (distFrac < 0.35) {
        const blend = distFrac / 0.35;
        pr = Math.round(255 + (240 - 255) * blend);
        pg = Math.round(245 + (200 - 245) * blend);
        pb = Math.round(192 + ( 96 - 192) * blend);
      } else {
        const blend = (distFrac - 0.35) / 0.65;
        pr = Math.round(240 + (212 - 240) * blend);
        pg = Math.round(200 + (170 - 200) * blend);
        pb = Math.round( 96 + ( 80 -  96) * blend);
      }

      r = pr; g = pg; b = pb;
      a = Math.round(255 * tipAlpha);
    }
  }

  return [r, g, b, a];
}

// --- PNG file builder ---
function generatePNG(size) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a_] = getPixel(x, y, size);
      const off = 1 + x * 4;
      row[off]     = r;
      row[off + 1] = g;
      row[off + 2] = b;
      row[off + 3] = a_;
    }
    rows.push(row);
  }

  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 6; // color type: RGBA
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace: none

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Run ---
const outDir = 'gritcore-app/www/img';
fs.mkdirSync(outDir, { recursive: true });

process.stdout.write('Generating icon-512.png ... ');
fs.writeFileSync(`${outDir}/icon-512.png`, generatePNG(512));
console.log('done');

process.stdout.write('Generating icon-192.png ... ');
fs.writeFileSync(`${outDir}/icon-192.png`, generatePNG(192));
console.log('done');

console.log(`Icons written to ${outDir}/`);
