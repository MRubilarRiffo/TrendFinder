const { getCategoryByName } = require("../../handlers/category/getCategoryByName");
const { createCategory } = require("../../handlers/category/createCategory");
const { logMessage } = require("../../helpers/logMessage");

const configCategory = async () => {
    try {
        logMessage('Configurando categorías');
        const categories = process.env.DROPI_CATEGORIES.split(',');

        for (const category of categories) {
            let categoryInstance = await getCategoryByName(category);
            if (!categoryInstance) {
                categoryInstance = await createCategory({ name: category });
            };
        };
        logMessage('Categorías configuradas');
        return true;
    } catch (error) {
        throw error;
    };
};

module.exports = { configCategory };