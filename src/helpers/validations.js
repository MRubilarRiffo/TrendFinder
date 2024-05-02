const validations = (item) => {
    let error = [];

    if (!item.name) {
        error.push('Falta parámetro "name"');
    };

    if (!item.lastName) {
        error.push('Falta parámetro "lastName"');
    };

    if (!item.email) {
        error.push('Falta parámetro "email"');
    };

    if (!item.password) {
        error.push('Falta parámetro "password"');
    };

    return error;
};

module.exports = { validations };