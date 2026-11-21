// Generates the LOCK IN logo as PNG icons (no dependencies).
// Logo: black field, three rising orange bars ("Steps").
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const ORANGE = [255, 106, 26]
const BG = [0, 0, 0]

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size, px) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

// Logo "Steps": three rising rounded bars (opacity .38 / .68 / 1) — unit coords from a 100x100 artboard.
const BARS = [
  { x: 24, y: 56, w: 13, h: 20, a: 0.38 },
  { x: 43.5, y: 42, w: 13, h: 34, a: 0.68 },
  { x: 63, y: 24, w: 13, h: 52, a: 1 },
]
const R = 4
function inRoundRect(px, py, b) {
  if (px < b.x || px > b.x + b.w || py < b.y || py > b.y + b.h) return false
  const cx = Math.min(Math.max(px, b.x + R), b.x + b.w - R)
  const cy = Math.min(Math.max(py, b.y + R), b.y + b.h - R)
  return (px - cx) ** 2 + (py - cy) ** 2 <= R * R
}
// returns orange alpha at unit coords (0..1); scale<1 shrinks art for the maskable safe zone
function alphaAt(x, y, scale) {
  const px = 50 + (x * 100 - 50) / scale
  const py = 50 + (y * 100 - 50) / scale
  for (const b of BARS) if (inRoundRect(px, py, b)) return b.a
  return 0
}

function render(size, scale) {
  const ss = 4
  const px = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let acc = 0
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++) acc += alphaAt((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size, scale)
      const a = acc / (ss * ss)
      const i = (y * size + x) * 4
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(BG[c] * (1 - a) + ORANGE[c] * a)
      px[i + 3] = 255
    }
  return png(size, px)
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192-v2.png', render(192, 1))
writeFileSync('public/icons/icon-512-v2.png', render(512, 1))
writeFileSync('public/icons/maskable-512-v2.png', render(512, 0.8))
writeFileSync('public/icons/apple-touch-icon-v2.png', render(180, 1))
writeFileSync('public/favicon.png', render(64, 1.2))
console.log('icons written')
