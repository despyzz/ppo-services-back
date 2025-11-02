const express = require('express');
const router = express.Router();
const TeamMemberController = require('../controllers/teamMemberController');
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
 * @route POST /team-members
 * @desc Создание нового члена команды
 * @access Private
 */
router.post('/', authenticateToken, upload.single('image'), TeamMemberController.createTeamMember);

/**
 * @route GET /team-members
 * @desc Получение всех членов команды
 * @access Public
 */
router.get('/', TeamMemberController.getAllTeamMembers);

/**
 * @route GET /team-members/chairman
 * @desc Получение председателя (только один)
 * @access Public
 */
router.get('/chairman', TeamMemberController.getChairman);

/**
 * @route GET /team-members/deputy-chairman
 * @desc Получение заместителя председателя (только один)
 * @access Public
 */
router.get('/deputy-chairman', TeamMemberController.getDeputyChairman);

/**
 * @route GET /team-members/supervisors
 * @desc Получение руководителей структурных подразделений
 * @access Public
 */
router.get('/supervisors', TeamMemberController.getSupervisors);

/**
 * @route GET /team-members/:id
 * @desc Получение члена команды по ID
 * @access Public
 */
router.get('/:id', TeamMemberController.getTeamMemberById);

/**
 * @route PUT /team-members/:id
 * @desc Обновление члена команды
 * @access Private
 */
router.put('/:id', authenticateToken, upload.single('image'), TeamMemberController.updateTeamMember);

/**
 * @route DELETE /team-members/:id
 * @desc Удаление члена команды
 * @access Private
 */
router.delete('/:id', authenticateToken, TeamMemberController.deleteTeamMember);

module.exports = router;

