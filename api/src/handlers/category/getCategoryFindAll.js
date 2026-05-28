const { Category } = require('../../config/database');

const getCategoryFindAll = async () => {
    try {
        const categories = await Category.findAll();

        return categories;
    } catch (error) {
        throw error;
    };
};

module.exports = { getCategoryFindAll };