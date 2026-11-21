// Generates the LOCK IN logo as PNG icons (no dependencies).
// Logo: black field, orange progress ring with a gap ("locking in"), solid core dot.
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

// coverage of the orange shape at unit coords (0..1). scale<1 shrinks art for maskable safe zone.
function inside(x, y, scale) {
  const cx = 0.5, cy = 0.5
  const dx = (x - cx) / scale, dy = (y - cy) / scale
  const r = Math.hypot(dx, dy)
  if (r <= 0.085) return true // core dot
  const R = 0.3, T = 0.085
  if (r >= R - T / 2 && r <= R + T / 2) {
    // angle clockwise from 12 o'clock, degrees
    let a = (Math.atan2(dx, -dy) * 180) / Math.PI
    if (a < 0) a += 360
    if (a > 20 && a < 62) return false // the gap
    return true
  }
  // round caps at gap ends
  for (const deg of [20, 62]) {
    const rad = (deg * Math.PI) / 180
    const ex = Math.sin(rad) * R, ey = -Math.cos(rad) * R
    if (Math.hypot(dx - ex, dy - ey) <= T / 2) return true
  }
  return false
}

function render(size, scale) {
  const ss = 4
  const px = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let hit = 0
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++)
          if (inside((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size, scale)) hit++
      const a = hit / (ss * ss)
      const i = (y * size + x) * 4
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(BG[c] * (1 - a) + ORANGE[c] * a)
      px[i + 3] = 255
    }
  return png(size, px)
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', render(192, 1))
writeFileSync('public/icons/icon-512.png', render(512, 1))
writeFileSync('public/icons/maskable-512.png', render(512, 0.8))
writeFileSync('public/icons/apple-touch-icon.png', render(180, 1))
writeFileSync('public/favicon.png', render(64, 1.15))
console.log('icons written')
