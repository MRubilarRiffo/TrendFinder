const { getCategoryByName } = require("../handlers/category/getCategoryByName");
const { createCategory } = require("../handlers/category/createCategory");

const verifyCategory = async () => {
    try {
        const categories = process.env.DROPI_CATEGORIES.split(',');

        for (const category of categories) {
            let categoryInstance = await getCategoryByName(category);
            if (!categoryInstance) {
                categoryInstance = await createCategory({ name: category });
            };
        };

        return true;
    } catch (error) {
        throw error;
    };
};

module.exports = { verifyCategory };