import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function run() {
    const filePath = path.join(__dirname, '../large_file.csv');
    console.log(`Preparing to upload: ${filePath}`);

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    try {
        const response = await axios.post('http://localhost:3000/upload', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': 'Bearer super-secret-key' // Default dev key
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        console.log('Upload Success:', response.data);
    } catch (error: any) {
        if (error.response) {
            console.error('Upload Failed status:', error.response.status);
            console.error('Upload Failed data:', error.response.data);
        } else {
            console.error('Upload Failed error:', error.message);
        }
    }
}

run();
