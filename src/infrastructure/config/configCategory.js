const { getCategoryByName } = require("../../handlers/category/getCategoryByName");
const { createCategory } = require("../../handlers/category/createCategory");
const { logMessage } = require("../../helpers/logMessage");
const { config } = require("./config");

const configCategory = async () => {
    try {
        logMessage('Configurando categorías');
        const categories = config.dropi_categories;

        for (const category of categories) {
            let categoryInstance = await getCategoryByName(category);
            if (!categoryInstance) {
                categoryInstance = await createCategory(category);
            };
        };
        logMessage('Categorías configuradas');
        return true;
    } catch (error) {
        throw error;
    };
};

module.exports = { configCategory };