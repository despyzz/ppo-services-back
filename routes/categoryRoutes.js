const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Управление справочником (категории и пункты)
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Создание новой категории
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - target
 *             properties:
 *               title:
 *                 type: string
 *               target:
 *                 type: string
 *                 enum: [EMPLOYEE, STUDENT]
 *     responses:
 *       201:
 *         description: Категория создана
 *       401:
 *         description: Неавторизован
 */
router.post('/', authenticateToken, CategoryController.createCategory);

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Получение всех категорий
 *     parameters:
 *       - in: query
 *         name: target
 *         schema:
 *           type: string
 *           enum: [EMPLOYEE, STUDENT]
 *     responses:
 *       200:
 *         description: Список категорий
 */
router.get('/', CategoryController.getAllCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Получение категории по ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Категория найдена
 */
router.get('/:id', CategoryController.getCategoryById);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Обновление категории
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               target:
 *                 type: string
 *                 enum: [EMPLOYEE, STUDENT]
 *     responses:
 *       200:
 *         description: Категория обновлена
 */
router.put('/:id', authenticateToken, CategoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Удаление категории
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Категория удалена
 */
router.delete('/:id', authenticateToken, CategoryController.deleteCategory);

/**
 * @swagger
 * /categories/{categoryId}/items:
 *   post:
 *     tags: [Categories]
 *     summary: Добавление пункта в категорию
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пункт добавлен
 */
router.post('/:categoryId/items', authenticateToken, CategoryController.addItem);

/**
 * @swagger
 * /categories/{categoryId}/items/{itemId}:
 *   put:
 *     tags: [Categories]
 *     summary: Обновление пункта
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пункт обновлен
 */
router.put('/:categoryId/items/:itemId', authenticateToken, CategoryController.updateItem);

/**
 * @swagger
 * /categories/{categoryId}/items/{itemId}:
 *   delete:
 *     tags: [Categories]
 *     summary: Удаление пункта
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пункт удален
 */
router.delete('/:categoryId/items/:itemId', authenticateToken, CategoryController.deleteItem);

module.exports = router;

