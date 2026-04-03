const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const galleryFile = path.join(dataDir, 'gallery.json');

function ensureStorage() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(galleryFile)) {
        fs.writeFileSync(galleryFile, '[]', 'utf-8');
    }
}

function readGallery() {
    ensureStorage();
    const raw = fs.readFileSync(galleryFile, 'utf-8');
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function writeGallery(items) {
    ensureStorage();
    fs.writeFileSync(galleryFile, JSON.stringify(items, null, 2), 'utf-8');
}

exports.getGalleryItems = (req, res) => {
    try {
        const items = readGallery().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(items);
    } catch (error) {
        console.error('Ошибка чтения галереи:', error);
        res.status(500).json({ error: 'Ошибка чтения галереи' });
    }
};

exports.createGalleryItem = (req, res) => {
    try {
        const { type, url, title } = req.body;

        if (!type || !url) {
            return res.status(400).json({ error: 'Поля type и url обязательны' });
        }

        if (!['image', 'video'].includes(type)) {
            return res.status(400).json({ error: 'type должен быть image или video' });
        }

        const items = readGallery();
        const newItem = {
            id: Date.now(),
            type,
            url,
            title: title || '',
            createdAt: new Date().toISOString()
        };

        items.push(newItem);
        writeGallery(items);

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Ошибка создания элемента галереи:', error);
        res.status(500).json({ error: 'Ошибка создания элемента галереи' });
    }
};

exports.deleteGalleryItem = (req, res) => {
    try {
        const id = Number(req.params.id);
        const items = readGallery();
        const nextItems = items.filter((item) => item.id !== id);

        if (nextItems.length === items.length) {
            return res.status(404).json({ error: 'Элемент галереи не найден' });
        }

        writeGallery(nextItems);
        res.json({ message: 'Элемент галереи удален' });
    } catch (error) {
        console.error('Ошибка удаления элемента галереи:', error);
        res.status(500).json({ error: 'Ошибка удаления элемента галереи' });
    }
};
