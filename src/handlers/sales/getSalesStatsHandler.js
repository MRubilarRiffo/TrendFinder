const { ProductSale, Product } = require('../../config/database');
const { Op } = require('sequelize');

/**
 * Handler de Ventas: Exclusivamente extrae los registros de Base de Datos.
 * 
 * @param {number|string} days - Días hacia atrás a consultar.
 * @param {string|null} country - Filtra las ventas por país.
 * @param {string|null} startDate - Fecha inicio de rango.
 * @param {string|null} endDate - Fecha límite de rango.
 * @param {number|string} limit - Cantidad límite por página.
 * @param {number|string} offset - Retraso del índice para DB.
 * @param {string} sortBy - Criterio para el DB GROUP BY (profit/sales).
 * @returns {Promise<Object>} Regresa data pre-agrupada { topProducts, historySales, totalCount, daysEvaluated, midDateLimit }
 */
const getSalesStatsHandler = async (days = 7, country = null, startDate = null, endDate = null, limit = 10, offset = 0, sortBy = 'profit') => {
    let dateLimit = new Date();
    let daysInt = parseInt(days);
    let endLimit = new Date();
    if (startDate) {
        dateLimit = new Date(startDate);
        if (endDate) {
            endLimit = new Date(endDate);
            endLimit.setHours(23, 59, 59, 999);
        }

        // Recalcular los días para el midDateLimit si hay fechas específicas
        const diffTime = Math.abs(endLimit - dateLimit);
        daysInt = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    } else {
        dateLimit.setDate(dateLimit.getDate() - daysInt);
    }

    // Para calcular velocidad de tendencia, dividimos el periodo a la mitad
    const midDateLimit = new Date(dateLimit.getTime() + ((endLimit.getTime() - dateLimit.getTime()) / 2));

    const whereProduct = country ? { country } : {};

    const limitInt = parseInt(limit) || 10;
    const offsetInt = parseInt(offset) || 0;

    let orderLiteral = 'totalProfit DESC';
    if (sortBy === 'sales') orderLiteral = 'totalQuantitySold DESC';

    // 1. Obtener conteo absoluto de productos distintos con ventas en el periodo (Para Total Pages)
    const totalCount = await ProductSale.count({
        distinct: true,
        col: 'ProductId',
        where: {
            saleDate: { [Op.between]: [dateLimit, endLimit] }
        },
        include: [{ model: Product, where: whereProduct }]
    });

    // 2. Extraer Top N ya sumados matemáticamente y ordenados por DB (Ahorro de Memoria)
    const topProducts = await ProductSale.findAll({
        attributes: [
            'ProductId',
            [ProductSale.sequelize.fn('sum', ProductSale.sequelize.col('quantitySold')), 'totalQuantitySold'],
            [ProductSale.sequelize.literal('SUM(quantitySold * (Product.suggested_price - Product.sale_price))'), 'totalProfit']
        ],
        where: {
            saleDate: {
                [Op.between]: [dateLimit, endLimit]
            }
        },
        include: [{
            model: Product,
            attributes: ['id', 'name', 'country', 'image', 'sale_price', 'suggested_price'],
            where: whereProduct
        }],
        group: ['ProductId', 'Product.id'],
        order: ProductSale.sequelize.literal(orderLiteral),
        limit: limitInt,
        offset: offsetInt,
        raw: true,
        nest: true
    });

    // 3. Extraer transacciones transitorias únicamente de esos N productos top, para el historial
    const topProductIds = topProducts.map(tp => tp.ProductId);
    let historySales = [];
    if (topProductIds.length > 0) {
        historySales = await ProductSale.findAll({
            where: {
                ProductId: { [Op.in]: topProductIds },
                saleDate: { [Op.between]: [dateLimit, endLimit] }
            },
            order: [['saleDate', 'ASC']],
            raw: true
        });
    }

    return {
        topProducts,
        historySales,
        totalCount,
        daysEvaluated: daysInt,
        midDateLimit
    };
};

module.exports = { getSalesStatsHandler };