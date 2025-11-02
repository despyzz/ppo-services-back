const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/newsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../images');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Генерируем простое уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Создаем простое имя файла без кириллицы
    cb(null, 'image-' + uniqueSuffix + extension);
  }
});

// Фильтр для типов файлов - только изображения
const fileFilter = (req, file, cb) => {
  // Разрешенные типы файлов - только изображения
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла. Разрешены: JPG, PNG, GIF, WEBP'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Максимальный размер файла: 5MB
  }
});

/**
 * @route POST /news
 * @desc Создание новой новости
 * @access Private
 */
router.post('/', authenticateToken, upload.single('image'), NewsController.createNews);

/**
 * @route GET /news
 * @desc Получение всех новостей
 * @access Public
 */
router.get('/', NewsController.getAllNews);

/**
 * @route GET /news/:id
 * @desc Получение новости по ID
 * @access Public
 */
router.get('/:id', NewsController.getNewsById);

/**
 * @route PUT /news/:id
 * @desc Обновление новости
 * @access Private
 */
router.put('/:id', authenticateToken, upload.single('image'), NewsController.updateNews);

/**
 * @route DELETE /news/:id
 * @desc Удаление новости
 * @access Private
 */
router.delete('/:id', authenticateToken, NewsController.deleteNews);

module.exports = router;

