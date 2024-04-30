const { Stock } = require('../../infrastructure/config/database');
const { logMessage } = require('../../helpers/logMessage');

const getStockFindOne = async (productId) => {
    try {
        const stock = await Stock.findOne({
            where: { ProductId: productId },
            order: [['createdAt', 'DESC']],
        });

        return stock;
    } catch (error) {
        logMessage('Error al obtener stock: ' + error);
        throw error;
    };
};

module.exports = { getStockFindOne };