import fs from 'fs';
import path from 'path';

const TARGET_SIZE_MB = 100; // 100MB for quick test, can be increased to 500MB or 1GB
const FILE_PATH = path.join(__dirname, '../large_file.csv');

const stream = fs.createWriteStream(FILE_PATH);

console.log(`Generating CSV file of target size: ${TARGET_SIZE_MB}MB...`);

// Header
stream.write('sku,name,price\n');

let currentSize = 0;
let i = 0;

function write() {
    let ok = true;
    while (ok && currentSize < TARGET_SIZE_MB * 1024 * 1024) {
        const sku = `SKU-${i}`;
        const name = `Product Name ${i}`;
        const price = (Math.random() * 1000).toFixed(2);
        const row = `${sku},${name},${price}\n`;

        currentSize += Buffer.byteLength(row);
        i++;

        if (currentSize >= TARGET_SIZE_MB * 1024 * 1024) {
            stream.write(row, () => {
                console.log(`Done! generated ${i} rows.`);
                console.log(`File path: ${FILE_PATH}`);
                process.exit(0);
            });
            return;
        }

        ok = stream.write(row);
    }

    if (currentSize < TARGET_SIZE_MB * 1024 * 1024) {
        stream.once('drain', write);
    }
}

write();
