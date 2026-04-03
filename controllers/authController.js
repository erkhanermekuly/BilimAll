const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { fn, col, where } = require('sequelize');
const User = require('../models/User');

const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();
        
        console.log('Попытка регистрации:', { name, email: normalizedEmail });

        if (!name || !normalizedEmail || !password || !confirmPassword) {
            console.log('Не все поля заполнены');
            return res.status(400).render('pages/register', {
                error: 'Заполните все поля',
                user: null
            });
        }

        if (password !== confirmPassword) {
            console.log('Пароли не совпадают');
            return res.status(400).render('pages/register', {
                error: 'Пароли не совпадают',
                user: null
            });
        }

        if (password.length < 6) {
            console.log('Пароль слишком короткий');
            return res.status(400).render('pages/register', {
                error: 'Пароль должен содержать минимум 6 символов',
                user: null
            });
        }

        const existingUser = await User.findOne({
            where: where(fn('LOWER', col('email')), normalizedEmail)
        });
        if (existingUser) {
            console.log('Email уже используется');
            return res.status(400).render('pages/register', {
                error: 'Email уже используется',
                user: null
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Пароль захеширован');

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword
        });
        console.log('Пользователь создан:', user.id);

        const token = generateToken(user.id);

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, 
            secure: process.env.NODE_ENV === 'production'
        });

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        console.log('Регистрация успешна, редирект на главную');
        res.redirect('/');
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).render('pages/register', {
            error: 'Произошла ошибка при регистрации: ' + error.message,
            user: null
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();
        
        console.log('Попытка входа:', normalizedEmail);
        if (!normalizedEmail || !password) {
            console.log('Не все поля заполнены');
            return res.status(400).render('pages/login', {
                error: 'Заполните все поля',
                user: null
            });
        }

        const user = await User.findOne({
            where: where(fn('LOWER', col('email')), normalizedEmail)
        });
        if (!user) {
            console.log('Пользователь не найден:', normalizedEmail);
            return res.status(401).render('pages/login', {
                error: 'Неверный email или пароль',
                user: null
            });
        }
        
        console.log(' Пользователь найден:', user.name);

        console.log(' Проверка пароля...');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            console.log('Неверный пароль');
            return res.status(401).render('pages/login', {
                error: 'Неверный email или пароль',
                user: null
            });
        }
        
        console.log('Пароль верный');

        const token = generateToken(user.id);

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, 
            secure: process.env.NODE_ENV === 'production'
        });

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        console.log('Вход успешен, редирект на главную');
        
        if (user.role === 'admin') {
            return res.redirect('/admin');
        }
        
        res.redirect('/');
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        res.status(500).render('pages/login', {
            error: 'Произошла ошибка при входе: ' + error.message,
            user: null
        });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    req.session.destroy((err) => {
        if (err) {
            console.error('Ошибка при выходе:', err);
        }
        res.redirect('/');
    });
};

exports.getCurrentUser = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(user);
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};
