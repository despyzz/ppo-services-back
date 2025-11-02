const TeamMemberModel = require('../models/teamMemberModel');
const path = require('path');
const fs = require('fs');

class TeamMemberController {
  /**
   * Создание нового члена команды
   * POST /team-members
   */
  static async createTeamMember(req, res) {
    try {
      const { role, name, description } = req.body;
      const file = req.file;

      // Валидация входных данных
      if (!role || !name || !description) {
        return res.status(400).json({
          error: 'Неполные данные',
          message: 'Необходимо указать role, name, description и загрузить изображение'
        });
      }

      // Валидация role
      if (!['CHAIRMAN', 'DEPUTY_CHAIRMAN', 'SUPERVISOR'].includes(role)) {
        return res.status(400).json({
          error: 'Неверное значение role',
          message: 'role должен быть CHAIRMAN, DEPUTY_CHAIRMAN или SUPERVISOR'
        });
      }

      if (!file) {
        return res.status(400).json({
          error: 'Изображение не загружено',
          message: 'Необходимо загрузить изображение'
        });
      }

      // Подготовка данных члена команды
      const memberData = {
        role,
        name: name.trim(),
        description: description.trim(),
        image_src: `/images/${file.filename}` // Путь к изображению
      };

      // Создание члена команды в базе данных
      // Модель сама проверит уникальность для CHAIRMAN и DEPUTY_CHAIRMAN
      const newMember = TeamMemberModel.create(memberData);

      res.status(201).json({
        success: true,
        message: 'Член команды успешно создан',
        member: newMember
      });

    } catch (error) {
      console.error('Ошибка создания члена команды:', error);
      
      if (error.message.includes('уже существует')) {
        return res.status(400).json({
          error: 'Ошибка создания',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при создании члена команды'
      });
    }
  }

  /**
   * Получение всех членов команды
   * GET /team-members
   */
  static async getAllTeamMembers(req, res) {
    try {
      const members = TeamMemberModel.getAll();

      res.json({
        success: true,
        members
      });

    } catch (error) {
      console.error('Ошибка получения членов команды:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении членов команды'
      });
    }
  }

  /**
   * Получение председателя (только один)
   * GET /team-members/chairman
   */
  static async getChairman(req, res) {
    try {
      const chairman = TeamMemberModel.getChairman();

      if (!chairman) {
        return res.status(404).json({
          error: 'Председатель не найден',
          message: 'Председатель не назначен'
        });
      }

      res.json({
        success: true,
        member: chairman
      });

    } catch (error) {
      console.error('Ошибка получения председателя:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении председателя'
      });
    }
  }

  /**
   * Получение заместителя председателя (только один)
   * GET /team-members/deputy-chairman
   */
  static async getDeputyChairman(req, res) {
    try {
      const deputyChairman = TeamMemberModel.getDeputyChairman();

      if (!deputyChairman) {
        return res.status(404).json({
          error: 'Заместитель председателя не найден',
          message: 'Заместитель председателя не назначен'
        });
      }

      res.json({
        success: true,
        member: deputyChairman
      });

    } catch (error) {
      console.error('Ошибка получения заместителя председателя:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении заместителя председателя'
      });
    }
  }

  /**
   * Получение руководителей структурных подразделений
   * GET /team-members/supervisors
   */
  static async getSupervisors(req, res) {
    try {
      const supervisors = TeamMemberModel.getSupervisors();

      res.json({
        success: true,
        members: supervisors
      });

    } catch (error) {
      console.error('Ошибка получения руководителей:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении руководителей'
      });
    }
  }

  /**
   * Получение члена команды по ID
   * GET /team-members/:id
   */
  static async getTeamMemberById(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      const member = TeamMemberModel.findById(parseInt(id));

      if (!member) {
        return res.status(404).json({
          error: 'Член команды не найден',
          message: 'Член команды с указанным ID не существует'
        });
      }

      res.json({
        success: true,
        member
      });

    } catch (error) {
      console.error('Ошибка получения члена команды:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении члена команды'
      });
    }
  }

  /**
   * Обновление члена команды
   * PUT /team-members/:id
   */
  static async updateTeamMember(req, res) {
    try {
      const { id } = req.params;
      const { role, name, description } = req.body;
      const file = req.file;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Проверка существования члена команды
      const existingMember = TeamMemberModel.findById(parseInt(id));
      if (!existingMember) {
        return res.status(404).json({
          error: 'Член команды не найден',
          message: 'Член команды с указанным ID не существует'
        });
      }

      // Валидация role, если указан
      if (role && !['CHAIRMAN', 'DEPUTY_CHAIRMAN', 'SUPERVISOR'].includes(role)) {
        return res.status(400).json({
          error: 'Неверное значение role',
          message: 'role должен быть CHAIRMAN, DEPUTY_CHAIRMAN или SUPERVISOR'
        });
      }

      // Подготовка данных для обновления
      const updateData = {};
      
      if (role) updateData.role = role;
      if (name) updateData.name = name.trim();
      if (description) updateData.description = description.trim();
      
      if (file) {
        // Удаляем старое изображение, если загружается новое
        const oldImagePath = path.join(__dirname, '..', existingMember.image_src);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }

        updateData.image_src = `/images/${file.filename}`;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Нет данных для обновления',
          message: 'Необходимо указать данные для обновления'
        });
      }

      // Обновление члена команды
      // Модель сама проверит уникальность для CHAIRMAN и DEPUTY_CHAIRMAN
      const updatedMember = TeamMemberModel.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Член команды успешно обновлен',
        member: updatedMember
      });

    } catch (error) {
      console.error('Ошибка обновления члена команды:', error);
      
      if (error.message.includes('уже существует')) {
        return res.status(400).json({
          error: 'Ошибка обновления',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при обновлении члена команды'
      });
    }
  }

  /**
   * Удаление члена команды
   * DELETE /team-members/:id
   */
  static async deleteTeamMember(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Удаление члена команды
      const result = TeamMemberModel.delete(parseInt(id));

      // Удаляем физический файл изображения
      if (result.image_src) {
        const imagePath = path.join(__dirname, '..', result.image_src);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Ошибка удаления члена команды:', error);
      
      if (error.message.includes('не найден')) {
        return res.status(404).json({
          error: 'Член команды не найден',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при удалении члена команды'
      });
    }
  }
}

module.exports = TeamMemberController;

