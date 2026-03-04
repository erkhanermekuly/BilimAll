/**
 * Кастомный запуск сидеров (userSeeder).
 * Использование: npm run seed
 * Для полного сброса и сидов через sequelize-cli: npm run db:reset
 */
const { connectDB } = require('../config/db');
const seedUsers = require('./userSeeder');

const runSeeders = async () => {
    try {
        console.log('🌱 Начало заполнения базы данных тестовыми данными...\n');
        await connectDB();
        await seedUsers();
        console.log('\n✅ Заполнение базы данных завершено успешно!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Ошибка при заполнении базы данных:', error);
        process.exit(1);
    }
};

runSeeders();
