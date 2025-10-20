const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Подключение к базе данных
const db = new Database(path.join(__dirname, '../db/database.sqlite'));

// Создание таблицы документов
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    target TEXT NOT NULL CHECK (target IN ('EMPLOYEE', 'STUDENT')),
    file_name TEXT NOT NULL,
    file_mime_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

class DocumentModel {
  // Создание нового документа
  static create(documentData) {
    try {
      const stmt = db.prepare(`
        INSERT INTO documents (title, target, file_name, file_mime_type, file_url, file_size) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        documentData.title,
        documentData.target,
        documentData.file.name,
        documentData.file.mime_type,
        documentData.file.url,
        documentData.file.size
      );
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания документа: ${error.message}`);
    }
  }

  // Получение документа по ID
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const doc = stmt.get(id);
    
    if (doc) {
      return {
        id: doc.id,
        title: doc.title,
        target: doc.target,
        file: {
          name: doc.file_name,
          mime_type: doc.file_mime_type,
          url: doc.file_url,
          size: doc.file_size
        },
        created_at: doc.created_at,
        updated_at: doc.updated_at
      };
    }
    return null;
  }

  // Получение всех документов с фильтрацией
  static getAll(target = null) {
    let query = 'SELECT * FROM documents';
    let params = [];
    
    if (target) {
      query += ' WHERE target = ?';
      params.push(target);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const docs = stmt.all(...params);
    
    return docs.map(doc => ({
      id: doc.id,
      title: doc.title,
      target: doc.target,
      file: {
        name: doc.file_name,
        mime_type: doc.file_mime_type,
        url: doc.file_url,
        size: doc.file_size
      },
      created_at: doc.created_at,
      updated_at: doc.updated_at
    }));
  }

  // Обновление документа
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
      
      if (updateData.file) {
        updateFields.push('file_name = ?');
        values.push(updateData.file.name);
        updateFields.push('file_mime_type = ?');
        values.push(updateData.file.mime_type);
        updateFields.push('file_url = ?');
        values.push(updateData.file.url);
        updateFields.push('file_size = ?');
        values.push(updateData.file.size);
      }
      
      if (updateFields.length === 0) {
        throw new Error('Нет данных для обновления');
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const stmt = db.prepare(`
        UPDATE documents 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `);
      
      const result = stmt.run(...values);
      
      if (result.changes === 0) {
        throw new Error('Документ не найден');
      }
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Ошибка обновления документа: ${error.message}`);
    }
  }

  // Удаление документа
  static delete(id) {
    try {
      // Сначала получаем информацию о файле для удаления
      const doc = this.findById(id);
      if (!doc) {
        throw new Error('Документ не найден');
      }
      
      // Удаляем запись из базы данных
      const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Документ не найден');
      }
      
      // Удаляем физический файл
      const filePath = path.join(__dirname, '..', doc.file.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return { success: true, message: 'Документ успешно удален' };
    } catch (error) {
      throw new Error(`Ошибка удаления документа: ${error.message}`);
    }
  }

  // Получение статистики
  static getStats() {
    const totalDocs = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const employeeDocs = db.prepare('SELECT COUNT(*) as count FROM documents WHERE target = ?').get('EMPLOYEE');
    const studentDocs = db.prepare('SELECT COUNT(*) as count FROM documents WHERE target = ?').get('STUDENT');
    
    return {
      total: totalDocs.count,
      employee: employeeDocs.count,
      student: studentDocs.count
    };
  }
}

module.exports = DocumentModel;
