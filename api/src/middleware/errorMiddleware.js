const { logMessage } = require("../helpers/logMessage");

const errorMiddleware = (err, req, res, next) => {
    // Loguear el error
    logMessage(`Error: ${err.message}`);

    // Verificar si el error tiene un código de estado definido
    const statusCode = err.statusCode || 500;

    // Sanitizar mensaje en producción para errores 500 (evitar fugas de DB o internals)
    const errorMessage = (statusCode >= 500 && process.env.NODE_ENV === 'production')
        ? 'Error interno del servidor'
        : err.message;

    // Enviar una respuesta de error al cliente
    if (err.validationErrors) {
        // Validación extra si es necesario
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            validationErrors: err.validationErrors
        });
    } else {
        // Si no hay errores de validación, enviar una respuesta estándar
        res.status(statusCode).json({ success: false, error: errorMessage });
    }
};

module.exports = errorMiddleware;