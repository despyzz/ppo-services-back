const DocumentModel = require('../models/documentModel');
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

class DocumentController {
  /**
   * Создание нового документа
   * POST /documents
   */
  static async createDocument(req, res) {
    try {
      const { title, target } = req.body;
      const file = req.file;

      // Валидация входных данных
      if (!title || !target || !file) {
        return res.status(400).json({
          error: 'Неполные данные',
          message: 'Необходимо указать title, target и загрузить файл'
        });
      }

      // Валидация target
      if (!['EMPLOYEE', 'STUDENT'].includes(target)) {
        return res.status(400).json({
          error: 'Неверное значение target',
          message: 'target должен быть EMPLOYEE или STUDENT'
        });
      }

      // Подготовка данных документа
      const documentData = {
        title: title.trim(),
        target,
        file: {
          name: normalizeFileName(file.originalname), // Нормализованное имя для отображения
          mime_type: file.mimetype,
          url: `/documents/${file.filename}`, // Используем безопасное имя для файловой системы
          size: file.size
        }
      };

      // Создание документа в базе данных
      const newDocument = DocumentModel.create(documentData);

      res.status(201).json({
        success: true,
        message: 'Документ успешно создан',
        document: newDocument
      });

    } catch (error) {
      console.error('Ошибка создания документа:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при создании документа'
      });
    }
  }

  /**
   * Получение всех документов с фильтрацией
   * GET /documents?target=EMPLOYEE
   */
  static async getAllDocuments(req, res) {
    try {
      const { target } = req.query;
      
      // Валидация параметра target
      if (target && !['EMPLOYEE', 'STUDENT'].includes(target)) {
        return res.status(400).json({
          error: 'Неверное значение target',
          message: 'target должен быть EMPLOYEE или STUDENT'
        });
      }

      const documents = DocumentModel.getAll(target);

      res.json({
        success: true,
        documents,
        filters: {
          target: target || null
        }
      });

    } catch (error) {
      console.error('Ошибка получения документов:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении документов'
      });
    }
  }

  /**
   * Получение документа по ID
   * GET /documents/:id
   */
  static async getDocumentById(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      const document = DocumentModel.findById(parseInt(id));

      if (!document) {
        return res.status(404).json({
          error: 'Документ не найден',
          message: 'Документ с указанным ID не существует'
        });
      }

      res.json({
        success: true,
        document
      });

    } catch (error) {
      console.error('Ошибка получения документа:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении документа'
      });
    }
  }

  /**
   * Обновление документа
   * PUT /documents/:id
   */
  static async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const { title, target } = req.body;
      const file = req.file;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Проверка существования документа
      const existingDocument = DocumentModel.findById(parseInt(id));
      if (!existingDocument) {
        return res.status(404).json({
          error: 'Документ не найден',
          message: 'Документ с указанным ID не существует'
        });
      }

      // Подготовка данных для обновления
      const updateData = {};
      
      if (title) updateData.title = title.trim();
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
        // Удаляем старый файл, если загружается новый
        const oldFilePath = path.join(__dirname, '..', existingDocument.file.url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }

        updateData.file = {
          name: normalizeFileName(file.originalname),
          mime_type: file.mimetype,
          url: `/documents/${file.filename}`,
          size: file.size
        };
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Нет данных для обновления',
          message: 'Необходимо указать данные для обновления'
        });
      }

      // Обновление документа
      const updatedDocument = DocumentModel.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Документ успешно обновлен',
        document: updatedDocument
      });

    } catch (error) {
      console.error('Ошибка обновления документа:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при обновлении документа'
      });
    }
  }

  /**
   * Удаление документа
   * DELETE /documents/:id
   */
  static async deleteDocument(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Удаление документа
      const result = DocumentModel.delete(parseInt(id));

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Ошибка удаления документа:', error);
      
      if (error.message.includes('не найден')) {
        return res.status(404).json({
          error: 'Документ не найден',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при удалении документа'
      });
    }
  }
}

module.exports = DocumentController;
