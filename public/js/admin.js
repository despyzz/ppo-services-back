// Общие функции для админ-панели

// Глобальные переменные
let authToken = localStorage.getItem('authToken');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Инициализация приложения
function initializeApp() {
    if (authToken) {
        showMainContent();
        loadUserInfo();
    } else {
        showAuthSection();
    }
}

// Показать секцию авторизации
function showAuthSection() {
    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');
    
    if (authSection) authSection.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('hidden');
}

// Показать основное содержимое
function showMainContent() {
    const authSection = document.getElementById('authSection');
    const mainContent = document.getElementById('mainContent');
    
    if (authSection) authSection.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
}

// Показать уведомление
function showAlert(containerId, message, type = 'info') {
    const alertContainer = document.getElementById(containerId);
    if (!alertContainer) return;
    
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Авторизация
async function login(username, password) {
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showMainContent();
            loadUserInfo();
            return { success: true, message: 'Авторизация успешна!' };
        } else {
            return { success: false, message: data.message || 'Ошибка авторизации' };
        }
    } catch (error) {
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

// Загрузка информации о пользователе
async function loadUserInfo() {
    try {
        const response = await fetch('/auth/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateUserInfo(data.user);
        }
    } catch (error) {
        console.error('Ошибка загрузки информации о пользователе:', error);
    }
}

// Обновление информации о пользователе в интерфейсе
function updateUserInfo(user) {
    const miniUser = document.getElementById('miniUser');
    if (miniUser)
        miniUser.textContent = user.username ? ('👤 '+user.username) : '👤';
    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(element => {
        element.textContent = `Добро пожаловать, ${user.username}!`;
    });
}

// Выход из системы
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    showAuthSection();
    showAlert('authAlert', 'Вы вышли из системы', 'info');
}

// Модальные окна
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Закрытие модального окна по клику на фон
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// Закрытие модального окна по Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            closeModal(openModal.id);
        }
    }
});

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU');
}

// Навигация
function navigateToPage(page) {
    // Удаляем активный класс со всех ссылок
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Добавляем активный класс к текущей ссылке
    const currentLink = document.querySelector(`[data-page="${page}"]`);
    if (currentLink) {
        currentLink.classList.add('active');
    }
    
    // Показываем соответствующую страницу
    document.querySelectorAll('.page').forEach(pageElement => {
        pageElement.classList.add('hidden');
    });
    
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
}

// API запросы с авто-logout при 401
async function apiRequest(url, options = {}) {
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        ...(options.headers || {})
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        logout();
        window.location.href = '/public/index.html';
        return response;
    }
    return response;
}

// Обработка ошибок API
function handleApiError(error, defaultMessage = 'Произошла ошибка') {
    console.error('API Error:', error);
    return {
        success: false,
        message: error.message || defaultMessage
    };
}

// Экспорт функций для использования в других модулях
window.AdminApp = {
    login,
    logout,
    showAlert,
    openModal,
    closeModal,
    formatFileSize,
    formatDate,
    navigateToPage,
    apiRequest,
    handleApiError,
    authToken: () => authToken
};

