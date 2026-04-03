async function loadGallery() {
    const grid = document.getElementById('gallery-grid');
    const empty = document.getElementById('gallery-empty');

    try {
        const response = await fetch('/api/gallery', { credentials: 'include' });
        const items = await response.json();

        grid.innerHTML = '';

        if (!Array.isArray(items) || items.length === 0) {
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';

        items.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'gallery-card';

            if (item.type === 'video') {
                card.innerHTML = `
                    <video controls preload="metadata">
                        <source src="${item.url}">
                    </video>
                    <div class="gallery-title">${item.title || 'Видео'}</div>
                `;
            } else {
                card.innerHTML = `
                    <img src="${item.url}" alt="${item.title || 'Фото'}">
                    <div class="gallery-title">${item.title || 'Фото'}</div>
                `;
            }

            grid.appendChild(card);
        });
    } catch (error) {
        grid.innerHTML = '<div class="gallery-empty">Ошибка загрузки галереи</div>';
    }
}

loadGallery();
