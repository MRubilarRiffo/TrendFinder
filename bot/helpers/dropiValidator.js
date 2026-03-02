const { validations } = require('../../src/helpers/validations');

/**
 * Valida de forma estricta los atributos primarios recibidos de Dropi.
 * Detiene la ejecución arrojando una excepción custom.
 */
const validateDropiProduct = (id, name, stock) => {
    const validationRules = {
        id: { required: true },
        name: { required: true },
        stock: { type: 'number', required: true, greaterThan: -1 }
    };

    const errors = validations({ id, name, stock }, validationRules);

    if (Object.keys(errors).length > 0) {
        const error = new Error(`Se encontraron errores de validación: id ${id ? id : 'null'}, name ${name ? name : 'null'}, stock ${stock ? stock : 'null'}.`);
        error.validationErrors = errors;
        throw error;
    }
};

module.exports = { validateDropiProduct };