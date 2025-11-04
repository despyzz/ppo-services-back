// Работа с данными главной страницы

// Загрузка информации
async function loadMainPageStats() {
    try {
        const response = await fetch('/main-page-stats');
        const data = await response.json();
        if (!response.ok || !data.stats) throw new Error(data.message || 'Ошибка получения данных');
        document.getElementById('projectsCount').value = data.stats.projectsCount;
        document.getElementById('paymentsCount').value = data.stats.paymentsCount;
        document.getElementById('choiceCount').value = data.stats.choiceCount;
    } catch (error) {
        AdminApp.showAlert('mainPageStatsAlert', error.message || 'Ошибка загрузки статистики', 'error');
    }
}

// Обновление информации
const form = document.getElementById('mainPageStatsForm');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const projectsCount = Number(document.getElementById('projectsCount').value);
        const paymentsCount = Number(document.getElementById('paymentsCount').value);
        const choiceCount = Number(document.getElementById('choiceCount').value);
        try {
            const response = await AdminApp.apiRequest('/main-page-stats', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projectsCount, paymentsCount, choiceCount })
            });
            const data = await response.json();
            if (response.ok) {
                AdminApp.showAlert('mainPageStatsAlert', 'Данные успешно сохранены!', 'success');
                loadMainPageStats();
            } else {
                AdminApp.showAlert('mainPageStatsAlert', data.message || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            AdminApp.showAlert('mainPageStatsAlert', 'Ошибка соединения с сервером', 'error');
        }
    });
}

// Экспорт для ручного вызова при необходимости
document.loadMainPageStats = loadMainPageStats;
