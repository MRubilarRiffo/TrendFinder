const { Stock } = require('../../db');

const getStockFindOne = async (productId) => {
    try {
        const stock = await Stock.findOne({
            where: { ProductId: productId },
            order: [['createdAt', 'DESC']],
        });

        return stock;
    } catch (error) {
        console.log('Error al obtener stock: ' + error);
        throw error;
    };
};

module.exports = { getStockFindOne };