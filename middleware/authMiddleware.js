const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// Секретный ключ для JWT (в продакшене должен быть в переменных окружения)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware для проверки JWT токена
 * Проверяет заголовок Authorization: Bearer <token>
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Токен доступа не предоставлен',
      message: 'Необходима авторизация для доступа к этому ресурсу'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Недействительный токен',
        message: 'Токен истек или недействителен'
      });
    }

    // Проверяем, что пользователь все еще существует
    const user = UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ 
        error: 'Пользователь не найден',
        message: 'Пользователь был удален или не существует'
      });
    }

    // Добавляем информацию о пользователе в запрос
    req.user = {
      id: decoded.userId,
      username: decoded.username
    };
    
    next();
  });
};

/**
 * Генерация JWT токена
 * @param {Object} user - объект пользователя
 * @returns {string} JWT токен
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: '1h' } // токен действителен 1 час
  );
};

/**
 * Middleware для логирования запросов (опционально)
 */
const logRequests = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
};

module.exports = {
  authenticateToken,
  generateToken,
  logRequests,
  JWT_SECRET
};
