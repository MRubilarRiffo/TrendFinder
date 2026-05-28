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
    // Igualamos el comportamiento al cron: tomamos fechas truncadas a medianoche (00:00:00)
    const now = new Date();

    // El "final" de nuestros reportes siempre será a las 00:00 del día en curso (o de endDate si se envía)
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (endDate) {
        end = new Date(endDate);
        // Si el usuario da una fecha exacta con formato YYYY-MM-DD, esto ya será a las 00:00:00 UTC
        // Aseguramos que sea el comienzo de ESE día
        end.setHours(0, 0, 0, 0);
    }

    let start = new Date(end);
    start.setDate(end.getDate() - 30); // 30 días antes por defecto respecto al endDate

    if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
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