const { Product, Stock } = require('../../config/database');

/**
 * Obtiene los últimos productos agregados a la base de datos.
 * @param {number|string} limit - Cantidad límite de productos a retornar (defecto 10).
 * @param {string|null} country - Filtro opcional por país.
 * @returns {Promise<Array>} Regresa arreglo de productos con su stock.
 */
const getLatestProductsFromDb = async (limit = 10, country = null) => {
    const limitInt = parseInt(limit, 10) || 10;

    let whereClause = {};
    if (country) {
        whereClause.country = country;
    }
    const products = await Product.findAll({
        where: whereClause,
        include: [{
            model: Stock,
            attributes: ['quantity']
        }],
        order: [['createdAt', 'DESC']],
        limit: limitInt
    });

    return products;
};

module.exports = { getLatestProductsFromDb };