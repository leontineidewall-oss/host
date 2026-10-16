// share image, 1200x630: block-letter HOST, the O ringed by an orbit with a small moon, encoded as PNG with node's zlib
const zlib = require("zlib");
const W = 1200, H = 630;
const FONT = {
  T: "11111,00100,00100,00100,00100,00100,00100", A: "01110,10001,10001,11111,10001,10001,10001", X: "10001,10001,01010,00100,01010,10001,10001",
  O: "01110,10001,10001,10001,10001,10001,01110", N: "10001,11001,10101,10011,10001,10001,10001", "-": "00000,00000,00000,11111,00000,00000,00000",
  C: "01110,10001,10000,10000,10000,10001,01110", H: "10001,10001,10001,11111,10001,10001,10001", I: "01110,00100,00100,00100,00100,00100,01110",
  P: "11110,10001,10001,11110,10000,10000,10000", "&": "01100,10010,10100,01000,10101,10010,01101", L: "10000,10000,10000,10000,10000,10000,11111",
  "+": "00000,00100,00100,11111,00100,00100,00000", S: "01111,10000,10000,01110,00001,00001,11110", V: "10001,10001,10001,10001,10001,01010,00100",
  F: "11111,10000,10000,11110,10000,10000,10000", R: "11110,10001,10001,11110,10100,10010,10001", E: "11111,10000,10000,11110,10000,10000,11111",
  D: "11110,10001,10001,10001,10001,10001,11110", W: "10001,10001,10001,10101,10101,10101,01010", G: "01110,10001,10000,10111,10001,10001,01111", Y: "10001,10001,01010,00100,00100,00100,00100", " ": "00000,00000,00000,00000,00000,00000,00000"
};
const CRC = (function () { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function draw() {
  const px = new Uint32Array(W * H).fill(0x000000);
  function rect(x, y, w, h, c) { for (let j = Math.max(0, y); j < Math.min(H, y + h); j++) for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) px[j * W + i] = c; }
  for (let y = 15; y < H; y += 30) for (let x = 15; x < W; x += 30) rect(x, y, 2, 2, 0x161616);
  function text(s, cell, gapCells, cy, color, shadow, depth) {
    const adv = (5 + gapCells) * cell, w = s.length * adv - gapCells * cell, x0 = Math.round((W - w) / 2), dot = Math.max(2, Math.round(cell * 0.82));
    for (const pass of [0, 1]) {
      if (pass === 0 && !shadow) continue;
      for (let k = 0; k < s.length; k++) {
        const g = (FONT[s[k]] || FONT[" "]).split(",");
        for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r][c] === "1") {
          const x = x0 + k * adv + c * cell, y = cy + r * cell;
          if (pass === 0) for (let d = depth; d >= 1; d--) rect(x + d * 2, y + d * 2, dot, dot, d === depth ? 0x2a2a2a : shadow);
          else rect(x, y, dot, dot, color);
        }
      }
    }
  }
  text("HOST", 30, 1, 120, 0xffffff, 0x6b6b6b, 6);
  // a dotted orbit around the O (second letter)
  const ocx = 255 + 180 + 75, ocy = 120 + 105;
  for (let a = 0; a < Math.PI * 2; a += 0.07) {
    const ex = Math.cos(a) * 112, ey = Math.sin(a) * 30, rx = ex * Math.cos(-0.32) - ey * Math.sin(-0.32), ry = ex * Math.sin(-0.32) + ey * Math.cos(-0.32);
    if (Math.sin(a) < 0 && Math.abs(rx) < 80) continue;
    rect(Math.round(ocx + rx) - 3, Math.round(ocy + ry) - 3, 6, 6, 0xd0d0d0);
  }
  text("PAIR WITH A GIANT", 7, 1, 420, 0xffffff);
  text("PAY ITS HOLDERS", 5, 1, 492, 0x8a8a8a);
  return px;
}
function png() {
  const px = draw(), raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) { const row = y * (W * 3 + 1); for (let x = 0; x < W; x++) { const c = px[y * W + x], o = row + 1 + x * 3; raw[o] = (c >> 16) & 255; raw[o + 1] = (c >> 8) & 255; raw[o + 2] = c & 255; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
let cached = null;
module.exports = function (req, res) {
  if (!cached) cached = png();
  res.statusCode = 200;
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.end(cached);
};
module.exports.png = png;
