const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const TABLE_COUNT = 20;
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

(async () => {
  for (let table = 1; table <= TABLE_COUNT; table++) {
    const url = `${BASE_URL}/menu?table=${table}`;
    const file = path.join(OUTPUT_DIR, `table-${String(table).padStart(2, '0')}.png`);
    await QRCode.toFile(file, url, {
      width: 400,
      margin: 2,
      color: { dark: '#3d1a00', light: '#ffffff' },
    });
    console.log(`Generated QR for Table ${table} → ${file}`);
  }
  console.log(`\nDone! ${TABLE_COUNT} QR codes saved to ${OUTPUT_DIR}`);
})();
