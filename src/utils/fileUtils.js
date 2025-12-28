import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../../');

export const saveUploadedFile = (file, subdir = 'mirror') => {
    const timestamp = Math.floor(Date.now() / 1000);
    const uniqueFilename = `gen_${timestamp}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const uploadDir = path.join(ROOT_DIR, 'app/static/uploads', subdir);

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(savePath, file.buffer);

    return {
        filename: uniqueFilename,
        filepath: savePath,
        url: `/static/uploads/${subdir}/${uniqueFilename}`
    };
};

export const saveGeneratedImage = (buffer, originalFilename) => {
    console.log("DEBUG: Inside saveGeneratedImage, filename:", originalFilename);
    const timestamp = Math.floor(Date.now() / 1000);
    const genFilename = `gen_out_${timestamp}_${originalFilename}`; // Simple unique name
    const uploadDir = path.join(ROOT_DIR, 'app/static/uploads/mirror');

    const savePath = path.join(uploadDir, genFilename);
    fs.writeFileSync(savePath, buffer);

    const retUrl = `/static/uploads/mirror/${genFilename}`;
    console.log("DEBUG: saveGeneratedImage returning:", retUrl);
    return retUrl;
};
