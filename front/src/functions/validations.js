const validators = {
    string: (value) => typeof value === 'string',
    number: (value) => typeof value === 'number' && !isNaN(value),
    mail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    required: (value) => value !== undefined && value !== null && value !== '',
    length: (value, minLength, maxLength) => {
        if (minLength !== undefined && value.length < minLength) {
            return false;
        };
        if (maxLength !== undefined && value.length > maxLength) {
            return false;
        };
        return true;
    },
    greaterThan: (value, threshold) => value > threshold,
    lessThan: (value, threshold) => value < threshold
};

const validations = (data, rules) => {
    const errors = {};

    for (const field in rules) {
        const rule = rules[field];
        const value = data[field];

        if (rule.required && !validators.required(value)) {
            errors[field] = `${field} es requerido.`;
        } else if (rule.type && !validators[rule.type](value)) {
            errors[field] = `${field} debe ser de tipo ${rule.type}.`;
        } else if (rule.length && !validators.length(value, rule.length.min, rule.length.max)) {
            if (rule.length.min !== undefined && rule.length.max !== undefined) {
                errors[field] = `${field} debe tener entre ${rule.length.min} y ${rule.length.max} caracteres.`;
            } else if (rule.length.min !== undefined) {
                errors[field] = `${field} debe tener al menos ${rule.length.min} caracteres.`;
            } else if (rule.length.max !== undefined) {
                errors[field] = `${field} debe tener como máximo ${rule.length.max} caracteres.`;
            };
        } else if (rule.greaterThan && !validators.greaterThan(value, rule.greaterThan)) {
            errors[field] = `${field} debe ser mayor que ${rule.greaterThan}.`;
        } else if (rule.lessThan && !validators.lessThan(value, rule.lessThan)) {
            errors[field] = `${field} debe ser menor que ${rule.lessThan}.`;
        } else if (rule.custom && !rule.custom(value)) {
            errors[field] = `${field} no cumple con la validación personalizada.`;
        };
    };

    return errors;
};

export default validations;