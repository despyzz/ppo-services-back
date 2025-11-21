const express = require('express');
const router = express.Router();
const MainPageStatsController = require('../controllers/mainPageStatsController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: MainPage
 *   description: Статистика главной страницы
 */

/**
 * @swagger
 * /main-page-stats:
 *   get:
 *     tags: [MainPage]
 *     summary: Получение статистики главной страницы
 *     responses:
 *       200:
 *         description: Статистика получена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     projectsCount:
 *                       type: number
 *                     paymentsCount:
 *                       type: number
 *                     choiceCount:
 *                       type: number
 */
router.get('/', MainPageStatsController.getStats);

/**
 * @swagger
 * /main-page-stats:
 *   put:
 *     tags: [MainPage]
 *     summary: Обновление статистики главной страницы
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectsCount:
 *                 type: number
 *               paymentsCount:
 *                 type: number
 *               choiceCount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Статистика обновлена
 */
router.put('/', authenticateToken, MainPageStatsController.updateStats);

module.exports = router;
