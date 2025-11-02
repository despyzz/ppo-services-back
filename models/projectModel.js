const Database = require('better-sqlite3');
const path = require('path');

// Подключение к базе данных
const db = new Database(path.join(__dirname, '../db/database.sqlite'));

// Создание таблицы проектов
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_src TEXT NOT NULL,
    target TEXT NOT NULL CHECK (target IN ('EMPLOYEE', 'STUDENT')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

class ProjectModel {
  // Создание нового проекта
  static create(projectData) {
    try {
      const stmt = db.prepare(`
        INSERT INTO projects (title, description, image_src, target) 
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        projectData.title,
        projectData.description,
        projectData.image_src,
        projectData.target
      );
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания проекта: ${error.message}`);
    }
  }

  // Получение проекта по ID
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    const project = stmt.get(id);
    
    if (project) {
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        image_src: project.image_src,
        target: project.target,
        created_at: project.created_at,
        updated_at: project.updated_at
      };
    }
    return null;
  }

  // Получение всех проектов с фильтрацией
  static getAll(target = null) {
    let query = 'SELECT * FROM projects';
    let params = [];
    
    if (target) {
      query += ' WHERE target = ?';
      params.push(target);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const projects = stmt.all(...params);
    
    return projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      image_src: project.image_src,
      target: project.target,
      created_at: project.created_at,
      updated_at: project.updated_at
    }));
  }

  // Обновление проекта
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
      
      if (updateData.image_src) {
        updateFields.push('image_src = ?');
        values.push(updateData.image_src);
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
        UPDATE projects 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `);
      
      const result = stmt.run(...values);
      
      if (result.changes === 0) {
        throw new Error('Проект не найден');
      }
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Ошибка обновления проекта: ${error.message}`);
    }
  }

  // Удаление проекта
  static delete(id) {
    try {
      const project = this.findById(id);
      if (!project) {
        throw new Error('Проект не найден');
      }
      
      // Удаляем запись из базы данных
      const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Проект не найден');
      }
      
      return { success: true, message: 'Проект успешно удален', image_src: project.image_src };
    } catch (error) {
      throw new Error(`Ошибка удаления проекта: ${error.message}`);
    }
  }
}

module.exports = ProjectModel;

