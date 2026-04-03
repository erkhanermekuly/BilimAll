'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const adminsToEnsure = [
      {
        name: 'Администратор',
        email: 'admin@gmail.com',
        password: 'admin12345'
      },
      {
        name: 'Администратор 2',
        email: 'admin2@bilimhub.com',
        password: 'admin24680'
      }
    ];

    for (const admin of adminsToEnsure) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id, role FROM users WHERE email = '${admin.email}' LIMIT 1`
      );

      if (rows && rows.length > 0) {
        if (rows[0].role !== 'admin') {
          await queryInterface.bulkUpdate(
            'users',
            { role: 'admin', updatedAt: now },
            { email: admin.email }
          );
        }
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await queryInterface.bulkInsert('users', [{
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: 'admin',
        createdAt: now,
        updatedAt: now
      }], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: ['admin@gmail.com', 'admin2@bilimhub.com']
    }, {});
  }
};
