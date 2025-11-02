// Модуль для работы со справочником

let currentCategories = [];

// Инициализация модуля справочника
function initDictionaryModule() {
    // Обработка формы добавления категории
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleAddCategory);
    }
}

// Добавление категории
async function handleAddCategory(e) {
    e.preventDefault();
    
    const title = document.getElementById('categoryTitle').value;
    const target = document.getElementById('categoryTarget').value;

    try {
        const response = await AdminApp.apiRequest('/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, target })
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('dictionaryAlert', 'Категория успешно добавлена!', 'success');
            document.getElementById('categoryForm').reset();
            loadCategories();
        } else {
            AdminApp.showAlert('dictionaryAlert', data.message || 'Ошибка добавления категории', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('dictionaryAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Загрузка категорий
async function loadCategories() {
    try {
        const targetFilter = document.getElementById('targetFilter').value;
        let url = '/categories';
        if (targetFilter) {
            url += `?target=${targetFilter}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            currentCategories = data.categories;
            renderCategories();
        } else {
            AdminApp.showAlert('dictionaryAlert', 'Ошибка загрузки категорий', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('dictionaryAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Отображение категорий
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    
    if (currentCategories.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px;">Категории не найдены</div>';
        return;
    }

    container.innerHTML = currentCategories.map(category => `
        <div class="category-card" data-category-id="${category.id}">
            <div class="category-header">
                <div class="category-info">
                    <h3>${escapeHtml(category.title)}</h3>
                    <span class="status-badge status-${category.target.toLowerCase()}">${category.target}</span>
                </div>
                <div class="category-actions">
                    <button onclick="editCategory(${category.id})" class="btn">Редактировать</button>
                    <button onclick="addItemToCategory(${category.id})" class="btn btn-success">Добавить пункт</button>
                    <button onclick="deleteCategory(${category.id})" class="btn btn-danger">Удалить</button>
                </div>
            </div>
            <div class="category-items">
                <h4>Пункты справочника (${category.entries.length}):</h4>
                ${category.entries.length === 0 
                    ? '<p style="color: #999; padding: 10px;">Пункты отсутствуют</p>'
                    : category.entries.map(item => `
                        <div class="item-card">
                            <div class="item-header">
                                <strong>${escapeHtml(item.title)}</strong>
                                <div class="item-actions">
                                    <button onclick="editItem(${category.id}, ${item.id})" class="btn" style="padding: 5px 10px; font-size: 12px;">Редактировать</button>
                                    <button onclick="deleteItem(${category.id}, ${item.id})" class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;">Удалить</button>
                                </div>
                            </div>
                            <div class="item-description">${escapeHtml(item.description)}</div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `).join('');
}

// Редактирование категории
function editCategory(id) {
    const category = currentCategories.find(c => c.id === id);
    if (!category) return;

    // Заполняем форму редактирования
    document.getElementById('editCategoryId').value = category.id;
    document.getElementById('editCategoryTitle').value = category.title;
    document.getElementById('editCategoryTarget').value = category.target;

    // Открываем модальное окно
    AdminApp.openModal('editCategoryModal');
}

// Сохранение изменений категории
async function saveCategoryChanges() {
    const id = document.getElementById('editCategoryId').value;
    const title = document.getElementById('editCategoryTitle').value;
    const target = document.getElementById('editCategoryTarget').value;

    try {
        const response = await AdminApp.apiRequest(`/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, target })
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('dictionaryAlert', 'Категория успешно обновлена!', 'success');
            AdminApp.closeModal('editCategoryModal');
            loadCategories();
        } else {
            AdminApp.showAlert('dictionaryAlert', data.message || 'Ошибка обновления категории', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('dictionaryAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Удаление категории
async function deleteCategory(id) {
    if (!confirm('Вы уверены, что хотите удалить эту категорию? Все пункты в ней также будут удалены.')) {
        return;
    }

    try {
        const response = await AdminApp.apiRequest(`/categories/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('dictionaryAlert', 'Категория успешно удалена!', 'success');
            loadCategories();
        } else {
            AdminApp.showAlert('dictionaryAlert', data.message || 'Ошибка удаления категории', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('dictionaryAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Добавление пункта в категорию
function addItemToCategory(categoryId) {
    document.getElementById('addItemCategoryId').value = categoryId;
    document.getElementById('itemTitle').value = '';
    document.getElementById('itemDescription').value = '';
    AdminApp.openModal('addItemModal');
}

// Сохранение нового пункта
async function saveNewItem() {
    const categoryId = document.getElementById('addItemCategoryId').value;
    const title = document.getElementById('itemTitle').value;
    const description = document.getElementById('itemDescription').value;

    try {
        const response = await AdminApp.apiRequest(`/categories/${categoryId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('dictionaryAlert', 'Пункт успешно добавлен!', 'success');
            AdminApp.closeModal('addItemModal');
            loadCategories();
        } else {
            AdminApp.showAlert('dictionaryAlert', data.message || 'Ошибка добавления пункта', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('dictionaryAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Редактирование пункта
function editItem(categoryId, itemId) {
    const category = currentCategories.find(c => c.id === parseInt(categoryId));
    if (!category) return;

    const item = category.entries.find(e => e.id === itemId);
    if (!item) return;

    // Заполняем форму редактирования
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemCategoryId').value = categoryId;
    document.getElementById('editItemTitle').value = item.title;
    document.getElementById('editItemDescription').value = item.description;

    // Открываем модальное окно
    AdminApp.openModal('editItemModal');
}

// Сохранение изменений пункта
async function saveItemChanges() {
    const categoryId = document.getElementById('editItemCategoryId').value;
    const itemId = document.getElementById('editItemId').value;
    const title = document.getElementById('editItemTitle').value;
    const description = document.getElementById('editItemDescription').value;

    try {
        const response = await AdminApp.apiRequest(`/categories/${categoryId}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('dictionaryAlert', 'Пункт успешно обновлен!', 'success');
            AdminApp.closeModal('editItemModal');
            loadCategories();
        } else {
            AdminApp.showAlert('dictionaryAlert', data.message || 'Ошибка обновления пункта', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('dictionaryAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Удаление пункта
async function deleteItem(categoryId, itemId) {
    if (!confirm('Вы уверены, что хотите удалить этот пункт?')) {
        return;
    }

    try {
        const response = await AdminApp.apiRequest(`/categories/${categoryId}/items/${itemId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('dictionaryAlert', 'Пункт успешно удален!', 'success');
            loadCategories();
        } else {
            AdminApp.showAlert('dictionaryAlert', data.message || 'Ошибка удаления пункта', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('dictionaryAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Очистка фильтров
function clearFilters() {
    document.getElementById('targetFilter').value = '';
    loadCategories();
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
    initDictionaryModule();
});

// Экспорт функций для глобального использования
window.loadCategories = loadCategories;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.saveCategoryChanges = saveCategoryChanges;
window.addItemToCategory = addItemToCategory;
window.saveNewItem = saveNewItem;
window.editItem = editItem;
window.saveItemChanges = saveItemChanges;
window.deleteItem = deleteItem;
window.clearFilters = clearFilters;

