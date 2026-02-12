import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/response/appError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new AppError(400, 'Only image files (jpeg, jpg, png, webp, gif) are allowed!'));
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
