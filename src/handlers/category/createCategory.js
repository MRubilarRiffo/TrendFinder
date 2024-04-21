const { Category } = require('../../db');

const createCategory = async (props) => {
    try {
        const createdCategory = await Category.create(props);

        return createdCategory;
    } catch (error) {
        console.error('Error al crear la categoría:', error);
        throw error; // Propaga el error para que sea manejado por el código que llama a esta función
    };
};

module.exports = { createCategory };