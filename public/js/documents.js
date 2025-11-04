// Модуль для работы с документами

let currentDocuments = [];

// Инициализация модуля документов
function initDocumentsModule() {
    // Обработка формы добавления документа
    const documentForm = document.getElementById('documentForm');
    if (documentForm) {
        documentForm.addEventListener('submit', handleAddDocument);
    }
}

// Добавление документа
async function handleAddDocument(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('docTitle').value);
    formData.append('target', document.getElementById('docTarget').value);
    formData.append('file', document.getElementById('docFile').files[0]);

    try {
        const response = await AdminApp.apiRequest('/documents', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('documentsAlert', 'Документ успешно добавлен!', 'success');
            document.getElementById('documentForm').reset();
            loadDocuments();
        } else {
            AdminApp.showAlert('documentsAlert', data.message || 'Ошибка добавления документа', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('documentsAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Загрузка документов
async function loadDocuments() {
    try {
        const targetFilter = document.getElementById('targetFilter').value;
        let url = '/documents';
        if (targetFilter) {
            url += `?target=${targetFilter}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            currentDocuments = data.documents;
            renderDocumentsTable();
        } else {
            AdminApp.showAlert('documentsAlert', 'Ошибка загрузки документов', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('documentsAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Отображение таблицы документов
function renderDocumentsTable() {
    const tbody = document.getElementById('documentsTableBody');
    
    if (currentDocuments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Документы не найдены</td></tr>';
        return;
    }

    tbody.innerHTML = currentDocuments.map(doc => `
        <tr>
            <td>${doc.id}</td>
            <td>${escapeHtml(doc.title)}</td>
            <td><span class="status-badge status-${doc.target.toLowerCase()}">${doc.target}</span></td>
            <td><a href="${doc.file.url}" target="_blank" class="file-link">${escapeHtml(doc.file.name)}</a></td>
            <td>${AdminApp.formatFileSize(doc.file.size)}</td>
            <td>${AdminApp.formatDate(doc.created_at)}</td>
            <td>
                <button onclick="editDocument(${doc.id})" class="btn" style="margin-right: 5px;">Редактировать</button>
                <button onclick="deleteDocument(${doc.id})" class="btn btn-danger">Удалить</button>
            </td>
        </tr>
    `).join('');
}

// Редактирование документа
function editDocument(id) {
    const doc = currentDocuments.find(d => d.id === id);
    if (!doc) return;

    // Заполняем форму редактирования
    document.getElementById('editDocumentId').value = doc.id;
    document.getElementById('editDocumentTitle').value = doc.title;
    document.getElementById('editDocumentTarget').value = doc.target;
    document.getElementById('editDocumentFile').value = '';

    // Открываем модальное окно
    AdminApp.openModal('editDocumentModal');
}

// Сохранение изменений документа
async function saveDocumentChanges() {
    const id = document.getElementById('editDocumentId').value;
    const title = document.getElementById('editDocumentTitle').value;
    const target = document.getElementById('editDocumentTarget').value;
    const file = document.getElementById('editDocumentFile').files[0];

    const updateData = { title, target };

    // Если выбран новый файл, добавляем его
    if (file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('target', target);
        formData.append('file', file);

        try {
            const response = await AdminApp.apiRequest(`/documents/${id}`, {
                method: 'PUT',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                AdminApp.showAlert('documentsAlert', 'Документ успешно обновлен!', 'success');
                AdminApp.closeModal('editDocumentModal');
                loadDocuments();
            } else {
                AdminApp.showAlert('documentsAlert', data.message || 'Ошибка обновления документа', 'error');
            }
        } catch (error) {
            AdminApp.showAlert('documentsAlert', 'Ошибка соединения с сервером', 'error');
        }
    } else {
        // Обновляем только метаданные
        try {
            const response = await AdminApp.apiRequest(`/documents/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                AdminApp.showAlert('documentsAlert', 'Документ успешно обновлен!', 'success');
                AdminApp.closeModal('editDocumentModal');
                loadDocuments();
            } else {
                AdminApp.showAlert('documentsAlert', data.message || 'Ошибка обновления документа', 'error');
            }
        } catch (error) {
            AdminApp.showAlert('documentsAlert', 'Ошибка соединения с сервером', 'error');
        }
    }
}

// Удаление документа
async function deleteDocument(id) {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) {
        return;
    }

    try {
        const response = await AdminApp.apiRequest(`/documents/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('documentsAlert', 'Документ успешно удален!', 'success');
            loadDocuments();
        } else {
            AdminApp.showAlert('documentsAlert', data.message || 'Ошибка удаления документа', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('documentsAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Очистка фильтров
function clearFilters() {
    document.getElementById('targetFilter').value = '';
    loadDocuments();
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initDocumentsModule();
});

// Экспорт функций для глобального использования
window.loadDocuments = loadDocuments;
window.editDocument = editDocument;
window.deleteDocument = deleteDocument;
window.saveDocumentChanges = saveDocumentChanges;
window.clearFilters = clearFilters;

