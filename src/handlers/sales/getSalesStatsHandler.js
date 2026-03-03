const { SalesSnapshot, Product } = require('../../config/database');

/**
 * Handler de Ventas: Lee los datos pre-calculados desde SalesSnapshot.
 * 
 * @param {number|string} days - Periodo del snapshot (1, 7 o 30).
 * @param {string|null} country - Filtra por país del producto.
 * @param {string} sortBy - Criterio de orden (profit/sales).
 * @returns {Promise<Array>} Regresa los snapshots con datos del producto incluidos.
 */
const getSalesStatsHandler = async (days = 7, country = null, sortBy = 'profit') => {
    const periodDays = parseInt(days);
    const validPeriods = [1, 7, 30];
    if (!validPeriods.includes(periodDays)) {
        throw new Error(`Periodo inválido. Usa: ${validPeriods.join(', ')}`);
    }

    const whereProduct = country ? { country } : {};

    let orderColumn = 'totalProfit';
    if (sortBy === 'sales') orderColumn = 'totalQuantitySold';

    const snapshots = await SalesSnapshot.findAll({
        where: { periodDays },
        include: [{
            model: Product,
            attributes: ['id', 'name', 'country', 'image', 'sale_price', 'suggested_price'],
            where: whereProduct
        }],
        order: [[orderColumn, 'DESC']],
        raw: true,
        nest: true
    });

    return { snapshots, periodDays };
};

module.exports = { getSalesStatsHandler };