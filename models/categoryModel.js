const Database = require('better-sqlite3');
const path = require('path');

// Подключение к базе данных
const db = new Database(path.join(__dirname, '../db/database.sqlite'));

// Создание таблицы категорий
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    target TEXT NOT NULL CHECK (target IN ('EMPLOYEE', 'STUDENT')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Создание таблицы пунктов справочника
db.exec(`
  CREATE TABLE IF NOT EXISTS dictionary_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  )
`);

class CategoryModel {
  // Создание новой категории
  static create(categoryData) {
    try {
      const stmt = db.prepare(`
        INSERT INTO categories (title, target) 
        VALUES (?, ?)
      `);
      
      const result = stmt.run(
        categoryData.title,
        categoryData.target
      );
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания категории: ${error.message}`);
    }
  }

  // Получение категории по ID с пунктами
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const category = stmt.get(id);
    
    if (!category) {
      return null;
    }

    // Получаем все пункты для этой категории
    const itemsStmt = db.prepare('SELECT * FROM dictionary_items WHERE category_id = ? ORDER BY id ASC');
    const items = itemsStmt.all(id);

    return {
      id: category.id,
      title: category.title,
      target: category.target,
      entries: items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description
      })),
      created_at: category.created_at,
      updated_at: category.updated_at
    };
  }

  // Получение всех категорий с фильтрацией
  static getAll(target = null) {
    let query = 'SELECT * FROM categories';
    let params = [];
    
    if (target) {
      query += ' WHERE target = ?';
      params.push(target);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const categories = stmt.all(...params);
    
    // Для каждой категории получаем пункты
    const itemsStmt = db.prepare('SELECT * FROM dictionary_items WHERE category_id = ? ORDER BY id ASC');
    
    return categories.map(category => {
      const items = itemsStmt.all(category.id);
      
      return {
        id: category.id,
        title: category.title,
        target: category.target,
        entries: items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description
        })),
        created_at: category.created_at,
        updated_at: category.updated_at
      };
    });
  }

  // Обновление категории
  static update(id, updateData) {
    try {
      const updateFields = [];
      const values = [];
      
      if (updateData.title) {
        updateFields.push('title = ?');
        values.push(updateData.title);
      }
      
      if (updateData.target) {
        updateFields.push('target = ?');
        values.push(updateData.target);
      }
      
      if (updateFields.length === 0) {
        throw new Error('Нет данных для обновления');
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const stmt = db.prepare(`
        UPDATE categories 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `);
      
      const result = stmt.run(...values);
      
      if (result.changes === 0) {
        throw new Error('Категория не найдена');
      }
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Ошибка обновления категории: ${error.message}`);
    }
  }

  // Удаление категории
  static delete(id) {
    try {
      const category = this.findById(id);
      if (!category) {
        throw new Error('Категория не найдена');
      }
      
      // Удаляем категорию (пункты удалятся автоматически из-за CASCADE)
      const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Категория не найдена');
      }
      
      return { success: true, message: 'Категория успешно удалена' };
    } catch (error) {
      throw new Error(`Ошибка удаления категории: ${error.message}`);
    }
  }

  // Добавление пункта в категорию
  static addItem(categoryId, itemData) {
    try {
      // Проверяем существование категории
      const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
      if (!category) {
        throw new Error('Категория не найдена');
      }

      const stmt = db.prepare(`
        INSERT INTO dictionary_items (category_id, title, description) 
        VALUES (?, ?, ?)
      `);
      
      const result = stmt.run(
        categoryId,
        itemData.title,
        itemData.description
      );
      
      return this.findItemById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка добавления пункта: ${error.message}`);
    }
  }

  // Получение пункта по ID
  static findItemById(id) {
    const stmt = db.prepare('SELECT * FROM dictionary_items WHERE id = ?');
    const item = stmt.get(id);
    
    if (item) {
      return {
        id: item.id,
        category_id: item.category_id,
        title: item.title,
        description: item.description,
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    }
    return null;
  }

  // Обновление пункта
  static updateItem(id, updateData) {
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
      
      if (updateFields.length === 0) {
        throw new Error('Нет данных для обновления');
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const stmt = db.prepare(`
        UPDATE dictionary_items 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `);
      
      const result = stmt.run(...values);
      
      if (result.changes === 0) {
        throw new Error('Пункт не найден');
      }
      
      return this.findItemById(id);
    } catch (error) {
      throw new Error(`Ошибка обновления пункта: ${error.message}`);
    }
  }

  // Удаление пункта
  static deleteItem(id) {
    try {
      const item = this.findItemById(id);
      if (!item) {
        throw new Error('Пункт не найден');
      }
      
      const stmt = db.prepare('DELETE FROM dictionary_items WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Пункт не найден');
      }
      
      return { success: true, message: 'Пункт успешно удален' };
    } catch (error) {
      throw new Error(`Ошибка удаления пункта: ${error.message}`);
    }
  }

  // Получение всех пунктов категории
  static getItemsByCategory(categoryId) {
    const stmt = db.prepare('SELECT * FROM dictionary_items WHERE category_id = ? ORDER BY id ASC');
    const items = stmt.all(categoryId);
    
    return items.map(item => ({
      id: item.id,
      category_id: item.category_id,
      title: item.title,
      description: item.description,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  }
}

module.exports = CategoryModel;

