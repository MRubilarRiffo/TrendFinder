const { logMessage } = require("../helpers/logMessage");

const errorMiddleware = (err, req, res, next) => {
    // Loguear el error
    logMessage(`Error: ${err.message}`);
    
    // Verificar si el error tiene un código de estado definido
    const statusCode = err.statusCode || 500;

    // Enviar una respuesta de error al cliente
    if (err.validationErrors) {
        // Si hay errores de validación, enviar una respuesta detallada con los errores
        logMessage(JSON.stringify(err.validationErrors));
        res.status(statusCode).json({ error: err.message, validationErrors: err.validationErrors });
    } else {
        // Si no hay errores de validación, enviar una respuesta estándar
        res.status(statusCode).json({ error: err.message });
    }};

module.exports = errorMiddleware;