const validators = {
    string: (value) => typeof value === 'string',
    number: (value) => typeof value === 'number' && !isNaN(value),
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    required: (value) => value !== undefined && value !== null && value !== '',
    length: (value, minLength, maxLength) => {
        if (minLength !== undefined && value.length < minLength) {
            return false;
        };
        if (maxLength !== undefined && value.length > maxLength) {
            return false;
        };
        return true;
    }
};

const validations = (data, rules) => {
    const errors = {};

    for (const field in rules) {
        const rule = rules[field];
        const value = data[field];

        if (rule.required && !validators.required(value)) {
            errors[field] = `${field} es un campo requerido`;
        } else if (rule.type && !validators[rule.type](value)) {
            errors[field] = `El campo ${field} debe ser de tipo ${rule.type}`;
        } else if (rule.length && !validators.length(value, rule.length.min, rule.length.max)) {
            if (rule.length.min !== undefined && rule.length.max !== undefined) {
                errors[field] = `El campo ${field} debe tener entre ${rule.length.min} y ${rule.length.max} caracteres`;
            } else if (rule.length.min !== undefined) {
                errors[field] = `El campo ${field} debe tener al menos ${rule.length.min} caracteres`;
            } else if (rule.length.max !== undefined) {
                errors[field] = `El campo ${field} debe tener como máximo ${rule.length.max} caracteres`;
            };
        } else if (rule.custom && !rule.custom(value)) {
            errors[field] = `El campo ${field} no cumple con la validación personalizada`;
        };
    };

    return errors;
};

module.exports = { validations };