const { logMessage } = require("../helpers/logMessage");

const errorMiddleware = (err, req, res) => {
    // Loguear el error
    logMessage(`Error: ${err.message}`);

    // Verificar si el error tiene un código de estado definido
    const statusCode = err.statusCode || 500;

    // Enviar una respuesta de error al cliente
    if (err.validationErrors) {
        // Validación extra si es necesario
        res.status(statusCode).json({
            success: false,
            error: err.message,
            validationErrors: err.validationErrors
        });
    } else {
        // Si no hay errores de validación, enviar una respuesta estándar
        res.status(statusCode).json({ success: false, error: err.message });
    }
};

module.exports = errorMiddleware;