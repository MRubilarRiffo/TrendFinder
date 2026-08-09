const { Product, Stock, ProductSale } = require('../config/database');
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
const getProductPerformanceData = async (productId, startDate, endDate, country = null) => {

    // Configurar fechas límites por defecto si no vienen, 
    // Igualamos el comportamiento al cron: tomamos fechas truncadas a medianoche (00:00:00)
    const now = new Date();

    // El "final" de nuestros reportes debe incluir todo el día en curso (hasta las 23:59:59.999)
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (endDate) {
        // Parsear fecha YYYY-MM-DD y colocar a las 23:59:59.999 del día
        const parts = endDate.split('-');
        if (parts.length === 3) {
            end = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59, 999);
        } else {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }
    }

    let start = new Date(end);
    start.setDate(end.getDate() - 30); // 30 días antes por defecto respecto al endDate
    start.setHours(0, 0, 0, 0);

    if (startDate) {
        const parts = startDate.split('-');
        if (parts.length === 3) {
            start = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0, 0);
        } else {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
        }
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
                    [Op.gte]: start,
                    [Op.lte]: end
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

module.exports = { getProductPerformanceData };