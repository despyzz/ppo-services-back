const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Авторизация
 */
/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Авторизация пользователя (логин)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *       401:
 *         description: Неверные данные
 */
/**
 * @route POST /auth/login
 * @desc Авторизация пользователя
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Получение информации о текущем пользователе
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *       401:
 *         description: Неавторизованный пользователь
 */
/**
 * @route GET /auth/me
 * @desc Получение информации о текущем пользователе
 * @access Private
 */
router.get('/me', authenticateToken, AuthController.getMe);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Выход из системы
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Выход выполнен
 */
router.post('/logout', authenticateToken, AuthController.logout);

module.exports = router;
