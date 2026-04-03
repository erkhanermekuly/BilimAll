// Загрузка данных
let themesData = [];
let lecturesData = [];
let usersData = [];
let galleryData = [];

async function loadAdminData() {
    try {
        // Загрузка тем
        const themesResponse = await fetch('/api/themes');
        themesData = await themesResponse.json();
        
        // Загрузка пользователей
        const usersResponse = await fetch('/api/user/all', {
            credentials: 'include'
        });
        usersData = await usersResponse.json();

        // Загрузка галереи
        const galleryResponse = await fetch('/api/gallery', {
            credentials: 'include'
        });
        galleryData = await galleryResponse.json();
        
        // Подсчет статистики
        let totalLectures = 0;
        let totalTests = 0;
        
        themesData.forEach(theme => {
            if (theme.lectures) {
                totalLectures += theme.lectures.length;
                theme.lectures.forEach(lecture => {
                    if (lecture.tests) {
                        totalTests += lecture.tests.length;
                    }
                });
            }
        });

        // Обновление статистики
        document.getElementById('themes-count').textContent = themesData.length;
        document.getElementById('lectures-count').textContent = totalLectures;
        document.getElementById('tests-count').textContent = totalTests;
        document.getElementById('users-count').textContent = usersData.length;
        
        // Отображение списков
        renderThemes();
        renderLectures();
        renderTests();
        renderUsers();
        renderGallery();
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        document.getElementById('loading').textContent = 'Ошибка загрузки данных';
    }
}

function renderGallery() {
    const container = document.getElementById('gallery-list');
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(galleryData) || galleryData.length === 0) {
        container.innerHTML = '<div class="empty-state">Материалы галереи не добавлены</div>';
        return;
    }

    galleryData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        const mediaPreview = item.type === 'video'
            ? `<video src="${item.url}" style="width: 100%; max-height: 220px; border-radius: 6px;" controls></video>`
            : `<img src="${item.url}" alt="${item.title || 'Фото'}" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 6px;">`;

        card.innerHTML = `
            <div class="item-header">
                <div class="item-title">${item.title || (item.type === 'video' ? 'Видео' : 'Фото')}</div>
                <div class="item-actions">
                    <button class="action-button action-delete" onclick="deleteGalleryItem(${item.id})">🗑️ Удалить</button>
                </div>
            </div>
            <div class="item-meta">${item.type === 'video' ? 'Видео' : 'Фото'}</div>
            <div style="margin-top: 0.75rem;">${mediaPreview}</div>
        `;
        container.appendChild(card);
    });
}

async function uploadGalleryMedia() {
    const fileInput = document.getElementById('gallery-file');
    const titleInput = document.getElementById('gallery-title');
    const file = fileInput.files[0];
    const title = (titleInput.value || '').trim();

    if (!file) {
        alert('Выберите файл');
        return;
    }

    const isImage = (file.type || '').startsWith('image/');
    const type = isImage ? 'image' : 'video';
    const uploadUrl = isImage ? '/api/upload/image' : '/api/upload/video';
    const fieldName = isImage ? 'image' : 'video';

    try {
        const formData = new FormData();
        formData.append(fieldName, file);

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const uploadPayload = await uploadResponse.json();

        if (!uploadResponse.ok) {
            throw new Error(uploadPayload.error || 'Ошибка загрузки файла');
        }

        const mediaUrl = isImage ? uploadPayload.imagePath : uploadPayload.videoPath;

        const saveResponse = await fetch('/api/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ type, url: mediaUrl, title })
        });
        const savePayload = await saveResponse.json();

        if (!saveResponse.ok) {
            throw new Error(savePayload.error || 'Ошибка сохранения галереи');
        }

        fileInput.value = '';
        titleInput.value = '';
        alert('Материал добавлен в галерею');
        loadAdminData();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function deleteGalleryItem(id) {
    if (!confirm('Удалить этот материал из галереи?')) return;

    try {
        const response = await fetch(`/api/gallery/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || 'Ошибка удаления');
        }

        loadAdminData();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Отображение тем
function renderThemes() {
    const container = document.getElementById('themes-list');
    container.innerHTML = '';
    
    if (themesData.length === 0) {
        container.innerHTML = '<div class="empty-state">Темы не добавлены</div>';
        return;
    }
    
    themesData.forEach(theme => {
        const lecturesCount = theme.lectures ? theme.lectures.length : 0;
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-header">
                <div class="item-title">${theme.title}</div>
                <div class="item-actions">
                    <button class="action-button action-edit" onclick="editTheme(${theme.id})">✏️ Редактировать</button>
                    <button class="action-button action-delete" onclick="deleteTheme(${theme.id})">🗑️ Удалить</button>
                </div>
            </div>
            <div class="item-meta">Лекций: ${lecturesCount} | Порядок: ${theme.order}</div>
        `;
        container.appendChild(card);
    });
    
    // Обновление селекта лекций
    updateThemeSelect();
}

// Отображение лекций
function renderLectures() {
    const container = document.getElementById('lectures-list');
    container.innerHTML = '';
    
    lecturesData = [];
    themesData.forEach(theme => {
        if (theme.lectures) {
            lecturesData.push(...theme.lectures.map(l => ({...l, themeName: theme.title})));
        }
    });
    
    if (lecturesData.length === 0) {
        container.innerHTML = '<div class="empty-state">Лекции не добавлены</div>';
        return;
    }
    
    lecturesData.forEach(lecture => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-header">
                <div class="item-title">${lecture.title}</div>
                <div class="item-actions">
                    <button class="action-button action-edit" onclick="editLecture(${lecture.id})">✏️ Редактировать</button>
                    <button class="action-button action-delete" onclick="deleteLecture(${lecture.id})">🗑️ Удалить</button>
                </div>
            </div>
            <div class="item-meta">Тема: ${lecture.themeName} | Длительность: ${lecture.duration || 15} мин</div>
        `;
        container.appendChild(card);
    });
}

// Обновление селекта тем
function updateThemeSelect() {
    const select = document.getElementById('lecture-theme');
    select.innerHTML = '<option value="">-- Выберите тему --</option>';
    
    themesData.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = theme.title;
        select.appendChild(option);
    });
}

// Обработка загрузки изображения для темы
document.getElementById('theme-image-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Предпросмотр изображения
    const imagePreview = document.getElementById('image-preview');
    const imageImg = document.getElementById('image-preview-img');
    const reader = new FileReader();

    reader.onload = (event) => {
        imageImg.src = event.target.result;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Загрузка на сервер
    const formData = new FormData();
    formData.append('image', file);

    try {
        const uploadButton = e.target;
        uploadButton.disabled = true;
        uploadButton.style.opacity = '0.5';

        const response = await fetch('/api/upload/image', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('theme-image').value = data.imagePath;
            console.log('Изображение загружено:', data.imagePath);
        } else {
            const error = await response.json();
            alert('Ошибка загрузки изображения: ' + error.error);
        }
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        alert('Произошла ошибка при загрузке изображения');
    } finally {
        e.target.disabled = false;
        e.target.style.opacity = '1';
    }
});

// Модальные окна для темы
function openThemeModal() {
    document.getElementById('theme-modal-title').textContent = 'Добавить тему';
    document.getElementById('theme-form').reset();
    document.getElementById('theme-id').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('theme-modal').classList.add('active');
}

function closeThemeModal() {
    document.getElementById('theme-modal').classList.remove('active');
}

async function editTheme(id) {
    const theme = themesData.find(t => t.id === id);
    if (!theme) return;
    
    document.getElementById('theme-modal-title').textContent = 'Редактировать тему';
    document.getElementById('theme-id').value = theme.id;
    document.getElementById('theme-title').value = theme.title;
    document.getElementById('theme-description').value = theme.description || '';
    document.getElementById('theme-image').value = theme.image || '';
    document.getElementById('theme-order').value = theme.order || 0;
    
    document.getElementById('theme-modal').classList.add('active');
}

async function deleteTheme(id) {
    if (!confirm('Вы уверены, что хотите удалить эту тему? Все связанные лекции также будут удалены.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/themes/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Тема успешно удалена');
            loadAdminData();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.error);
        }
    } catch (error) {
        console.error('Ошибка удаления темы:', error);
        alert('Произошла ошибка при удалении темы');
    }
}

// Отправка формы темы
document.getElementById('theme-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('theme-id').value;
    const data = {
        title: document.getElementById('theme-title').value,
        description: document.getElementById('theme-description').value,
        image: document.getElementById('theme-image').value,
        order: parseInt(document.getElementById('theme-order').value)
    };
    
    try {
        const url = id ? `/api/themes/${id}` : '/api/themes';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert(id ? 'Тема успешно обновлена' : 'Тема успешно создана');
            closeThemeModal();
            loadAdminData();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.error);
        }
    } catch (error) {
        console.error('Ошибка сохранения темы:', error);
        alert('Произошла ошибка при сохранении темы');
    }
});

// Модальные окна для лекции
function openLectureModal() {
    document.getElementById('lecture-modal-title').textContent = 'Добавить лекцию';
    document.getElementById('lecture-form').reset();
    document.getElementById('lecture-id').value = '';
    document.getElementById('video-preview').style.display = 'none';
    document.getElementById('pdf-preview').style.display = 'none';
    document.getElementById('lecture-images-preview').style.display = 'none';
    document.getElementById('lecture-images-preview').innerHTML = '';
    document.getElementById('lecture-modal').classList.add('active');
}

function closeLectureModal() {
    document.getElementById('lecture-modal').classList.remove('active');
}

async function editLecture(id) {
    const lecture = lecturesData.find(l => l.id === id);
    if (!lecture) return;
    
    document.getElementById('lecture-modal-title').textContent = 'Редактировать лекцию';
    document.getElementById('lecture-id').value = lecture.id;
    document.getElementById('lecture-theme').value = lecture.themeId;
    document.getElementById('lecture-title').value = lecture.title;
    document.getElementById('lecture-content').value = lecture.content || '';
    document.getElementById('lecture-video').value = lecture.videoUrl || '';
    document.getElementById('lecture-duration').value = lecture.duration || 15;
    document.getElementById('lecture-order').value = lecture.order || 0;

    const currentMedia = lecture.videoUrl || '';
    const isPdf = currentMedia.toLowerCase().endsWith('.pdf');
    const videoPreview = document.getElementById('video-preview');
    const videoPlayer = document.getElementById('video-preview-player');
    const pdfPreview = document.getElementById('pdf-preview');
    const pdfFrame = document.getElementById('pdf-preview-frame');

    videoPreview.style.display = 'none';
    pdfPreview.style.display = 'none';

    if (currentMedia) {
        if (isPdf) {
            pdfFrame.src = currentMedia;
            pdfPreview.style.display = 'block';
        } else {
            videoPlayer.src = currentMedia;
            videoPreview.style.display = 'block';
        }
    }
    
    document.getElementById('lecture-modal').classList.add('active');
}

async function deleteLecture(id) {
    if (!confirm('Вы уверены, что хотите удалить эту лекцию?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/lectures/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Лекция успешно удалена');
            loadAdminData();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.error);
        }
    } catch (error) {
        console.error('Ошибка удаления лекции:', error);
        alert('Произошла ошибка при удалении лекции');
    }
}

async function uploadLectureImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload/image', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        const serverMessage = isJson
            ? (payload.error || payload.message || `HTTP ${response.status}`)
            : (String(payload || '').trim() || `HTTP ${response.status}`);
        throw new Error(serverMessage);
    }

    if (!payload.imagePath) {
        throw new Error('Сервер не вернул путь к изображению');
    }

    return payload.imagePath;
}

// Обработка загрузки фотографий лекции (вставка в Markdown контент)
document.getElementById('lecture-images-files').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const input = e.target;
    const contentField = document.getElementById('lecture-content');
    const preview = document.getElementById('lecture-images-preview');
    preview.style.display = 'grid';

    input.disabled = true;
    input.style.opacity = '0.5';

    try {
        for (const file of files) {
            const imagePath = await uploadLectureImage(file);
            const markdownLine = `\n![${file.name}](${imagePath})\n`;
            contentField.value = `${contentField.value}${markdownLine}`;

            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = file.name;
            img.style.cssText = 'width: 100%; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;';
            preview.appendChild(img);
        }
    } catch (error) {
        console.error('Ошибка загрузки фотографий лекции:', error);
        alert(`Ошибка загрузки фото: ${error.message || 'неизвестная ошибка'}`);
    } finally {
        input.disabled = false;
        input.style.opacity = '1';
        input.value = '';
    }
});

// Обработка загрузки видео или PDF
document.getElementById('lecture-video-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const videoPreview = document.getElementById('video-preview');
    const videoPlayer = document.getElementById('video-preview-player');
    const pdfPreview = document.getElementById('pdf-preview');
    const pdfFrame = document.getElementById('pdf-preview-frame');

    videoPreview.style.display = 'none';
    pdfPreview.style.display = 'none';

    if (isPdf) {
        pdfFrame.src = URL.createObjectURL(file);
        pdfPreview.style.display = 'block';
    } else {
        // Предпросмотр видео
        const reader = new FileReader();
        reader.onload = (event) => {
            videoPlayer.src = event.target.result;
            videoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    // Загрузка на сервер
    const formData = new FormData();
    formData.append(isPdf ? 'pdf' : 'video', file);

    try {
        const uploadButton = e.target;
        uploadButton.disabled = true;
        uploadButton.style.opacity = '0.5';

        const response = await fetch(isPdf ? '/api/upload/pdf' : '/api/upload/video', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const payload = isJson ? await response.json() : await response.text();

        if (!response.ok) {
            const serverMessage = isJson
                ? (payload.error || payload.message || `HTTP ${response.status}`)
                : (String(payload || '').trim() || `HTTP ${response.status}`);
            alert(`Ошибка загрузки ${isPdf ? 'PDF' : 'видео'}: ${serverMessage}`);
            return;
        }

        const mediaPath = isPdf ? payload.pdfPath : payload.videoPath;
        if (!mediaPath) {
            throw new Error('Сервер не вернул путь к загруженному файлу');
        }

        document.getElementById('lecture-video').value = mediaPath;
        console.log(isPdf ? 'PDF загружен:' : 'Видео загружено:', mediaPath);
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        alert(`Произошла ошибка при загрузке ${isPdf ? 'PDF' : 'видео'}: ${error.message || 'неизвестная ошибка'}`);
    } finally {
        e.target.disabled = false;
        e.target.style.opacity = '1';
    }
});

// Отправка формы лекции
document.getElementById('lecture-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('lecture-id').value;
    const themeId = document.getElementById('lecture-theme').value;
    
    if (!themeId) {
        alert('Выберите тему');
        return;
    }
    
    const data = {
        title: document.getElementById('lecture-title').value,
        content: document.getElementById('lecture-content').value,
        videoUrl: document.getElementById('lecture-video').value,
        duration: parseInt(document.getElementById('lecture-duration').value),
        order: parseInt(document.getElementById('lecture-order').value)
    };
    
    try {
        const url = id ? `/api/lectures/${id}` : `/api/themes/${themeId}/lectures`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert(id ? 'Лекция успешно обновлена' : 'Лекция успешно создана');
            closeLectureModal();
            loadAdminData();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.error);
        }
    } catch (error) {
        console.error('Ошибка сохранения лекции:', error);
        alert('Произошла ошибка при сохранении лекции');
    }
});

// Закрытие модальных окон по клику вне контента
document.getElementById('theme-modal').addEventListener('click', (e) => {
    if (e.target.id === 'theme-modal') {
        closeThemeModal();
    }
});

document.getElementById('lecture-modal').addEventListener('click', (e) => {
    if (e.target.id === 'lecture-modal') {
        closeLectureModal();
    }
});

// ==================== УПРАВЛЕНИЕ ТЕСТАМИ ====================

let testsData = [];

// Отображение тестов
function renderTests() {
    const container = document.getElementById('tests-list');
    container.innerHTML = '';
    
    // Собираем все тесты с информацией о лекции
    testsData = [];
    themesData.forEach(theme => {
        if (theme.lectures) {
            theme.lectures.forEach(lecture => {
                if (lecture.tests) {
                    lecture.tests.forEach(test => {
                        testsData.push({
                            ...test,
                            lectureName: lecture.title,
                            themeName: theme.title
                        });
                    });
                }
            });
        }
    });
    
    if (testsData.length === 0) {
        container.innerHTML = '<div class="empty-state">Тесты не добавлены</div>';
        return;
    }
    
    testsData.forEach(test => {
        const questionsCount = test.questions ? test.questions.length : 0;
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-header">
                <div class="item-title">${test.title}</div>
                <div class="item-actions">
                    <button class="action-button action-edit" onclick="editTest(${test.id})">✏️ Редактировать</button>
                    <button class="action-button action-delete" onclick="deleteTest(${test.id})">🗑️ Удалить</button>
                </div>
            </div>
            <div class="item-meta">
                Лекция: ${test.lectureName} | Тест ${test.testNumber} | 
                Вопросов: ${questionsCount} | Проходной балл: ${test.passingScore}%
            </div>
        `;
        container.appendChild(card);
    });
}

// Открыть модальное окно для добавления теста
function openTestModal() {
    document.getElementById('test-modal-title').textContent = 'Добавить тест';
    document.getElementById('test-form').reset();
    document.getElementById('test-id').value = '';
    document.getElementById('questions-container').innerHTML = '';
    
    // Обновить селект лекций
    updateLectureSelect();
    
    // Добавить первый пустой вопрос
    addQuestion();
    
    document.getElementById('test-modal').classList.add('active');
}

// Закрыть модальное окно для теста
function closeTestModal() {
    document.getElementById('test-modal').classList.remove('active');
}

// Обновить селект лекций
function updateLectureSelect() {
    const select = document.getElementById('test-lecture');
    select.innerHTML = '<option value="">-- Выберите лекцию --</option>';
    
    themesData.forEach(theme => {
        if (theme.lectures) {
            theme.lectures.forEach(lecture => {
                const option = document.createElement('option');
                option.value = lecture.id;
                option.textContent = `${theme.title} → ${lecture.title}`;
                select.appendChild(option);
            });
        }
    });
}

// Добавить новый вопрос в форму
function addQuestion() {
    const container = document.getElementById('questions-container');
    const questionIndex = container.children.length;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.style.cssText = `
        border: 1px solid #ddd; 
        border-radius: 6px; 
        padding: 1.5rem; 
        margin-bottom: 1rem;
        background: #f9f9f9;
    `;
    questionDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h5 style="margin: 0;">Вопрос ${questionIndex + 1}</h5>
            <button type="button" class="action-button action-delete" onclick="removeQuestion(${questionIndex})">
                ✕ Удалить вопрос
            </button>
        </div>
        
        <div class="form-group">
            <label>Текст вопроса *</label>
            <input type="text" class="question-text" placeholder="Введите текст вопроса" required>
        </div>
        
        <div class="form-group">
            <label>Тип вопроса</label>
            <select class="question-type" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px;">
                <option value="single">Один ответ</option>
                <option value="multiple">Несколько ответов</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Баллы за вопрос</label>
            <input type="number" class="question-points" value="1" min="1" required>
        </div>
        
        <div style="margin-top: 1rem; margin-bottom: 1rem;">
            <h6 style="margin: 0 0 0.5rem 0;">Ответы</h6>
            <div class="answers-container"></div>
            <button type="button" class="add-button" onclick="addAnswer(${questionIndex})" style="margin-top: 0.5rem;">
                ➕ Добавить ответ
            </button>
        </div>
    `;
    
    container.appendChild(questionDiv);
    
    // Добавить 2 пустых ответа по умолчанию
    addAnswer(questionIndex);
    addAnswer(questionIndex);
}

// Удалить вопрос
function removeQuestion(index) {
    const container = document.getElementById('questions-container');
    if (container.children[index]) {
        container.children[index].remove();
        
        // Переиндексировать оставшиеся вопросы
        Array.from(container.children).forEach((child, i) => {
            const h5 = child.querySelector('h5');
            if (h5) h5.textContent = `Вопрос ${i + 1}`;
            
            const deleteBtn = child.querySelector('.action-delete');
            if (deleteBtn) deleteBtn.onclick = () => removeQuestion(i);
        });
    }
}

// Добавить новый ответ для вопроса
function addAnswer(questionIndex) {
    const questions = document.getElementById('questions-container').children;
    if (!questions[questionIndex]) return;
    
    const answersContainer = questions[questionIndex].querySelector('.answers-container');
    const answerIndex = answersContainer.children.length;
    
    const answerDiv = document.createElement('div');
    answerDiv.style.cssText = `
        display: flex; 
        gap: 0.5rem; 
        margin-bottom: 0.75rem; 
        align-items: center;
        background: white;
        padding: 0.75rem;
        border-radius: 4px;
    `;
    answerDiv.innerHTML = `
        <input type="checkbox" class="answer-correct" title="Правильный ответ?">
        <input type="text" class="answer-text" placeholder="Текст ответа" style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" required>
        <button type="button" class="action-button action-delete" onclick="removeAnswer(${questionIndex}, ${answerIndex})" style="padding: 0.5rem 1rem;">
            ✕
        </button>
    `;
    
    answersContainer.appendChild(answerDiv);
}

// Удалить ответ
function removeAnswer(questionIndex, answerIndex) {
    const questions = document.getElementById('questions-container').children;
    if (!questions[questionIndex]) return;
    
    const answersContainer = questions[questionIndex].querySelector('.answers-container');
    if (answersContainer.children[answerIndex]) {
        answersContainer.children[answerIndex].remove();
    }
}

// Отредактировать тест
async function editTest(id) {
    const test = testsData.find(t => t.id === id);
    if (!test) return;
    
    document.getElementById('test-modal-title').textContent = 'Редактировать тест';
    document.getElementById('test-id').value = test.id;
    document.getElementById('test-lecture').value = test.lectureId;
    document.getElementById('test-title').value = test.title;
    document.getElementById('test-number').value = test.testNumber;
    document.getElementById('test-passing-score').value = test.passingScore;
    document.getElementById('test-time-limit').value = test.timeLimit || 30;
    
    // Очистить и заполнить вопросы
    document.getElementById('questions-container').innerHTML = '';
    
    if (test.questions && test.questions.length > 0) {
        test.questions.forEach((question, qIndex) => {
            addQuestion();
            
            const questions = document.getElementById('questions-container').children;
            const questionDiv = questions[qIndex];
            
            questionDiv.querySelector('.question-text').value = question.question;
            questionDiv.querySelector('.question-type').value = question.type || 'single';
            questionDiv.querySelector('.question-points').value = question.points || 1;
            
            // Очистить и заполнить ответы
            const answersContainer = questionDiv.querySelector('.answers-container');
            answersContainer.innerHTML = '';
            
            if (question.answers && question.answers.length > 0) {
                question.answers.forEach((answer, aIndex) => {
                    addAnswer(qIndex);
                    
                    const answerDiv = answersContainer.children[aIndex];
                    answerDiv.querySelector('.answer-correct').checked = answer.isCorrect;
                    answerDiv.querySelector('.answer-text').value = answer.answer;
                });
            }
        });
    } else {
        addQuestion();
    }
    
    document.getElementById('test-modal').classList.add('active');
}

// Удалить тест
async function deleteTest(id) {
    if (!confirm('Вы уверены, что хотите удалить этот тест с всеми вопросами и ответами?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/tests/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Тест успешно удален');
            loadAdminData();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.error);
        }
    } catch (error) {
        console.error('Ошибка удаления теста:', error);
        alert('Произошла ошибка при удалении теста');
    }
}

// Отправка формы теста
document.getElementById('test-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const testId = document.getElementById('test-id').value;
    const lectureId = document.getElementById('test-lecture').value;
    
    if (!lectureId) {
        alert('Выберите лекцию');
        return;
    }
    
    // Собрать данные вопросов и ответов
    const questions = [];
    const questionElements = document.getElementById('questions-container').children;
    
    Array.from(questionElements).forEach((questionDiv, qIndex) => {
        const questionText = questionDiv.querySelector('.question-text').value;
        const questionType = questionDiv.querySelector('.question-type').value;
        const questionPoints = parseInt(questionDiv.querySelector('.question-points').value);
        
        if (!questionText) {
            alert(`Заполните текст вопроса ${qIndex + 1}`);
            throw new Error('Empty question');
        }
        
        const answers = [];
        const answerDivs = questionDiv.querySelector('.answers-container').children;
        let hasCorrectAnswer = false;
        
        Array.from(answerDivs).forEach((answerDiv, aIndex) => {
            const answerText = answerDiv.querySelector('.answer-text').value;
            const isCorrect = answerDiv.querySelector('.answer-correct').checked;
            
            if (!answerText) {
                alert(`Заполните текст ответа ${aIndex + 1} вопроса ${qIndex + 1}`);
                throw new Error('Empty answer');
            }
            
            if (isCorrect) hasCorrectAnswer = true;
            
            answers.push({
                answer: answerText,
                isCorrect: isCorrect,
                order: aIndex
            });
        });
        
        if (!hasCorrectAnswer) {
            alert(`Отметьте хотя бы один правильный ответ для вопроса ${qIndex + 1}`);
            throw new Error('No correct answer');
        }
        
        questions.push({
            question: questionText,
            type: questionType,
            points: questionPoints,
            order: qIndex,
            answers: answers
        });
    });
    
    if (questions.length === 0) {
        alert('Добавьте хотя бы один вопрос');
        return;
    }
    
    const data = {
        title: document.getElementById('test-title').value,
        testNumber: parseInt(document.getElementById('test-number').value),
        passingScore: parseInt(document.getElementById('test-passing-score').value),
        timeLimit: parseInt(document.getElementById('test-time-limit').value),
        questions: questions
    };
    
    try {
        const url = testId ? `/api/tests/${testId}` : `/api/lectures/${lectureId}/tests`;
        const method = testId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert(testId ? 'Тест успешно обновлен' : 'Тест успешно создан');
            closeTestModal();
            loadAdminData();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.error);
        }
    } catch (error) {
        if (error.message === 'Empty question' || error.message === 'Empty answer' || error.message === 'No correct answer') {
            return;
        }
        console.error('Ошибка сохранения теста:', error);
        alert('Произошла ошибка при сохранении теста');
    }
});

// Закрытие модального окна по клику вне контента
document.getElementById('test-modal').addEventListener('click', (e) => {
    if (e.target.id === 'test-modal') {
        closeTestModal();
    }
});

// ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================

// Отображение пользователей
function renderUsers() {
    const container = document.getElementById('users-list');
    container.innerHTML = '';
    
    if (usersData.length === 0) {
        container.innerHTML = '<div class="empty-state">Пользователи не найдены</div>';
        return;
    }
    
    usersData.forEach(user => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        const roleText = user.role === 'admin' ? 'Админ' : 'Пользователь';
        
        const createdDate = new Date(user.createdAt).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        card.innerHTML = `
            <div class="item-header">
                <div class="item-title">${user.name}</div>
                <div class="item-actions">
                    ${user.role !== 'admin' ? `<button class="action-button action-delete" onclick="deleteUser(${user.id}, '${user.name}')">🗑️ Удалить</button>` : ''}
                </div>
            </div>
            <div class="item-meta" style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div>${user.email}</div>
                <div>${roleText}</div>
                <div>${createdDate}</div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Удалить пользователя
async function deleteUser(userId, userName) {
    if (!confirm(`Вы уверены, что хотите удалить пользователя "${userName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/user/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Пользователь успешно удален');
            loadAdminData();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.error);
        }
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        alert('Произошла ошибка при удалении пользователя');
    }
}

// Загрузка данных при открытии страницы
loadAdminData();
