const { Category } = require('../../db');
const { logMessage } = require('../../helpers/logMessage');

const createCategory = async (props) => {
    try {
        const createdCategory = await Category.create(props);

        return createdCategory;
    } catch (error) {
        logMessage('Error al crear la categoría:', error);
        throw error; // Propaga el error para que sea manejado por el código que llama a esta función
    };
};

module.exports = { createCategory };