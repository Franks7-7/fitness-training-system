// 纯 Node.js 生成 PWA 图标（无外部依赖）
const zlib = require('zlib');
const fs = require('fs');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function generateIcon(size, color1, color2, accent) {
  const rawData = Buffer.alloc(size * size * 3 + size); // +1 for filter byte per row

  for (let y = 0; y < size; y++) {
    rawData[y * (size * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const idx = y * (size * 3 + 1) + 1 + x * 3;

      // Create a dumbbell-like pattern
      const cx = size / 2, cy = size / 2;
      const r = size * 0.42;
      const barW = size * 0.08;
      const weightR = size * 0.14;
      const weightDist = size * 0.22;

      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background circle
      let inCircle = dist <= r;

      // Horizontal bar
      let inBar = Math.abs(dy) <= barW && Math.abs(dx) <= weightDist + weightR;

      // Left weight plate
      let inLeft = Math.sqrt((dx + weightDist) ** 2 + dy ** 2) <= weightR;
      let inLeft2 = Math.sqrt((dx + weightDist * 0.55) ** 2 + dy ** 2) <= weightR * 0.8;

      // Right weight plate
      let inRight = Math.sqrt((dx - weightDist) ** 2 + dy ** 2) <= weightR;
      let inRight2 = Math.sqrt((dx - weightDist * 0.55) ** 2 + dy ** 2) <= weightR * 0.8;

      if (inLeft || inRight || inLeft2 || inRight2) {
        // Accent color for weights
        rawData[idx] = accent[0]; rawData[idx + 1] = accent[1]; rawData[idx + 2] = accent[2];
      } else if (inBar) {
        // Lighter for bar
        rawData[idx] = color2[0]; rawData[idx + 1] = color2[1]; rawData[idx + 2] = color2[2];
      } else if (inCircle) {
        // Background
        rawData[idx] = color1[0]; rawData[idx + 1] = color1[1]; rawData[idx + 2] = color1[2];
      } else {
        // Transparent-like (white)
        rawData[idx] = 15; rawData[idx + 1] = 23; rawData[idx + 2] = 42;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // color type: RGB
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  const png = Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ]);

  return png;
}

// 颜色：深蓝背景 + 青色点缀（tailwind primary-600 风格）
const bg = [30, 41, 59];       // slate-800
const bar = [56, 189, 248];     // sky-400
const accent = [14, 165, 233];  // sky-500

fs.writeFileSync('public/icon-192.png', generateIcon(192, bg, bar, accent));
fs.writeFileSync('public/icon-512.png', generateIcon(512, bg, bar, accent));
console.log('✅ PWA icons generated: icon-192.png, icon-512.png');
