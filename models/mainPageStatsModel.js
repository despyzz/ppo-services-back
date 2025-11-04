const Database = require('better-sqlite3');
const path = require('path');

// Подключение к базе данных
const db = new Database(path.join(__dirname, '../db/database.sqlite'));

// Создание таблицы для единственного JSON-объекта статистики главной страницы
db.exec(`
  CREATE TABLE IF NOT EXISTS main_page_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    stats TEXT NOT NULL -- JSON string: { projectsCount, paymentsCount, choiceCount }
  )
`);

// Установка дефолтных значений, если записи нет
function initializeDefaults() {
  const exists = db.prepare('SELECT COUNT(*) as cnt FROM main_page_stats WHERE id = 1').get();
  if (!exists || exists.cnt === 0) {
    const defaultStats = {
      projectsCount: 0,
      paymentsCount: 0,
      choiceCount: 0
    };
    db.prepare('INSERT INTO main_page_stats (id, stats) VALUES (1, ?)')
      .run(JSON.stringify(defaultStats));
  }
}

initializeDefaults();

class MainPageStatsModel {
  static getStats() {
    const row = db.prepare('SELECT stats FROM main_page_stats WHERE id = 1').get();
    if (!row) {
      throw new Error('Статистика не найдена');
    }
    return JSON.parse(row.stats);
  }

  static updateStats(newStats) {
    // Валидация/заполнение полей
    const stats = this.getStats();
    const updatedStats = {
      projectsCount: typeof newStats.projectsCount === 'number' ? newStats.projectsCount : stats.projectsCount,
      paymentsCount: typeof newStats.paymentsCount === 'number' ? newStats.paymentsCount : stats.paymentsCount,
      choiceCount: typeof newStats.choiceCount === 'number' ? newStats.choiceCount : stats.choiceCount,
    };
    db.prepare('UPDATE main_page_stats SET stats = ? WHERE id = 1')
      .run(JSON.stringify(updatedStats));
    return this.getStats();
  }
}

module.exports = MainPageStatsModel;
