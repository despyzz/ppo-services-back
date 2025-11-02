const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route POST /categories
 * @desc Создание новой категории
 * @access Private
 */
router.post('/', authenticateToken, CategoryController.createCategory);

/**
 * @route GET /categories
 * @desc Получение всех категорий с фильтрацией
 * @access Public
 */
router.get('/', CategoryController.getAllCategories);

/**
 * @route GET /categories/:id
 * @desc Получение категории по ID
 * @access Public
 */
router.get('/:id', CategoryController.getCategoryById);

/**
 * @route PUT /categories/:id
 * @desc Обновление категории
 * @access Private
 */
router.put('/:id', authenticateToken, CategoryController.updateCategory);

/**
 * @route DELETE /categories/:id
 * @desc Удаление категории
 * @access Private
 */
router.delete('/:id', authenticateToken, CategoryController.deleteCategory);

/**
 * @route POST /categories/:categoryId/items
 * @desc Добавление пункта в категорию
 * @access Private
 */
router.post('/:categoryId/items', authenticateToken, CategoryController.addItem);

/**
 * @route PUT /categories/:categoryId/items/:itemId
 * @desc Обновление пункта
 * @access Private
 */
router.put('/:categoryId/items/:itemId', authenticateToken, CategoryController.updateItem);

/**
 * @route DELETE /categories/:categoryId/items/:itemId
 * @desc Удаление пункта
 * @access Private
 */
router.delete('/:categoryId/items/:itemId', authenticateToken, CategoryController.deleteItem);

module.exports = router;

