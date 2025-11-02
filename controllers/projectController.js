const ProjectModel = require('../models/projectModel');
const path = require('path');
const fs = require('fs');

// Функция для нормализации имени файла
function normalizeFileName(originalName) {
  if (!originalName) return 'unnamed_file';
  
  // Получаем расширение файла
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  // Нормализуем имя файла
  const normalizedName = baseName
    .replace(/[^\w\s.-]/g, '') // Убираем специальные символы
    .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
    .substring(0, 50); // Ограничиваем длину
  
  return normalizedName + extension;
}

class ProjectController {
  /**
   * Создание нового проекта
   * POST /projects
   */
  static async createProject(req, res) {
    try {
      const { title, description, target } = req.body;
      const file = req.file;

      // Валидация входных данных
      if (!title || !description || !target) {
        return res.status(400).json({
          error: 'Неполные данные',
          message: 'Необходимо указать title, description, target и загрузить изображение'
        });
      }

      // Валидация target
      if (!['EMPLOYEE', 'STUDENT'].includes(target)) {
        return res.status(400).json({
          error: 'Неверное значение target',
          message: 'target должен быть EMPLOYEE или STUDENT'
        });
      }

      if (!file) {
        return res.status(400).json({
          error: 'Изображение не загружено',
          message: 'Необходимо загрузить изображение'
        });
      }

      // Подготовка данных проекта
      const projectData = {
        title: title.trim(),
        description: description.trim(),
        target,
        image_src: `/images/${file.filename}` // Путь к изображению
      };

      // Создание проекта в базе данных
      const newProject = ProjectModel.create(projectData);

      res.status(201).json({
        success: true,
        message: 'Проект успешно создан',
        project: newProject
      });

    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при создании проекта'
      });
    }
  }

  /**
   * Получение всех проектов с фильтрацией
   * GET /projects?target=EMPLOYEE
   */
  static async getAllProjects(req, res) {
    try {
      const { target } = req.query;
      
      // Валидация параметра target
      if (target && !['EMPLOYEE', 'STUDENT'].includes(target)) {
        return res.status(400).json({
          error: 'Неверное значение target',
          message: 'target должен быть EMPLOYEE или STUDENT'
        });
      }

      const projects = ProjectModel.getAll(target);

      res.json({
        success: true,
        projects,
        filters: {
          target: target || null
        }
      });

    } catch (error) {
      console.error('Ошибка получения проектов:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении проектов'
      });
    }
  }

  /**
   * Получение проекта по ID
   * GET /projects/:id
   */
  static async getProjectById(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      const project = ProjectModel.findById(parseInt(id));

      if (!project) {
        return res.status(404).json({
          error: 'Проект не найден',
          message: 'Проект с указанным ID не существует'
        });
      }

      res.json({
        success: true,
        project
      });

    } catch (error) {
      console.error('Ошибка получения проекта:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении проекта'
      });
    }
  }

  /**
   * Обновление проекта
   * PUT /projects/:id
   */
  static async updateProject(req, res) {
    try {
      const { id } = req.params;
      const { title, description, target } = req.body;
      const file = req.file;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Проверка существования проекта
      const existingProject = ProjectModel.findById(parseInt(id));
      if (!existingProject) {
        return res.status(404).json({
          error: 'Проект не найден',
          message: 'Проект с указанным ID не существует'
        });
      }

      // Подготовка данных для обновления
      const updateData = {};
      
      if (title) updateData.title = title.trim();
      if (description) updateData.description = description.trim();
      if (target) {
        if (!['EMPLOYEE', 'STUDENT'].includes(target)) {
          return res.status(400).json({
            error: 'Неверное значение target',
            message: 'target должен быть EMPLOYEE или STUDENT'
          });
        }
        updateData.target = target;
      }
      
      if (file) {
        // Удаляем старое изображение, если загружается новое
        const oldImagePath = path.join(__dirname, '..', existingProject.image_src);
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

      // Обновление проекта
      const updatedProject = ProjectModel.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Проект успешно обновлен',
        project: updatedProject
      });

    } catch (error) {
      console.error('Ошибка обновления проекта:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при обновлении проекта'
      });
    }
  }

  /**
   * Удаление проекта
   * DELETE /projects/:id
   */
  static async deleteProject(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Удаление проекта
      const result = ProjectModel.delete(parseInt(id));

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
      console.error('Ошибка удаления проекта:', error);
      
      if (error.message.includes('не найден')) {
        return res.status(404).json({
          error: 'Проект не найден',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при удалении проекта'
      });
    }
  }
}

module.exports = ProjectController;

