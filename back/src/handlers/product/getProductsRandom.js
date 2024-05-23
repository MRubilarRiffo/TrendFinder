const { Sequelize, Op } = require("sequelize");
const { Product, CountSale } = require("../../config/database");

const getProductsRandom = async (country, limit = 5) => {
    try {
        const queryOptions = {
            where: {
                repeat: { [Op.gte]: 50 },
            },
            include: [{
                model: Product,
                where: { country },
                attributes: ['id', 'dropiId', 'name', 'image', 'country'],
            }],
            order: [['repeat', 'DESC']],
            limit
        };

        const products = CountSale.findAll(queryOptions);

        return products;
    } catch (error) {
        throw error;
    };
};

module.exports = { getProductsRandom };