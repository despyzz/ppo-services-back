const Database = require('better-sqlite3');
const path = require('path');

// Подключение к базе данных
const db = new Database(path.join(__dirname, '../db/database.sqlite'));

// Создание таблицы членов команды
db.exec(`
  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK (role IN ('CHAIRMAN', 'DEPUTY_CHAIRMAN', 'SUPERVISOR')),
    image_src TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Создание индексов для обеспечения уникальности CHAIRMAN и DEPUTY_CHAIRMAN
// В SQLite нет прямого UNIQUE с условием, поэтому будем проверять в коде

class TeamMemberModel {
  // Проверка, существует ли уже член команды с ролью CHAIRMAN или DEPUTY_CHAIRMAN
  static findExistingByRole(role, excludeId = null) {
    if (role !== 'CHAIRMAN' && role !== 'DEPUTY_CHAIRMAN') {
      return null; // Для SUPERVISOR не нужна проверка уникальности
    }

    let query = 'SELECT * FROM team_members WHERE role = ?';
    let params = [role];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  // Создание нового члена команды
  static create(memberData) {
    try {
      // Проверка уникальности для CHAIRMAN и DEPUTY_CHAIRMAN
      if (memberData.role === 'CHAIRMAN' || memberData.role === 'DEPUTY_CHAIRMAN') {
        const existing = this.findExistingByRole(memberData.role);
        if (existing) {
          throw new Error(`Член команды с ролью ${memberData.role} уже существует`);
        }
      }

      const stmt = db.prepare(`
        INSERT INTO team_members (role, image_src, name, description) 
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        memberData.role,
        memberData.image_src,
        memberData.name,
        memberData.description
      );
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания члена команды: ${error.message}`);
    }
  }

  // Получение члена команды по ID
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM team_members WHERE id = ?');
    const member = stmt.get(id);
    
    if (member) {
      return {
        id: member.id,
        role: member.role,
        image_src: member.image_src,
        name: member.name,
        description: member.description,
        created_at: member.created_at,
        updated_at: member.updated_at
      };
    }
    return null;
  }

  // Получение всех членов команды
  static getAll() {
    const stmt = db.prepare('SELECT * FROM team_members ORDER BY role, created_at ASC');
    const members = stmt.all();
    
    return members.map(member => ({
      id: member.id,
      role: member.role,
      image_src: member.image_src,
      name: member.name,
      description: member.description,
      created_at: member.created_at,
      updated_at: member.updated_at
    }));
  }

  // Получение членов команды по роли
  static getByRole(role) {
    const stmt = db.prepare('SELECT * FROM team_members WHERE role = ? ORDER BY created_at ASC');
    const members = stmt.all(role);
    
    return members.map(member => ({
      id: member.id,
      role: member.role,
      image_src: member.image_src,
      name: member.name,
      description: member.description,
      created_at: member.created_at,
      updated_at: member.updated_at
    }));
  }

  // Получение председателя (должен быть только один)
  static getChairman() {
    const stmt = db.prepare('SELECT * FROM team_members WHERE role = ? LIMIT 1');
    const member = stmt.get('CHAIRMAN');
    
    if (member) {
      return {
        id: member.id,
        role: member.role,
        image_src: member.image_src,
        name: member.name,
        description: member.description,
        created_at: member.created_at,
        updated_at: member.updated_at
      };
    }
    return null;
  }

  // Получение заместителя председателя (должен быть только один)
  static getDeputyChairman() {
    const stmt = db.prepare('SELECT * FROM team_members WHERE role = ? LIMIT 1');
    const member = stmt.get('DEPUTY_CHAIRMAN');
    
    if (member) {
      return {
        id: member.id,
        role: member.role,
        image_src: member.image_src,
        name: member.name,
        description: member.description,
        created_at: member.created_at,
        updated_at: member.updated_at
      };
    }
    return null;
  }

  // Получение руководителей структурных подразделений (может быть несколько)
  static getSupervisors() {
    return this.getByRole('SUPERVISOR');
  }

  // Обновление члена команды
  static update(id, updateData) {
    try {
      // Проверка уникальности для CHAIRMAN и DEPUTY_CHAIRMAN при изменении роли
      if (updateData.role && (updateData.role === 'CHAIRMAN' || updateData.role === 'DEPUTY_CHAIRMAN')) {
        const existing = this.findExistingByRole(updateData.role, id);
        if (existing) {
          throw new Error(`Член команды с ролью ${updateData.role} уже существует`);
        }
      }

      const updateFields = [];
      const values = [];
      
      if (updateData.role) {
        updateFields.push('role = ?');
        values.push(updateData.role);
      }
      
      if (updateData.image_src) {
        updateFields.push('image_src = ?');
        values.push(updateData.image_src);
      }
      
      if (updateData.name) {
        updateFields.push('name = ?');
        values.push(updateData.name);
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
        UPDATE team_members 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `);
      
      const result = stmt.run(...values);
      
      if (result.changes === 0) {
        throw new Error('Член команды не найден');
      }
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Ошибка обновления члена команды: ${error.message}`);
    }
  }

  // Удаление члена команды
  static delete(id) {
    try {
      const member = this.findById(id);
      if (!member) {
        throw new Error('Член команды не найден');
      }
      
      // Удаляем запись из базы данных
      const stmt = db.prepare('DELETE FROM team_members WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Член команды не найден');
      }
      
      return { success: true, message: 'Член команды успешно удален', image_src: member.image_src };
    } catch (error) {
      throw new Error(`Ошибка удаления члена команды: ${error.message}`);
    }
  }
}

module.exports = TeamMemberModel;

