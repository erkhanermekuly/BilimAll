const express = require('express');
const router = express.Router();
const { isAuthenticatedAPI } = require('../middleware/auth');
const { Lecture, Theme } = require('../models');
const oylanService = require('../services/oylanService');

// In-memory rate limiter: userId -> { count, resetAt }
const rateLimits = new Map();

function checkRateLimit(userId) {
    const now = Date.now();
    const entry = rateLimits.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
        return true;
    }

    if (entry.count >= 10) {
        return false;
    }

    entry.count++;
    return true;
}

router.post('/ask', isAuthenticatedAPI, async (req, res) => {
    const { question, lectureId } = req.body;

    if (!question || !lectureId) {
        return res.status(400).json({ message: 'question и lectureId обязательны' });
    }

    if (!checkRateLimit(req.user.id)) {
        return res.status(429).json({ message: 'Лимит запросов превышен. Попробуйте через час.' });
    }

    const assistantId = process.env.OYLAN_ASSISTANT_ID;
    if (!assistantId) {
        return res.status(500).json({ message: 'AI ассистент не настроен' });
    }

    try {
        const lecture = await Lecture.findByPk(lectureId, {
            include: [{ model: Theme, as: 'theme' }]
        });

        if (!lecture) {
            return res.status(404).json({ message: 'Лекция не найдена' });
        }

        const contextData = {
            theme_title: lecture.theme ? lecture.theme.title : '',
            lecture_title: lecture.title,
            lecture_content: lecture.content ? lecture.content.slice(0, 500) : ''
        };

        const result = await oylanService.sendMessage(assistantId, question, contextData);

        if (!result) {
            return res.status(502).json({ message: 'Ошибка связи с AI сервисом' });
        }

        // Success: { response: { content: "..." } }  (HTTP 201)
        // Error:   { message: ["..."] }              (HTTP 4xx/5xx)
        const answer = result.response?.content || result.content || result.text || result.answer;

        if (!answer) {
            console.error('Unexpected Oylan response format:', JSON.stringify(result));
            return res.status(502).json({ message: 'Неожиданный формат ответа от AI' });
        }

        res.json({ answer });
    } catch (err) {
        console.error('Ошибка AI запроса:', err);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;
