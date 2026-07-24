import fs from 'fs'
import zlib from 'zlib'
import path from 'path'

function crc32(buf) {
  let c = 0xffffffff
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let k = n
    for (let i = 0; i < 8; i++) {
      k = (k & 1) ? (0xedb88320 ^ (k >>> 1)) : (k >>> 1)
    }
    table[n] = k
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  const crcVal = crc32(Buffer.concat([typeBuf, data]))
  crcBuf.writeUInt32BE(crcVal, 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function createPng(width, height) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const rowSize = width * 4 + 1
  const rawData = Buffer.alloc(height * rowSize)

  // Draw card background & spade pattern
  const cx = width / 2
  const cy = height / 2
  const borderRadius = width * 0.18

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize
    rawData[rowOffset] = 0 // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + 1 + x * 4

      // Outer background (#1e1e2d)
      let r = 0x1e, g = 0x1e, b = 0x2d, a = 255

      // Inner card bounds
      const margin = width * 0.15
      const cardW = width - 2 * margin
      const cardH = height - 2 * margin
      const cardX = margin
      const cardY = margin

      if (x >= cardX && x < cardX + cardW && y >= cardY && y < cardY + cardH) {
        // Card background (#ffffff -> #e2e2ec gradient)
        const t = (y - cardY) / cardH
        r = Math.round(255 - t * 25)
        g = Math.round(255 - t * 25)
        b = Math.round(255 - t * 15)

        // Draw central spade symbol roughly
        const dx = (x - cx) / (width * 0.22)
        const dy = (y - cy + height * 0.02) / (height * 0.22)

        // Heart flipped equation for spade body: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0 (where y is inverted)
        const sy = -dy + 0.2
        const eq = Math.pow(dx * dx + sy * sy - 0.7, 3) - dx * dx * Math.pow(sy, 3)
        
        // Stem of spade
        const isStem = (Math.abs(dx) < 0.12 && dy > 0.2 && dy < 0.55)

        if (eq <= 0 || isStem) {
          r = 0x1a
          g = 0x1a
          b = 0x24
        }
      }

      rawData[idx] = r
      rawData[idx + 1] = g
      rawData[idx + 2] = b
      rawData[idx + 3] = a
    }
  }

  const idatData = zlib.deflateSync(rawData)
  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', idatData)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk])
}

const publicDir = path.resolve('public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192))
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512))
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180))
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.png'), createPng(512, 512))

console.log('PNG icons created successfully!')
