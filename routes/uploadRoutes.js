const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadVideo, uploadImage, uploadPdf } = require('../config/upload');
const { isAdminAPI } = require('../middleware/auth');

const handleUpload = (middleware, fieldName) => (req, res, next) => {
    middleware(req, res, (err) => {
        if (!err) return next();

        console.error(`Ошибка загрузки (${fieldName}):`, err);

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Файл слишком большой' });
            }
            return res.status(400).json({ error: err.message || 'Ошибка загрузки файла' });
        }

        return res.status(400).json({ error: err.message || `Некорректный файл для поля ${fieldName}` });
    });
};

router.post('/upload/video', isAdminAPI, handleUpload(uploadVideo.single('video'), 'video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const videoPath = '/uploads/videos/' + req.file.filename;
        
        res.json({
            success: true,
            videoPath: videoPath,
            message: 'Видео успешно загружено'
        });
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        res.status(500).json({ error: 'Ошибка загрузки видео' });
    }
});

router.post('/upload/image', isAdminAPI, handleUpload(uploadImage.single('image'), 'image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const imagePath = '/uploads/images/' + req.file.filename;
        
        res.json({
            success: true,
            imagePath: imagePath,
            message: 'Изображение успешно загружено'
        });
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        res.status(500).json({ error: 'Ошибка загрузки изображения' });
    }
});

router.post('/upload/pdf', isAdminAPI, handleUpload(uploadPdf.single('pdf'), 'pdf'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const pdfPath = '/uploads/pdfs/' + req.file.filename;

        res.json({
            success: true,
            pdfPath: pdfPath,
            message: 'PDF успешно загружен'
        });
    } catch (error) {
        console.error('Ошибка загрузки PDF:', error);
        res.status(500).json({ error: 'Ошибка загрузки PDF' });
    }
});

module.exports = router;
