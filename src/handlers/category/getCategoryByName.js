const { Category } = require('../../db');

const getCategoryByName = async (name) => {
    try {
        const category = await Category.findOne({
            where: {
                name: name
            }
        });
        return category;
    } catch (error) {
        console.error('Error al obtener la categoría por nombre:', error);
        throw error; // Propaga el error para que sea manejado por el código que llama a esta función
    }
};

module.exports = { getCategoryByName };