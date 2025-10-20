const UserModel = require('../models/userModel');
const { generateToken } = require('../middleware/authMiddleware');

class AuthController {
  /**
   * Авторизация пользователя
   * POST /auth/login
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Валидация входных данных
      if (!username || !password) {
        return res.status(400).json({
          error: 'Неполные данные',
          message: 'Необходимо указать username и password'
        });
      }

      // Поиск пользователя в базе данных
      const user = UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          error: 'Неверные учетные данные',
          message: 'Пользователь с таким именем не найден'
        });
      }

      // Проверка пароля
      const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Неверные учетные данные',
          message: 'Неверный пароль'
        });
      }

      // Генерация JWT токена
      const token = generateToken(user);

      res.json({
        success: true,
        message: 'Авторизация успешна',
        token,
        user: {
          id: user.id,
          username: user.username
        }
      });

    } catch (error) {
      console.error('Ошибка авторизации:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при авторизации'
      });
    }
  }

  /**
   * Регистрация нового пользователя
   * POST /auth/register
   */
  static async register(req, res) {
    try {
      const { username, password } = req.body;

      // Валидация входных данных
      if (!username || !password) {
        return res.status(400).json({
          error: 'Неполные данные',
          message: 'Необходимо указать username и password'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Слабый пароль',
          message: 'Пароль должен содержать минимум 6 символов'
        });
      }

      // Проверка существования пользователя
      const existingUser = UserModel.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          error: 'Пользователь уже существует',
          message: 'Пользователь с таким именем уже зарегистрирован'
        });
      }

      // Создание нового пользователя
      const newUser = await UserModel.create(username, password);

      res.status(201).json({
        success: true,
        message: 'Пользователь успешно зарегистрирован',
        user: {
          id: newUser.id,
          username: newUser.username
        }
      });

    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при регистрации'
      });
    }
  }

  /**
   * Получение информации о текущем пользователе
   * GET /auth/me
   */
  static async getMe(req, res) {
    try {
      const user = UserModel.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'Пользователь не найден',
          message: 'Пользователь был удален или не существует'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at
        }
      });

    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: 'Произошла ошибка при получении данных пользователя'
      });
    }
  }

  /**
   * Выход из системы (опционально - для инвалидации токенов)
   * POST /auth/logout
   */
  static async logout(req, res) {
    // В простой реализации JWT токены не инвалидируются
    // В продакшене можно использовать Redis для черного списка токенов
    res.json({
      success: true,
      message: 'Выход выполнен успешно'
    });
  }
}

module.exports = AuthController;
