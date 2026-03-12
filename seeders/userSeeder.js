'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT 1 FROM users WHERE email = 'admin@bilimall.com' LIMIT 1"
    );
    if (rows && rows.length > 0) {
      console.log('Пользователи уже есть, пропуск userSeeder');
      return;
    }

    const password1 = await bcrypt.hash('password123', 10);
    const password2 = await bcrypt.hash('admin123', 10);
    const password3 = await bcrypt.hash('user123', 10);

    await queryInterface.bulkInsert('users', [
      {
        name: 'Администратор',
        email: 'admin@bilimall.com',
        password: password2,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Иван Иванов',
        email: 'ivan@example.com',
        password: password1,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Мария Петрова',
        email: 'maria@example.com',
        password: password1,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Алексей Сидоров',
        email: 'alex@example.com',
        password: password3,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Елена Смирнова',
        email: 'elena@example.com',
        password: password3,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: [
        'admin@bilimall.com',
        'ivan@example.com',
        'maria@example.com',
        'alex@example.com',
        'elena@example.com'
      ]
    }, {});
  }
};
