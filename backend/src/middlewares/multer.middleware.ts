import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/response/appError.js';
import fs from 'fs';

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

// Disk storage for post images
const postStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/posts');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        console.log('Destination:', uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        console.log('Filename:', file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const postFileFilter = (req: any, file: any, cb: any) => {
    console.log('File filter called for:', file.originalname, 'mimetype:', file.mimetype, 'size:', file.size);
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new AppError(400, 'Only image files (jpeg, jpg, png, webp, gif) are allowed for posts!'));
};

export const uploadPostImages = multer({
    storage: postStorage,
    fileFilter: postFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5 // Maximum 5 files per post
    }
});
