const { Product, Stock, ProductSale } = require('../../config/database');
const { Op } = require('sequelize');

/**
 * Obtiene los registros de BD para el análisis estadístico de productos
 * cruzando Producto con Stock y las transacciones dentro de las fechas dictadas.
 * 
 * @param {number|string} productId - ID primario del producto en Base de Datos.
 * @param {string} startDate - Fecha de inicio para evaluar (YYYY-MM-DD).
 * @param {string} endDate - Fecha de fin para evaluar (YYYY-MM-DD).
 * @param {string|null} country - Filtro opcional por país.
 * @returns {Promise<Object>} Regresa la información cruda { products, daysEvaluated, start, end, midDateLimit }
 */
const getProductsStatsFromDb = async (productId, startDate, endDate, country = null) => {

    // Configurar fechas límites por defecto si no vienen, 
    // asumimos por ejemplo los últimos 30 días si no hay filtro de fechas para tener un análisis amplio.
    let start = new Date();
    start.setDate(start.getDate() - 30);
    let end = new Date();

    if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
    }
    if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    }

    // Calcular la cantidad de días evaluados
    const timeDiff = end.getTime() - start.getTime();
    const daysEvaluated = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24))); // Al menos 1 día

    // Punto medio para calcular tendencias
    const midDateLimit = new Date(start.getTime() + (timeDiff / 2));

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
                    [Op.between]: [start, end]
                }
            },
            order: [['saleDate', 'ASC']]
        }]
    });

    return {
        products,
        daysEvaluated,
        start,
        end,
        midDateLimit
    };
};

module.exports = { getProductsStatsFromDb };