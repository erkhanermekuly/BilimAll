const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT, // postgres
        port: process.env.DB_PORT,
        logging: false,
        dialectModule: require('pg'), // важно для PostgreSQL
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Проверка подключения к базе данных (с повтором для Docker)
const connectDB = async (retries = 5, delayMs = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await sequelize.authenticate();
            console.log('✅ Подключение к базе данных PostgreSQL установлено успешно');
            return;
        } catch (error) {
            console.error(`❌ Подключение к БД (попытка ${i + 1}/${retries}):`, error.message);
            if (i === retries - 1) process.exit(1);
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
};

module.exports = { sequelize, connectDB };
