const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route POST /auth/login
 * @desc Авторизация пользователя
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @route GET /auth/me
 * @desc Получение информации о текущем пользователе
 * @access Private
 */
router.get('/me', authenticateToken, AuthController.getMe);

/**
 * @route POST /auth/logout
 * @desc Выход из системы
 * @access Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

module.exports = router;
