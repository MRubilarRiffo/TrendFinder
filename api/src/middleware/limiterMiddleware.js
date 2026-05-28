const rateLimit = require('express-rate-limit');

const limiterMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Límite de 100 solicitudes por ventana
    message: {
        status: 'failed',
        message: 'Demasiadas solicitudes desde esta IP, por favor inténtelo de nuevo más tarde.'
    },
    standardHeaders: true, // Devuelve los encabezados rate-limit estándar
    legacyHeaders: false, // Deshabilita los encabezados rate-limit de la versión anterior
});

module.exports = limiterMiddleware;