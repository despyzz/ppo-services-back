// Модуль для работы с проектами

let currentProjects = [];

// Инициализация модуля проектов
function initProjectsModule() {
    // Обработка формы добавления проекта
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', handleAddProject);
    }
}

// Добавление проекта
async function handleAddProject(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('projectTitle').value);
    formData.append('description', document.getElementById('projectDescription').value);
    formData.append('target', document.getElementById('projectTarget').value);
    formData.append('image', document.getElementById('projectImage').files[0]);

    try {
        const response = await AdminApp.apiRequest('/projects', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('projectsAlert', 'Проект успешно добавлен!', 'success');
            document.getElementById('projectForm').reset();
            loadProjects();
        } else {
            AdminApp.showAlert('projectsAlert', data.message || 'Ошибка добавления проекта', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('projectsAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Загрузка проектов
async function loadProjects() {
    try {
        const targetFilter = document.getElementById('targetFilter').value;
        let url = '/projects';
        if (targetFilter) {
            url += `?target=${targetFilter}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            currentProjects = data.projects;
            renderProjectsTable();
        } else {
            AdminApp.showAlert('projectsAlert', 'Ошибка загрузки проектов', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('projectsAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Отображение таблицы проектов
function renderProjectsTable() {
    const tbody = document.getElementById('projectsTableBody');
    
    if (currentProjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Проекты не найдены</td></tr>';
        return;
    }

    tbody.innerHTML = currentProjects.map(project => `
        <tr>
            <td>${project.id}</td>
            <td>${escapeHtml(project.title)}</td>
            <td><span class="status-badge status-${project.target.toLowerCase()}">${project.target}</span></td>
            <td>
                <img src="${project.image_src}" alt="${escapeHtml(project.title)}" 
                     style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px;">
            </td>
            <td>${AdminApp.formatDate(project.created_at)}</td>
            <td>
                <button onclick="editProject(${project.id})" class="btn" style="margin-right: 5px;">Редактировать</button>
                <button onclick="deleteProject(${project.id})" class="btn btn-danger">Удалить</button>
            </td>
        </tr>
    `).join('');
}

// Редактирование проекта
function editProject(id) {
    const project = currentProjects.find(p => p.id === id);
    if (!project) return;

    // Заполняем форму редактирования
    document.getElementById('editProjectId').value = project.id;
    document.getElementById('editProjectTitle').value = project.title;
    document.getElementById('editProjectDescription').value = project.description;
    document.getElementById('editProjectTarget').value = project.target;
    document.getElementById('editProjectImage').value = '';

    // Показываем текущее изображение
    const preview = document.getElementById('currentImagePreview');
    preview.innerHTML = `
        <p style="font-size: 12px; color: #666; margin-bottom: 5px;">Текущее изображение:</p>
        <img src="${project.image_src}" alt="${escapeHtml(project.title)}" 
             style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
    `;

    // Открываем модальное окно
    AdminApp.openModal('editProjectModal');
}

// Сохранение изменений проекта
async function saveProjectChanges() {
    const id = document.getElementById('editProjectId').value;
    const title = document.getElementById('editProjectTitle').value;
    const description = document.getElementById('editProjectDescription').value;
    const target = document.getElementById('editProjectTarget').value;
    const file = document.getElementById('editProjectImage').files[0];

    // Если выбран новый файл, отправляем через FormData
    if (file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('target', target);
        formData.append('image', file);

        try {
            const response = await AdminApp.apiRequest(`/projects/${id}`, {
                method: 'PUT',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                AdminApp.showAlert('projectsAlert', 'Проект успешно обновлен!', 'success');
                AdminApp.closeModal('editProjectModal');
                loadProjects();
            } else {
                AdminApp.showAlert('projectsAlert', data.message || 'Ошибка обновления проекта', 'error');
            }
        } catch (error) {
            AdminApp.showAlert('projectsAlert', 'Ошибка соединения с сервером', 'error');
        }
    } else {
        // Обновляем только метаданные без изображения
        try {
            const response = await AdminApp.apiRequest(`/projects/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description, target })
            });

            const data = await response.json();

            if (response.ok) {
                AdminApp.showAlert('projectsAlert', 'Проект успешно обновлен!', 'success');
                AdminApp.closeModal('editProjectModal');
                loadProjects();
            } else {
                AdminApp.showAlert('projectsAlert', data.message || 'Ошибка обновления проекта', 'error');
            }
        } catch (error) {
            AdminApp.showAlert('projectsAlert', 'Ошибка соединения с сервером', 'error');
        }
    }
}

// Удаление проекта
async function deleteProject(id) {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) {
        return;
    }

    try {
        const response = await AdminApp.apiRequest(`/projects/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('projectsAlert', 'Проект успешно удален!', 'success');
            loadProjects();
        } else {
            AdminApp.showAlert('projectsAlert', data.message || 'Ошибка удаления проекта', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('projectsAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Очистка фильтров
function clearFilters() {
    document.getElementById('targetFilter').value = '';
    loadProjects();
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
    initProjectsModule();
});

// Экспорт функций для глобального использования
window.loadProjects = loadProjects;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.saveProjectChanges = saveProjectChanges;
window.clearFilters = clearFilters;

