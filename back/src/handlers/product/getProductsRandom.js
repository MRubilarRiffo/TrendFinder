const { Sequelize } = require("sequelize");
const { Product, DailySale, Sale } = require("../../infrastructure/config/database");

const getProductsRandom = async (country, limit = 5) => {
    try {
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);

        const queryOptions = {
            limit,
            attributes: [
                'ProductId',
                [Sequelize.fn('COUNT', Sequelize.col('*')), 'Repeticiones']
            ],
            include: [{
                model: Product,
                where: { country },
                attributes: ['id', 'dropiId', 'name', 'image', 'country'],
                include: Sale
            }],
            group: ['Sale.ProductId'],
            order: [[Sequelize.literal('Repeticiones'), 'DESC']],
            having: Sequelize.literal('COUNT(*) > 5')
        };

        const products = await Sale.findAll(queryOptions);

        return products;
    } catch (error) {
        throw error;
    };
};

module.exports = { getProductsRandom };