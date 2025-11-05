const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Подключение к базе данных
const db = new Database(path.join(__dirname, '../db/database.sqlite'));

// Создание таблицы пользователей
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

class UserModel {
  // Создание нового пользователя
  static async create(username, password) {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const stmt = db.prepare(`
        INSERT INTO users (username, password_hash) 
        VALUES (?, ?)
      `);
      
      const result = stmt.run(username, passwordHash);
      return { id: result.lastInsertRowid, username };
    } catch (error) {
      throw new Error(`Ошибка создания пользователя: ${error.message}`);
    }
  }

  // Поиск пользователя по username
  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  // Поиск пользователя по ID
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  // Проверка пароля
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Получение всех пользователей (для админки)
  static getAll() {
    const stmt = db.prepare('SELECT id, username, created_at FROM users ORDER BY created_at DESC');
    return stmt.all();
  }
}

module.exports = UserModel;
