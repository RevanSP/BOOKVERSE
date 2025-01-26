import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Impor untuk mendapatkan __dirname di ES Module
import axios from 'axios';
import https from 'https';

// Mendapatkan __dirname di ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Membaca file JSON yang berisi data manhwa
const dataPath = path.join(__dirname, 'public/data/manhwa.json'); // Pastikan jalur ini benar
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Membuat folder untuk manhwa jika belum ada
const createFolder = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
};

// Fungsi untuk mendownload gambar dan menyimpannya ke dalam file lokal
const downloadImage = async (url, folderPath, fileName) => {
    try {
        // Membuat httpsAgent untuk mengabaikan verifikasi sertifikat SSL
        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await axios.get(url, { responseType: 'stream', httpsAgent: agent });
        const writer = fs.createWriteStream(path.join(folderPath, fileName));

        // Menyimpan stream data gambar ke dalam file lokal
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`Error mendownload gambar dari ${url}: ${err.message}`);
        throw err;
    }
};

// Fungsi utama untuk mendownload semua gambar dan membuat folder
const downloadManhwaImages = async () => {
    const newData = []; // Untuk menyimpan data manhwa yang sudah diperbarui

    // Proses download per manhwa
    for (const manhwa of data) {
        const titleFolder = path.join(__dirname, 'public', manhwa.title);

        // Membuat folder utama untuk title manhwa
        createFolder(titleFolder);

        // Menyimpan gambar utama (imageUrl)
        const imageUrl = manhwa.imageUrl;
        const imageName = path.basename(imageUrl);
        const imagePath = path.join(titleFolder, imageName);
        const downloadMainImage = downloadImage(imageUrl, titleFolder, imageName)
            .then(() => {
                // Update imageUrl di data manhwa menjadi path lokal setelah berhasil mendownload gambar utama
                manhwa.imageUrl = path.relative(__dirname, imagePath).replace(/\\/g, '/');
            });

        // Membuat folder untuk chapters dan mendownload gambar-gambar chapter
        const chaptersFolder = path.join(titleFolder, 'chapters');
        createFolder(chaptersFolder);

        const downloadChapterImages = manhwa.chapters.map(async (chapter) => {
            const chapterFolder = path.join(chaptersFolder, chapter.number.padStart(3, '0'));
            createFolder(chapterFolder);

            const chapterImages = chapter.images.map(async (imageUrl, index) => {
                const imageName = `${(index + 1).toString().padStart(3, '0')}.jpg`;
                const imagePath = path.join(chapterFolder, imageName);
                await downloadImage(imageUrl, chapterFolder, imageName);

                // Mengubah URL gambar menjadi path lokal
                chapterImages[index] = path.relative(__dirname, imagePath).replace(/\\/g, '/');
            });

            await Promise.all(chapterImages);
        });

        // Tunggu semua download gambar selesai untuk manhwa ini
        await Promise.all([downloadMainImage, ...downloadChapterImages]);

        // Menyimpan data manhwa yang sudah diperbarui ke dalam array baru
        newData.push(manhwa);
    }

    // Menulis ulang data ke dalam file manhwa-copy.json
    const outputPath = path.join(__dirname, 'manhwa-copy.json');
    fs.writeFileSync(outputPath, JSON.stringify(newData, null, 2));
    console.log('File manhwa-copy.json berhasil dibuat.');
};

// Menjalankan proses download
downloadManhwaImages().catch(console.error);