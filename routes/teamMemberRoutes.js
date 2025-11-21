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
 * @swagger
 * tags:
 *   name: Team
 *   description: Управление командой
 */

/**
 * @swagger
 * /team-members:
 *   post:
 *     tags: [Team]
 *     summary: Создание нового члена команды
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - name
 *               - description
 *               - image
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [CHAIRMAN, DEPUTY_CHAIRMAN, SUPERVISOR]
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Член команды создан
 */
router.post('/', authenticateToken, upload.single('image'), TeamMemberController.createTeamMember);

/**
 * @swagger
 * /team-members:
 *   get:
 *     tags: [Team]
 *     summary: Получение всех членов команды
 *     responses:
 *       200:
 *         description: Список членов команды
 */
router.get('/', TeamMemberController.getAllTeamMembers);

/**
 * @swagger
 * /team-members/chairman:
 *   get:
 *     tags: [Team]
 *     summary: Получение председателя
 *     responses:
 *       200:
 *         description: Председатель найден
 *       404:
 *         description: Председатель не назначен
 */
router.get('/chairman', TeamMemberController.getChairman);

/**
 * @swagger
 * /team-members/deputy-chairman:
 *   get:
 *     tags: [Team]
 *     summary: Получение заместителя председателя
 *     responses:
 *       200:
 *         description: Заместитель найден
 *       404:
 *         description: Заместитель не назначен
 */
router.get('/deputy-chairman', TeamMemberController.getDeputyChairman);

/**
 * @swagger
 * /team-members/supervisors:
 *   get:
 *     tags: [Team]
 *     summary: Получение руководителей структурных подразделений
 *     responses:
 *       200:
 *         description: Список руководителей
 */
router.get('/supervisors', TeamMemberController.getSupervisors);

/**
 * @swagger
 * /team-members/{id}:
 *   get:
 *     tags: [Team]
 *     summary: Получение члена команды по ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Член команды найден
 */
router.get('/:id', TeamMemberController.getTeamMemberById);

/**
 * @swagger
 * /team-members/{id}:
 *   put:
 *     tags: [Team]
 *     summary: Обновление члена команды
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
 *               role:
 *                 type: string
 *                 enum: [CHAIRMAN, DEPUTY_CHAIRMAN, SUPERVISOR]
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Член команды обновлен
 */
router.put('/:id', authenticateToken, upload.single('image'), TeamMemberController.updateTeamMember);

/**
 * @swagger
 * /team-members/{id}:
 *   delete:
 *     tags: [Team]
 *     summary: Удаление члена команды
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
 *         description: Член команды удален
 */
router.delete('/:id', authenticateToken, TeamMemberController.deleteTeamMember);

module.exports = router;

