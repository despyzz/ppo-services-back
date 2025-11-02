const NewsModel = require('../models/newsModel');
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

class NewsController {
  /**
   * Создание новой новости
   * POST /news
   */
  static async createNews(req, res) {
    try {
      const { title, description, date } = req.body;
      const file = req.file;

      // Валидация входных данных
      if (!title || !description || !date) {
        return res.status(400).json({
          error: 'Неполные данные',
          message: 'Необходимо указать title, description, date и загрузить изображение'
        });
      }

      if (!file) {
        return res.status(400).json({
          error: 'Изображение не загружено',
          message: 'Необходимо загрузить изображение'
        });
      }

      // Подготовка данных новости
      const newsData = {
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        image_src: `/images/${file.filename}` // Путь к изображению
      };

      // Создание новости в базе данных
      const newNews = NewsModel.create(newsData);

      res.status(201).json({
        success: true,
        message: 'Новость успешно создана',
        news: newNews
      });

    } catch (error) {
      console.error('Ошибка создания новости:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при создании новости'
      });
    }
  }

  /**
   * Получение всех новостей
   * GET /news
   */
  static async getAllNews(req, res) {
    try {
      const news = NewsModel.getAll();

      res.json({
        success: true,
        news
      });

    } catch (error) {
      console.error('Ошибка получения новостей:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении новостей'
      });
    }
  }

  /**
   * Получение новости по ID
   * GET /news/:id
   */
  static async getNewsById(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      const news = NewsModel.findById(parseInt(id));

      if (!news) {
        return res.status(404).json({
          error: 'Новость не найдена',
          message: 'Новость с указанным ID не существует'
        });
      }

      res.json({
        success: true,
        news
      });

    } catch (error) {
      console.error('Ошибка получения новости:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении новости'
      });
    }
  }

  /**
   * Обновление новости
   * PUT /news/:id
   */
  static async updateNews(req, res) {
    try {
      const { id } = req.params;
      const { title, description, date } = req.body;
      const file = req.file;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Проверка существования новости
      const existingNews = NewsModel.findById(parseInt(id));
      if (!existingNews) {
        return res.status(404).json({
          error: 'Новость не найдена',
          message: 'Новость с указанным ID не существует'
        });
      }

      // Подготовка данных для обновления
      const updateData = {};
      
      if (title) updateData.title = title.trim();
      if (description) updateData.description = description.trim();
      if (date) updateData.date = date.trim();
      
      if (file) {
        // Удаляем старое изображение, если загружается новое
        const oldImagePath = path.join(__dirname, '..', existingNews.image_src);
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

      // Обновление новости
      const updatedNews = NewsModel.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Новость успешно обновлена',
        news: updatedNews
      });

    } catch (error) {
      console.error('Ошибка обновления новости:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при обновлении новости'
      });
    }
  }

  /**
   * Удаление новости
   * DELETE /news/:id
   */
  static async deleteNews(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Удаление новости
      const result = NewsModel.delete(parseInt(id));

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
      console.error('Ошибка удаления новости:', error);
      
      if (error.message.includes('не найдена')) {
        return res.status(404).json({
          error: 'Новость не найдена',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при удалении новости'
      });
    }
  }
}

module.exports = NewsController;

