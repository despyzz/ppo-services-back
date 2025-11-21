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
 * @swagger
 * tags:
 *   name: News
 *   description: Управление новостями
 */

/**
 * @swagger
 * /news:
 *   post:
 *     tags: [News]
 *     summary: Создание новой новости
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Новость создана
 */
router.post('/', authenticateToken, upload.single('image'), NewsController.createNews);

/**
 * @swagger
 * /news:
 *   get:
 *     tags: [News]
 *     summary: Получение всех новостей
 *     responses:
 *       200:
 *         description: Список новостей
 */
router.get('/', NewsController.getAllNews);

/**
 * @swagger
 * /news/{id}:
 *   get:
 *     tags: [News]
 *     summary: Получение новости по ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Новость найдена
 */
router.get('/:id', NewsController.getNewsById);

/**
 * @swagger
 * /news/{id}:
 *   put:
 *     tags: [News]
 *     summary: Обновление новости
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Новость обновлена
 */
router.put('/:id', authenticateToken, upload.single('image'), NewsController.updateNews);

/**
 * @swagger
 * /news/{id}:
 *   delete:
 *     tags: [News]
 *     summary: Удаление новости
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Новость удалена
 */
router.delete('/:id', authenticateToken, NewsController.deleteNews);

module.exports = router;

