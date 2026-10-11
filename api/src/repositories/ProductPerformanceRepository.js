const { Product, Stock, ProductSale } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Obtiene los registros de BD para el análisis estadístico de productos
 * cruzando Producto con Stock y las transacciones dentro de las fechas dictadas.
 * Repositorio puro: sin lógica de cálculo de rangos de fechas de negocio.
 * 
 * @param {number|string} productId - ID primario del producto en Base de Datos.
 * @param {Date} start - Fecha de inicio.
 * @param {Date} end - Fecha de fin.
 * @param {string|null} country - Filtro opcional por país.
 * @returns {Promise<Array>} Regresa los productos encontrados con sus relaciones.
 */
const getProductPerformanceData = async (productId, start, end, country = null) => {
    const whereProduct = { id: productId };
    if (country) {
        whereProduct.country = country;
    }

    const products = await Product.findAll({
        where: whereProduct,
        include: [{
            model: Stock,
            attributes: ['quantity']
        }, {
            model: ProductSale,
            required: false,
            where: {
                saleDate: {
                    [Op.gte]: start,
                    [Op.lte]: end
                }
            },
            order: [['saleDate', 'ASC']]
        }]
    });

    return products;
};

module.exports = { getProductPerformanceData };