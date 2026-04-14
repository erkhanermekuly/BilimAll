const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/login');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }

        req.user = user;
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };
        next();
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
        res.clearCookie('token');
        res.redirect('/login');
    }
};

exports.isGuest = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/');
        } catch (error) {
            res.clearCookie('token');
        }
    }
    next();
};

exports.isAuthenticatedAPI = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Не авторизован' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Ошибка аутентификации API:', error);
        res.status(401).json({ message: 'Неверный токен' });
    }
};

exports.isAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect('/login');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user || user.role !== 'admin') {
            return res.status(403).render('pages/error', { 
                message: 'Доступ запрещен. Только для администраторов.' 
            });
        }

        req.user = user;
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        next();
    } catch (error) {
        console.error('Ошибка проверки прав администратора:', error);
        res.clearCookie('token');
        res.redirect('/login');
    }
};

exports.isAdminAPI = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Не авторизован' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Доступ запрещен. Только для администраторов.' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Ошибка проверки прав администратора API:', error);
        res.status(401).json({ message: 'Неверный токен' });
    }
};
