const CANONICAL_COUNTRIES = {
    'COLOMBIA': 'Colombia',
    'CHILE': 'Chile',
    'MÉXICO': 'México',
    'MEXICO': 'México',
    'PANAMÁ': 'Panamá',
    'PANAMA': 'Panamá',
    'ECUADOR': 'Ecuador',
    'PERÚ': 'Perú',
    'PERU': 'Perú',
    'ESPAÑA': 'España',
    'ESPANA': 'España'
};

const normalizeCountry = (country) => {
    if (!country || typeof country !== 'string') return null;
    const clean = country.trim().toUpperCase();
    return CANONICAL_COUNTRIES[clean] || null;
};

const validatePositiveIntegerId = (id) => {
    if (id === null || id === undefined || id === '') return false;
    const num = Number(id);
    return Number.isInteger(num) && num > 0;
};

const validateDateRange = (startDate, endDate) => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (startDate) {
        if (!isoDateRegex.test(startDate) || isNaN(Date.parse(startDate))) {
            return { valid: false, error: 'startDate debe tener el formato YYYY-MM-DD y ser una fecha válida.' };
        }
    }

    if (endDate) {
        if (!isoDateRegex.test(endDate) || isNaN(Date.parse(endDate))) {
            return { valid: false, error: 'endDate debe tener el formato YYYY-MM-DD y ser una fecha válida.' };
        }
    }

    if (startDate && endDate) {
        if (new Date(startDate) > new Date(endDate)) {
            return { valid: false, error: 'La fecha startDate no puede ser posterior a endDate.' };
        }
    }

    return { valid: true };
};

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
    },
    greaterThan: (value, threshold) => value > threshold,
    lessThan: (value, threshold) => value < threshold,
    positiveInteger: (value) => validatePositiveIntegerId(value),
    country: (value) => Boolean(normalizeCountry(value))
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
        } else if (rule.greaterThan && !validators.greaterThan(value, rule.greaterThan)) {
            errors[field] = `El campo ${field} debe ser mayor que ${rule.greaterThan}`;
        } else if (rule.lessThan && !validators.lessThan(value, rule.lessThan)) {
            errors[field] = `El campo ${field} debe ser menor que ${rule.lessThan}`;
        } else if (rule.custom && !rule.custom(value)) {
            errors[field] = `El campo ${field} no cumple con la validación personalizada`;
        };
    };

    return errors;
};

module.exports = {
    validators,
    validations,
    normalizeCountry,
    validatePositiveIntegerId,
    validateDateRange
};