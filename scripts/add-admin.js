// add-admin.js (создание админа через консоль)
const path = require('path');
const UserModel = require('../models/userModel');

const [,, username, password] = process.argv;

if (!username || !password) {
  console.error('Использование: node scripts/add-admin.js <username> <password>');
  process.exit(1);
}

try {
  const user = UserModel.create({ username, password });
  console.log(`✅ Админ создан: ${user.username} (id: ${user.id})`);
  process.exit(0);
} catch (e) {
  if (e.message.includes('уже существует')) {
    console.error(`Пользователь ${username} уже существует!`);
  } else {
    console.error('Ошибка:', e.message);
  }
  process.exit(1);
}
