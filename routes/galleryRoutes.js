const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { isAdminAPI } = require('../middleware/auth');

router.get('/gallery', galleryController.getGalleryItems);
router.post('/gallery', isAdminAPI, galleryController.createGalleryItem);
router.delete('/gallery/:id', isAdminAPI, galleryController.deleteGalleryItem);

module.exports = router;
