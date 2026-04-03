const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаем папки для загрузки если их нет
const uploadDirs = {
    videos: path.join(__dirname, '../public/uploads/videos'),
    images: path.join(__dirname, '../public/uploads/images'),
    pdfs: path.join(__dirname, '../public/uploads/pdfs')
};

Object.values(uploadDirs).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Настройка хранилища для видео
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirs.videos);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Настройка хранилища для изображений
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirs.images);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Фильтр для видео
const videoFilter = (req, file, cb) => {
    const allowedTypes = /mp4|avi|mkv|mov|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Только видео файлы разрешены (mp4, avi, mkv, mov, webm)'));
    }
};

// Фильтр для изображений
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Только изображения разрешены (jpeg, jpg, png, gif, webp)'));
    }
};

// Middleware для загрузки видео
const uploadVideo = multer({
    storage: videoStorage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB максимум
    },
    fileFilter: videoFilter
});

// Middleware для загрузки изображений
const uploadImage = multer({
    storage: imageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB максимум
    },
    fileFilter: imageFilter
});

// Настройка хранилища для PDF
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirs.pdfs);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Фильтр для PDF
const pdfFilter = (req, file, cb) => {
    const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
    const mime = String(file.mimetype || '').toLowerCase();
    const isPdfMime = mime.includes('pdf') || mime === 'application/octet-stream' || mime === '';

    if (isPdfExt && isPdfMime) {
        return cb(null, true);
    } else {
        cb(new Error('Разрешены только PDF файлы'));
    }
};

// Middleware для загрузки PDF
const uploadPdf = multer({
    storage: pdfStorage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB максимум
    },
    fileFilter: pdfFilter
});

module.exports = {
    uploadVideo,
    uploadImage,
    uploadPdf
};
