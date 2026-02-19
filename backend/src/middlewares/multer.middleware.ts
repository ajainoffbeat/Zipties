import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/response/appError.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generic function to create image upload multer instance
const createImageUpload = (options: { maxFiles?: number; maxFileSize?: number; isPost?: boolean } = {}) => {
    const { maxFiles, maxFileSize = 5 * 1024 * 1024, isPost = false } = options;

    const storage = multer.memoryStorage();

    const fileFilter = (req: any, file: any, cb: any) => {
        if (isPost) {
            console.log('File filter called for:', file.originalname, 'mimetype:', file.mimetype, 'size:', file.size);
        }
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        const errorMsg = isPost
            ? 'Only image files (jpeg, jpg, png, webp, gif) are allowed for posts!'
            : 'Only image files (jpeg, jpg, png, webp, gif) are allowed!';
        cb(new AppError(400, errorMsg));
    };

    const limits: any = {
        fileSize: maxFileSize
    };
    if (maxFiles) {
        limits.files = maxFiles;
    }

    return multer({
        storage,
        fileFilter,
        limits
    });
};

export const upload = createImageUpload({ maxFileSize: 5 * 1024 * 1024 });

export const uploadPostImages = createImageUpload({ maxFiles: 5, maxFileSize: 2 * 1024 * 1024, isPost: true });
