'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const password1 = await bcrypt.hash('password123', 10);
    const password2 = await bcrypt.hash('admin123', 10);
    const password3 = await bcrypt.hash('user123', 10);

    await queryInterface.bulkInsert('users', [
      {
        name: 'Администратор',
        email: 'admin@bilimhub.com',
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
    await queryInterface.bulkDelete('users', null, {});
  }
};
