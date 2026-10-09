// Simple script to generate clean PNG icons using pure Node and zlib
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createSolidPng(width, height, r, g, b, a = 255) {
  // Generate a valid PNG without external libraries
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type 6: RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Uncompressed raw scanlines: each line has 1 filter byte (0) + width * 4 bytes RGBA
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // filter None
    for (let x = 0; x < width; x++) {
      // Create a nice gym barbell icon or shield in center with dark background and emerald ring
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const radius = width * 0.45;

      let pr = 18, pg = 19, pb = 22; // dark charcoal background #121316

      // Outer ring
      if (dist >= radius - 8 && dist <= radius) {
        pr = 16; pg = 185; pb = 129; // emerald green
      } else if (dist < radius - 8) {
        // Inner badge background
        pr = 27; pg = 30; pb = 36;
        
        // Draw barbell icon
        // Barbell bar: horizontal line between cx - width*0.28 and cx + width*0.28, thickness width*0.04
        const barHalfW = width * 0.28;
        const barHalfH = width * 0.035;
        if (Math.abs(y - cy) <= barHalfH && Math.abs(x - cx) <= barHalfW) {
          pr = 240; pg = 240; pb = 245; // silver white
        }

        // Inner weights
        const plate1X = cx - width * 0.2;
        const plate1W = width * 0.04;
        const plate1H = width * 0.18;
        if (Math.abs(x - plate1X) <= plate1W && Math.abs(y - cy) <= plate1H) {
          pr = 16; pg = 185; pb = 129; // emerald weight
        }

        const plate2X = cx + width * 0.2;
        if (Math.abs(x - plate2X) <= plate1W && Math.abs(y - cy) <= plate1H) {
          pr = 16; pg = 185; pb = 129; // emerald weight
        }

        // Outer smaller weights
        const plateOut1X = cx - width * 0.26;
        const plateOutW = width * 0.03;
        const plateOutH = width * 0.12;
        if (Math.abs(x - plateOut1X) <= plateOutW && Math.abs(y - cy) <= plateOutH) {
          pr = 52; pg = 211; pb = 153; // light emerald
        }

        const plateOut2X = cx + width * 0.26;
        if (Math.abs(x - plateOut2X) <= plateOutW && Math.abs(y - cy) <= plateOutH) {
          pr = 52; pg = 211; pb = 153; // light emerald
        }
      }

      rawData[pos++] = pr;
      rawData[pos++] = pg;
      rawData[pos++] = pb;
      rawData[pos++] = 255;
    }
  }

  const idatCompressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatCompressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createSolidPng(192, 192, 18, 19, 22));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createSolidPng(512, 512, 18, 19, 22));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createSolidPng(180, 180, 18, 19, 22));
fs.writeFileSync(path.join(iconsDir, 'favicon.png'), createSolidPng(64, 64, 18, 19, 22));
console.log('Icons generated successfully!');
