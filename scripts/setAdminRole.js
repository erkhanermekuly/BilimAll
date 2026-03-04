/**
 * Выдать роль admin пользователю по email.
 * Использование: node scripts/setAdminRole.js [email]
 * Пример: node scripts/setAdminRole.js admin@bilimhub.com
 */
require('dotenv').config();
const { connectDB, sequelize } = require('../config/db');
const User = require('../models/User');

const email = process.argv[2] || 'admin@bilimhub.com';

async function main() {
    await connectDB();
    const user = await User.findOne({ where: { email } });
    if (!user) {
        console.error(`Пользователь с email "${email}" не найден.`);
        process.exit(1);
    }
    if (user.role === 'admin') {
        console.log(`Пользователь ${email} уже является администратором.`);
        process.exit(0);
    }
    await user.update({ role: 'admin' });
    console.log(`✅ Роль admin выдана пользователю: ${email}`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
