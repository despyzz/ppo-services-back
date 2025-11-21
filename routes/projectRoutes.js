const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
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
 *   name: Projects
 *   description: Управление проектами
 */

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Создание нового проекта
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
 *               - target
 *               - image
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               target:
 *                 type: string
 *                 enum: [EMPLOYEE, STUDENT]
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Проект создан
 */
router.post('/', authenticateToken, upload.single('image'), ProjectController.createProject);

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: Получение всех проектов
 *     parameters:
 *       - in: query
 *         name: target
 *         schema:
 *           type: string
 *           enum: [EMPLOYEE, STUDENT]
 *     responses:
 *       200:
 *         description: Список проектов
 */
router.get('/', ProjectController.getAllProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Получение проекта по ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Проект найден
 */
router.get('/:id', ProjectController.getProjectById);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Обновление проекта
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
 *               target:
 *                 type: string
 *                 enum: [EMPLOYEE, STUDENT]
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Проект обновлен
 */
router.put('/:id', authenticateToken, upload.single('image'), ProjectController.updateProject);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Удаление проекта
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
 *         description: Проект удален
 */
router.delete('/:id', authenticateToken, ProjectController.deleteProject);

module.exports = router;

