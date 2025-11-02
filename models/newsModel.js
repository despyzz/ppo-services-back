const Database = require('better-sqlite3');
const path = require('path');

// Подключение к базе данных
const db = new Database(path.join(__dirname, '../db/database.sqlite'));

// Создание таблицы новостей
db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    image_src TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

class NewsModel {
  // Создание новой новости
  static create(newsData) {
    try {
      const stmt = db.prepare(`
        INSERT INTO news (title, description, date, image_src) 
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        newsData.title,
        newsData.description,
        newsData.date,
        newsData.image_src
      );
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания новости: ${error.message}`);
    }
  }

  // Получение новости по ID
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM news WHERE id = ?');
    const news = stmt.get(id);
    
    if (news) {
      return {
        id: news.id,
        title: news.title,
        description: news.description,
        date: news.date,
        image_src: news.image_src,
        created_at: news.created_at,
        updated_at: news.updated_at
      };
    }
    return null;
  }

  // Получение всех новостей
  static getAll() {
    const stmt = db.prepare('SELECT * FROM news ORDER BY date DESC, created_at DESC');
    const newsList = stmt.all();
    
    return newsList.map(news => ({
      id: news.id,
      title: news.title,
      description: news.description,
      date: news.date,
      image_src: news.image_src,
      created_at: news.created_at,
      updated_at: news.updated_at
    }));
  }

  // Обновление новости
  static update(id, updateData) {
    try {
      const updateFields = [];
      const values = [];
      
      if (updateData.title) {
        updateFields.push('title = ?');
        values.push(updateData.title);
      }
      
      if (updateData.description !== undefined) {
        updateFields.push('description = ?');
        values.push(updateData.description);
      }
      
      if (updateData.date) {
        updateFields.push('date = ?');
        values.push(updateData.date);
      }
      
      if (updateData.image_src) {
        updateFields.push('image_src = ?');
        values.push(updateData.image_src);
      }
      
      if (updateFields.length === 0) {
        throw new Error('Нет данных для обновления');
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const stmt = db.prepare(`
        UPDATE news 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `);
      
      const result = stmt.run(...values);
      
      if (result.changes === 0) {
        throw new Error('Новость не найдена');
      }
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Ошибка обновления новости: ${error.message}`);
    }
  }

  // Удаление новости
  static delete(id) {
    try {
      const news = this.findById(id);
      if (!news) {
        throw new Error('Новость не найдена');
      }
      
      // Удаляем запись из базы данных
      const stmt = db.prepare('DELETE FROM news WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Новость не найдена');
      }
      
      return { success: true, message: 'Новость успешно удалена', image_src: news.image_src };
    } catch (error) {
      throw new Error(`Ошибка удаления новости: ${error.message}`);
    }
  }
}

module.exports = NewsModel;

