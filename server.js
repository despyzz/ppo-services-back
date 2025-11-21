const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const UserModel = require('./models/userModel');

// Создание экземпляра Express приложения
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // В продакшене указать конкретные домены
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование запросов
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Создание папки для документов, если она не существует
const documentsDir = path.join(__dirname, 'documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
  console.log('Создана папка для документов:', documentsDir);
}

// Создание папки для изображений, если она не существует
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('Создана папка для изображений:', imagesDir);
}

// Раздача статических файлов
app.use('/documents', express.static(path.join(__dirname, 'documents')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Импорт роутов
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const newsRoutes = require('./routes/newsRoutes');
const projectRoutes = require('./routes/projectRoutes');
const teamMemberRoutes = require('./routes/teamMemberRoutes');
const mainPageStatsRoutes = require('./routes/mainPageStatsRoutes');

// Подключение роутов
app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/categories', categoryRoutes);
app.use('/news', newsRoutes);
app.use('/projects', projectRoutes);
app.use('/team-members', teamMemberRoutes);
app.use('/main-page-stats', mainPageStatsRoutes);

// Главная страница - редирект на админ-панель
app.get('/', (req, res) => {
  res.redirect('/public/index.html');
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Файл слишком большой',
        message: 'Максимальный размер файла: 10MB'
      });
    }
  }
  
  if (error.message.includes('Неподдерживаемый тип файла')) {
    // Определяем тип ошибки - документ или изображение
    if (error.message.includes('JPG, PNG, GIF, WEBP')) {
      return res.status(400).json({
        error: 'Неподдерживаемый тип файла',
        message: 'Разрешены: JPG, PNG, GIF, WEBP'
      });
    }
    return res.status(400).json({
      error: 'Неподдерживаемый тип файла',
      message: 'Разрешены: PDF, DOC, DOCX, TXT, JPG, PNG, GIF'
    });
  }
  
  next(error);
});

// Обработка 404 ошибок
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    message: `Запрашиваемый маршрут ${req.originalUrl} не существует`
  });
});

// Глобальная обработка ошибок
app.use((error, req, res, next) => {
  console.error('Глобальная ошибка:', error);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: 'Произошла непредвиденная ошибка'
  });
});

// Инициализация базы данных и запуск сервера
async function startServer() {
  try {    
    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log('\n' + '--- 🖥️ Админ-панель ---\n');
      console.log(`  📁 Панель: http://localhost:${PORT}/public/index.html`);

      console.log('\n' + '--- 🛡️ Авторизация ---\n');
      console.log('   POST /auth/login            - Вход (логин)');
      console.log('   🔒 GET  /auth/me               - Текущий пользователь');

      console.log('\n' + '--- 📄 Документы ---\n');
      console.log('   🔒 POST   /documents            - Создать документ');
      console.log('   GET    /documents            - Получить все');
      console.log('   GET    /documents/:id        - Получить по ID');
      console.log('   🔒 PUT    /documents/:id        - Обновить');
      console.log('   🔒 DELETE /documents/:id        - Удалить');

      console.log('\n' + '--- 📖 Справочник ---\n');
      console.log('   🔒 POST   /categories               - Создать категорию');
      console.log('   GET    /categories               - Получить все категории');
      console.log('   GET    /categories/:id           - По ID');
      console.log('   🔒 PUT    /categories/:id           - Обновить');
      console.log('   🔒 DELETE /categories/:id           - Удалить категорию');
      console.log('   🔒 POST   /categories/:catId/items  - Добавить пункт');
      console.log('   🔒 PUT    /categories/:catId/items/:itemId    - Обновить пункт');
      console.log('   🔒 DELETE /categories/:catId/items/:itemId  - Удалить пункт');

      console.log('\n' + '--- 📰 Новости ---\n');
      console.log('   🔒 POST   /news              - Создать новость');
      console.log('   GET    /news              - Получить все');
      console.log('   GET    /news/:id          - По ID');
      console.log('   🔒 PUT    /news/:id          - Обновить');
      console.log('   🔒 DELETE /news/:id          - Удалить');

      console.log('\n' + '--- 🚀 Проекты ---\n');
      console.log('   🔒 POST   /projects          - Создать проект');
      console.log('   GET    /projects          - Получить все');
      console.log('   GET    /projects/:id      - По ID');
      console.log('   🔒 PUT    /projects/:id      - Обновить');
      console.log('   🔒 DELETE /projects/:id      - Удалить');

      console.log('\n' + '--- 👥Команда ---\n');
      console.log('   🔒 POST   /team-members                - Создать члена');
      console.log('   GET    /team-members                - Все члены');
      console.log('   GET    /team-members/chairman          - Только председатель');
      console.log('   GET    /team-members/deputy-chairman   - Только зам. председателя');
      console.log('   GET    /team-members/supervisors       - Руководители подразделений');
      console.log('   GET    /team-members/:id            - По ID');
      console.log('   🔒 PUT    /team-members/:id            - Обновить');
      console.log('   🔒 DELETE /team-members/:id            - Удалить');

      console.log('\n' + '--- 🏠 Главная ---\n');
      console.log('   GET    /main-page-stats        - Получить статистику');
      console.log('   🔒 PUT    /main-page-stats        - Обновить статистику');
    });
  } catch (error) {
    console.error('Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT. Завершение работы сервера...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM. Завершение работы сервера...');
  process.exit(0);
});

// Запуск сервера
startServer();
