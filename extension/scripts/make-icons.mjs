// Draws the AutoApps icon (rounded gradient square with an "A") at 16/48/128 px.
// No image libraries: pixels are computed directly and written as PNG with zlib.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5, size);
      raw.set([r, g, b, a], y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function pixel(x, y, size) {
  const u = x / size, v = y / size;
  // Rounded square coverage (radius 22%), anti-aliased over one pixel
  const r = 0.22, px = 1 / size;
  const qx = Math.max(Math.abs(u - 0.5) - (0.5 - r), 0);
  const qy = Math.max(Math.abs(v - 0.5) - (0.5 - r), 0);
  const inside = clamp01((r - Math.hypot(qx, qy)) / px + 0.5);
  if (inside === 0) return [0, 0, 0, 0];

  // Gradient #3b82f6 → #06b6d4 along the diagonal (the app's primary colors)
  const t = clamp01((u + v) / 2);
  let [cr, cg, cb] = [59 + (6 - 59) * t, 130 + (182 - 130) * t, 246 + (212 - 246) * t];

  // The "A": two legs and a crossbar
  const stroke = size <= 16 ? 0.085 : 0.07;
  const d = Math.min(
    segDist(u, v, 0.5, 0.2, 0.27, 0.8),
    segDist(u, v, 0.5, 0.2, 0.73, 0.8),
    segDist(u, v, 0.36, 0.58, 0.64, 0.58)
  );
  const ink = clamp01((stroke - d) / px + 0.5);
  cr += (255 - cr) * ink;
  cg += (255 - cg) * ink;
  cb += (255 - cb) * ink;
  return [Math.round(cr), Math.round(cg), Math.round(cb), Math.round(255 * inside)];
}

for (const size of [16, 48, 128]) {
  writeFileSync(`icons/icon-${size}.png`, png(size, pixel));
  console.log(`icons/icon-${size}.png`);
}
