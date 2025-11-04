const express = require('express');
const router = express.Router();
const MainPageStatsController = require('../controllers/mainPageStatsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Получить stats (public)
router.get('/', MainPageStatsController.getStats);
// Изменить stats (private)
router.put('/', authenticateToken, MainPageStatsController.updateStats);

module.exports = router;
