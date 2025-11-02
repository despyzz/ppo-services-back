// Модуль для работы с командой

let currentMembers = [];

// Инициализация модуля команды
function initTeamModule() {
    // Обработка формы добавления члена команды
    const teamMemberForm = document.getElementById('teamMemberForm');
    if (teamMemberForm) {
        teamMemberForm.addEventListener('submit', handleAddMember);
    }
}

// Добавление члена команды
async function handleAddMember(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('memberName').value);
    formData.append('description', document.getElementById('memberDescription').value);
    formData.append('role', document.getElementById('memberRole').value);
    formData.append('image', document.getElementById('memberImage').files[0]);

    try {
        const response = await AdminApp.apiRequest('/team-members', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('teamAlert', 'Член команды успешно добавлен!', 'success');
            document.getElementById('teamMemberForm').reset();
            loadTeamMembers();
        } else {
            AdminApp.showAlert('teamAlert', data.message || 'Ошибка добавления члена команды', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('teamAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Загрузка членов команды
async function loadTeamMembers() {
    try {
        const response = await fetch('/team-members');
        const data = await response.json();

        if (response.ok) {
            currentMembers = data.members;
            renderTeamTable();
        } else {
            AdminApp.showAlert('teamAlert', 'Ошибка загрузки членов команды', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('teamAlert', 'Ошибка соединения с сервером', 'error');
    }
}

// Отображение таблицы членов команды
function renderTeamTable() {
    const tbody = document.getElementById('teamTableBody');
    
    if (currentMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Члены команды не найдены</td></tr>';
        return;
    }

    // Функция для получения названия роли
    function getRoleName(role) {
        const roles = {
            'CHAIRMAN': 'Председатель',
            'DEPUTY_CHAIRMAN': 'Заместитель председателя',
            'SUPERVISOR': 'Руководитель структурного подразделения'
        };
        return roles[role] || role;
    }

    // Функция для получения класса badge для роли
    function getRoleBadgeClass(role) {
        if (role === 'CHAIRMAN') return 'status-employee';
        if (role === 'DEPUTY_CHAIRMAN') return 'status-student';
        return 'status-employee'; // SUPERVISOR используем тот же стиль
    }

    tbody.innerHTML = currentMembers.map(member => `
        <tr>
            <td>${member.id}</td>
            <td>${escapeHtml(member.name)}</td>
            <td><span class="status-badge ${getRoleBadgeClass(member.role)}">${escapeHtml(getRoleName(member.role))}</span></td>
            <td>
                <img src="${member.image_src}" alt="${escapeHtml(member.name)}" 
                     style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px;">
            </td>
            <td>${AdminApp.formatDate(member.created_at)}</td>
            <td>
                <button onclick="editMember(${member.id})" class="btn" style="margin-right: 5px;">Редактировать</button>
                <button onclick="deleteMember(${member.id})" class="btn btn-danger">Удалить</button>
            </td>
        </tr>
    `).join('');
}

// Редактирование члена команды
function editMember(id) {
    const member = currentMembers.find(m => m.id === id);
    if (!member) return;

    // Заполняем форму редактирования
    document.getElementById('editMemberId').value = member.id;
    document.getElementById('editMemberName').value = member.name;
    document.getElementById('editMemberDescription').value = member.description;
    document.getElementById('editMemberRole').value = member.role;
    document.getElementById('editMemberImage').value = '';

    // Показываем текущее изображение
    const preview = document.getElementById('currentImagePreview');
    preview.innerHTML = `
        <p style="font-size: 12px; color: #666; margin-bottom: 5px;">Текущее изображение:</p>
        <img src="${member.image_src}" alt="${escapeHtml(member.name)}" 
             style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
    `;

    // Открываем модальное окно
    AdminApp.openModal('editMemberModal');
}

// Сохранение изменений члена команды
async function saveMemberChanges() {
    const id = document.getElementById('editMemberId').value;
    const name = document.getElementById('editMemberName').value;
    const description = document.getElementById('editMemberDescription').value;
    const role = document.getElementById('editMemberRole').value;
    const file = document.getElementById('editMemberImage').files[0];

    // Если выбран новый файл, отправляем через FormData
    if (file) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('role', role);
        formData.append('image', file);

        try {
            const response = await AdminApp.apiRequest(`/team-members/${id}`, {
                method: 'PUT',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                AdminApp.showAlert('teamAlert', 'Член команды успешно обновлен!', 'success');
                AdminApp.closeModal('editMemberModal');
                loadTeamMembers();
            } else {
                AdminApp.showAlert('teamAlert', data.message || 'Ошибка обновления члена команды', 'error');
            }
        } catch (error) {
            AdminApp.showAlert('teamAlert', 'Ошибка соединения с сервером', 'error');
        }
    } else {
        // Обновляем только метаданные без изображения
        try {
            const response = await AdminApp.apiRequest(`/team-members/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, role })
            });

            const data = await response.json();

            if (response.ok) {
                AdminApp.showAlert('teamAlert', 'Член команды успешно обновлен!', 'success');
                AdminApp.closeModal('editMemberModal');
                loadTeamMembers();
            } else {
                AdminApp.showAlert('teamAlert', data.message || 'Ошибка обновления члена команды', 'error');
            }
        } catch (error) {
            AdminApp.showAlert('teamAlert', 'Ошибка соединения с сервером', 'error');
        }
    }
}

// Удаление члена команды
async function deleteMember(id) {
    if (!confirm('Вы уверены, что хотите удалить этого члена команды?')) {
        return;
    }

    try {
        const response = await AdminApp.apiRequest(`/team-members/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            AdminApp.showAlert('teamAlert', 'Член команды успешно удален!', 'success');
            loadTeamMembers();
        } else {
            AdminApp.showAlert('teamAlert', data.message || 'Ошибка удаления члена команды', 'error');
        }
    } catch (error) {
        AdminApp.showAlert('teamAlert', 'Ошибка соединения с сервером', 'error');
    }
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
    initTeamModule();
});

// Экспорт функций для глобального использования
window.loadTeamMembers = loadTeamMembers;
window.editMember = editMember;
window.deleteMember = deleteMember;
window.saveMemberChanges = saveMemberChanges;

