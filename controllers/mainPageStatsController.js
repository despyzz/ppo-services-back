const MainPageStatsModel = require('../models/mainPageStatsModel');

class MainPageStatsController {
  // Получить stats
  static async getStats(req, res) {
    try {
      const stats = MainPageStatsModel.getStats();
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка получения данных', message: error.message });
    }
  }

  // Обновить stats
  static async updateStats(req, res) {
    try {
      const { projectsCount, paymentsCount, choiceCount } = req.body;
      // Все поля опциональны, но хотя бы одно должно быть числом
      if (
        typeof projectsCount !== 'number' &&
        typeof paymentsCount !== 'number' &&
        typeof choiceCount !== 'number'
      ) {
        return res.status(400).json({ error: 'Не указаны значения', message: 'Нужно указать хотя бы одно значение' });
      }
      const updated = MainPageStatsModel.updateStats({ projectsCount, paymentsCount, choiceCount });
      res.json({ success: true, stats: updated });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка обновления', message: error.message });
    }
  }
}

module.exports = MainPageStatsController;
