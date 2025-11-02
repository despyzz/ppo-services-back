// Модуль для работы с новостями

let currentNews = [];

// Инициализация модуля новостей
function initNewsModule() {
    // Обработка формы добавления новости
    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
        newsForm.addEventListener('submit', handleAddNews);
    }
}

// Добавление новости
async function handleAddNews(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('newsTitle').value);
    formData.append('description', document.getElementById('newsDescription').value);
    formData.append('date', document.getElementById('newsDate').value);
    formData.append('image', document.getElementById('newsImage').files[0]);

    try {
        const response = await AdminApp.apiRequest('/news', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('newsAlert', 'Новость успешно добавлена!', 'success');
            document.getElementById('newsForm').reset();
            loadNews();
        } else {
            AdminApp.showAlert('newsAlert', data.message || 'Ошибка добавления новости', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('newsAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Загрузка новостей
async function loadNews() {
    try {
        const response = await fetch('/news');
        const data = await response.json();

        if (response.ok) {
            currentNews = data.news;
            renderNewsTable();
        } else {
            AdminApp.showAlert('newsAlert', 'Ошибка загрузки новостей', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('newsAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Отображение таблицы новостей
function renderNewsTable() {
    const tbody = document.getElementById('newsTableBody');
    
    if (currentNews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Новости не найдены</td></tr>';
        return;
    }

    tbody.innerHTML = currentNews.map(news => `
        <tr>
            <td>${news.id}</td>
            <td>${escapeHtml(news.title)}</td>
            <td>${formatDate(news.date)}</td>
            <td>
                <img src="${news.image_src}" alt="${escapeHtml(news.title)}" 
                     style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px;">
            </td>
            <td>${AdminApp.formatDate(news.created_at)}</td>
            <td>
                <button onclick="editNews(${news.id})" class="btn" style="margin-right: 5px;">Редактировать</button>
                <button onclick="deleteNews(${news.id})" class="btn btn-danger">Удалить</button>
            </td>
        </tr>
    `).join('');
}

// Редактирование новости
function editNews(id) {
    const news = currentNews.find(n => n.id === id);
    if (!news) return;

    // Заполняем форму редактирования
    document.getElementById('editNewsId').value = news.id;
    document.getElementById('editNewsTitle').value = news.title;
    document.getElementById('editNewsDescription').value = news.description;
    document.getElementById('editNewsDate').value = news.date;
    document.getElementById('editNewsImage').value = '';

    // Показываем текущее изображение
    const preview = document.getElementById('currentImagePreview');
    preview.innerHTML = `
        <p style="font-size: 12px; color: #666; margin-bottom: 5px;">Текущее изображение:</p>
        <img src="${news.image_src}" alt="${escapeHtml(news.title)}" 
             style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
    `;

    // Открываем модальное окно
    AdminApp.openModal('editNewsModal');
}

// Сохранение изменений новости
async function saveNewsChanges() {
    const id = document.getElementById('editNewsId').value;
    const title = document.getElementById('editNewsTitle').value;
    const description = document.getElementById('editNewsDescription').value;
    const date = document.getElementById('editNewsDate').value;
    const file = document.getElementById('editNewsImage').files[0];

    // Если выбран новый файл, отправляем через FormData
    if (file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('date', date);
        formData.append('image', file);

        try {
            const response = await AdminApp.apiRequest(`/news/${id}`, {
                method: 'PUT',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                AdminApp.showAlert('newsAlert', 'Новость успешно обновлена!', 'success');
                AdminApp.closeModal('editNewsModal');
                loadNews();
            } else {
                AdminApp.showAlert('newsAlert', data.message || 'Ошибка обновления новости', 'error');
            }
        } catch (error) {
            AdminApp.showAlert('newsAlert', 'Ошибка соединения с сервером', 'error');
        }
    } else {
        // Обновляем только метаданные без изображения
        try {
            const response = await AdminApp.apiRequest(`/news/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description, date })
            });

            const data = await response.json();

            if (response.ok) {
                AdminApp.showAlert('newsAlert', 'Новость успешно обновлена!', 'success');
                AdminApp.closeModal('editNewsModal');
                loadNews();
            } else {
                AdminApp.showAlert('newsAlert', data.message || 'Ошибка обновления новости', 'error');
            }
        } catch (error) {
            AdminApp.showAlert('newsAlert', 'Ошибка соединения с сервером', 'error');
        }
    }
}

// Удаление новости
async function deleteNews(id) {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) {
        return;
    }

    try {
        const response = await AdminApp.apiRequest(`/news/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('newsAlert', 'Новость успешно удалена!', 'success');
            loadNews();
        } else {
            AdminApp.showAlert('newsAlert', data.message || 'Ошибка удаления новости', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('newsAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Форматирование даты (только дата без времени)
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initNewsModule();
});

// Экспорт функций для глобального использования
window.loadNews = loadNews;
window.editNews = editNews;
window.deleteNews = deleteNews;
window.saveNewsChanges = saveNewsChanges;

