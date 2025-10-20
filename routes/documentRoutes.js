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
 * @route POST /documents
 * @desc Создание нового документа
 * @access Private
 */
router.post('/', authenticateToken, upload.single('file'), DocumentController.createDocument);

/**
 * @route GET /documents
 * @desc Получение всех документов с фильтрацией
 * @access Public
 */
router.get('/', DocumentController.getAllDocuments);

/**
 * @route GET /documents/:id
 * @desc Получение документа по ID
 * @access Public
 */
router.get('/:id', DocumentController.getDocumentById);

/**
 * @route PUT /documents/:id
 * @desc Обновление документа
 * @access Private
 */
router.put('/:id', authenticateToken, upload.single('file'), DocumentController.updateDocument);

/**
 * @route DELETE /documents/:id
 * @desc Удаление документа
 * @access Private
 */
router.delete('/:id', authenticateToken, DocumentController.deleteDocument);

module.exports = router;
