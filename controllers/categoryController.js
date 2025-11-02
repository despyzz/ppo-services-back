const CategoryModel = require('../models/categoryModel');

class CategoryController {
  /**
   * Создание новой категории
   * POST /categories
   */
  static async createCategory(req, res) {
    try {
      const { title, target } = req.body;

      // Валидация входных данных
      if (!title || !target) {
        return res.status(400).json({
          error: 'Неполные данные',
          message: 'Необходимо указать title и target'
        });
      }

      // Валидация target
      if (!['EMPLOYEE', 'STUDENT'].includes(target)) {
        return res.status(400).json({
          error: 'Неверное значение target',
          message: 'target должен быть EMPLOYEE или STUDENT'
        });
      }

      // Создание категории в базе данных
      const newCategory = CategoryModel.create({
        title: title.trim(),
        target
      });

      res.status(201).json({
        success: true,
        message: 'Категория успешно создана',
        category: newCategory
      });

    } catch (error) {
      console.error('Ошибка создания категории:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при создании категории'
      });
    }
  }

  /**
   * Получение всех категорий с фильтрацией
   * GET /categories?target=EMPLOYEE
   */
  static async getAllCategories(req, res) {
    try {
      const { target } = req.query;
      
      // Валидация параметра target
      if (target && !['EMPLOYEE', 'STUDENT'].includes(target)) {
        return res.status(400).json({
          error: 'Неверное значение target',
          message: 'target должен быть EMPLOYEE или STUDENT'
        });
      }

      const categories = CategoryModel.getAll(target);

      res.json({
        success: true,
        categories,
        filters: {
          target: target || null
        }
      });

    } catch (error) {
      console.error('Ошибка получения категорий:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении категорий'
      });
    }
  }

  /**
   * Получение категории по ID
   * GET /categories/:id
   */
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      const category = CategoryModel.findById(parseInt(id));

      if (!category) {
        return res.status(404).json({
          error: 'Категория не найдена',
          message: 'Категория с указанным ID не существует'
        });
      }

      res.json({
        success: true,
        category
      });

    } catch (error) {
      console.error('Ошибка получения категории:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении категории'
      });
    }
  }

  /**
   * Обновление категории
   * PUT /categories/:id
   */
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { title, target } = req.body;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Проверка существования категории
      const existingCategory = CategoryModel.findById(parseInt(id));
      if (!existingCategory) {
        return res.status(404).json({
          error: 'Категория не найдена',
          message: 'Категория с указанным ID не существует'
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

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Нет данных для обновления',
          message: 'Необходимо указать данные для обновления'
        });
      }

      // Обновление категории
      const updatedCategory = CategoryModel.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Категория успешно обновлена',
        category: updatedCategory
      });

    } catch (error) {
      console.error('Ошибка обновления категории:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при обновлении категории'
      });
    }
  }

  /**
   * Удаление категории
   * DELETE /categories/:id
   */
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Валидация ID
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Неверный ID',
          message: 'ID должен быть числом'
        });
      }

      // Удаление категории
      const result = CategoryModel.delete(parseInt(id));

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Ошибка удаления категории:', error);
      
      if (error.message.includes('не найдена')) {
        return res.status(404).json({
          error: 'Категория не найдена',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при удалении категории'
      });
    }
  }

  /**
   * Добавление пункта в категорию
   * POST /categories/:categoryId/items
   */
  static async addItem(req, res) {
    try {
      const { categoryId } = req.params;
      const { title, description } = req.body;

      // Валидация ID
      if (!categoryId || isNaN(parseInt(categoryId))) {
        return res.status(400).json({
          error: 'Неверный ID категории',
          message: 'ID категории должен быть числом'
        });
      }

      // Валидация входных данных
      if (!title || !description) {
        return res.status(400).json({
          error: 'Неполные данные',
          message: 'Необходимо указать title и description'
        });
      }

      // Добавление пункта
      const newItem = CategoryModel.addItem(parseInt(categoryId), {
        title: title.trim(),
        description: description.trim()
      });

      res.status(201).json({
        success: true,
        message: 'Пункт успешно добавлен',
        item: newItem
      });

    } catch (error) {
      console.error('Ошибка добавления пункта:', error);
      
      if (error.message.includes('не найдена')) {
        return res.status(404).json({
          error: 'Категория не найдена',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при добавлении пункта'
      });
    }
  }

  /**
   * Обновление пункта
   * PUT /categories/:categoryId/items/:itemId
   */
  static async updateItem(req, res) {
    try {
      const { categoryId, itemId } = req.params;
      const { title, description } = req.body;

      // Валидация ID
      if (!itemId || isNaN(parseInt(itemId))) {
        return res.status(400).json({
          error: 'Неверный ID пункта',
          message: 'ID пункта должен быть числом'
        });
      }

      // Проверка существования пункта
      const existingItem = CategoryModel.findItemById(parseInt(itemId));
      if (!existingItem) {
        return res.status(404).json({
          error: 'Пункт не найден',
          message: 'Пункт с указанным ID не существует'
        });
      }

      // Проверка, что пункт принадлежит категории
      if (existingItem.category_id !== parseInt(categoryId)) {
        return res.status(400).json({
          error: 'Неверная категория',
          message: 'Пункт не принадлежит указанной категории'
        });
      }

      // Подготовка данных для обновления
      const updateData = {};
      if (title) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description.trim();

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Нет данных для обновления',
          message: 'Необходимо указать данные для обновления'
        });
      }

      // Обновление пункта
      const updatedItem = CategoryModel.updateItem(parseInt(itemId), updateData);

      res.json({
        success: true,
        message: 'Пункт успешно обновлен',
        item: updatedItem
      });

    } catch (error) {
      console.error('Ошибка обновления пункта:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при обновлении пункта'
      });
    }
  }

  /**
   * Удаление пункта
   * DELETE /categories/:categoryId/items/:itemId
   */
  static async deleteItem(req, res) {
    try {
      const { categoryId, itemId } = req.params;

      // Валидация ID
      if (!itemId || isNaN(parseInt(itemId))) {
        return res.status(400).json({
          error: 'Неверный ID пункта',
          message: 'ID пункта должен быть числом'
        });
      }

      // Проверка существования пункта
      const existingItem = CategoryModel.findItemById(parseInt(itemId));
      if (!existingItem) {
        return res.status(404).json({
          error: 'Пункт не найден',
          message: 'Пункт с указанным ID не существует'
        });
      }

      // Проверка, что пункт принадлежит категории
      if (existingItem.category_id !== parseInt(categoryId)) {
        return res.status(400).json({
          error: 'Неверная категория',
          message: 'Пункт не принадлежит указанной категории'
        });
      }

      // Удаление пункта
      const result = CategoryModel.deleteItem(parseInt(itemId));

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Ошибка удаления пункта:', error);
      
      if (error.message.includes('не найден')) {
        return res.status(404).json({
          error: 'Пункт не найден',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при удалении пункта'
      });
    }
  }
}

module.exports = CategoryController;

