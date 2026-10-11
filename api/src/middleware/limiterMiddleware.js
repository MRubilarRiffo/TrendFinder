const rateLimit = require('express-rate-limit');

const limiterMiddleware = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 50, // Límite de 50 solicitudes por ventana
        message: {
            status: 'failed',
            message: 'Demasiadas solicitudes desde esta IP, por favor inténtelo de nuevo más tarde.'
        },
        standardHeaders: true,
        legacyHeaders: false,
    });

module.exports = limiterMiddleware;