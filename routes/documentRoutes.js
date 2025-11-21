const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../documents');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Генерируем простое уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Создаем простое имя файла без кириллицы
    cb(null, 'document-' + uniqueSuffix + extension);
  }
});

// Фильтр для типов файлов
const fileFilter = (req, file, cb) => {
  // Разрешенные типы файлов
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла. Разрешены: PDF, DOC, DOCX, TXT, JPG, PNG, GIF'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Максимальный размер файла: 10MB
  }
});

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Управление документами
 */

/**
 * @swagger
 * /documents:
 *   post:
 *     tags: [Documents]
 *     summary: Создание нового документа
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
 *               - target
 *               - file
 *             properties:
 *               title:
 *                 type: string
 *               target:
 *                 type: string
 *                 enum: [EMPLOYEE, STUDENT]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Документ успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 */
router.post('/', authenticateToken, upload.single('file'), DocumentController.createDocument);

/**
 * @swagger
 * /documents:
 *   get:
 *     tags: [Documents]
 *     summary: Получение всех документов
 *     parameters:
 *       - in: query
 *         name: target
 *         schema:
 *           type: string
 *           enum: [EMPLOYEE, STUDENT]
 *         description: Фильтр по типу документа
 *     responses:
 *       200:
 *         description: Список документов
 */
router.get('/', DocumentController.getAllDocuments);

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Получение документа по ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Документ найден
 *       404:
 *         description: Документ не найден
 */
router.get('/:id', DocumentController.getDocumentById);

/**
 * @swagger
 * /documents/{id}:
 *   put:
 *     tags: [Documents]
 *     summary: Обновление документа
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
 *               target:
 *                 type: string
 *                 enum: [EMPLOYEE, STUDENT]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Документ обновлен
 *       401:
 *         description: Неавторизован
 */
router.put('/:id', authenticateToken, upload.single('file'), DocumentController.updateDocument);

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Удаление документа
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
 *         description: Документ удален
 *       401:
 *         description: Неавторизован
 */
router.delete('/:id', authenticateToken, DocumentController.deleteDocument);

module.exports = router;
