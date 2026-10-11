const { SalesSnapshot, Product, Stock } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Handler de Ventas: Lee los datos pre-calculados desde SalesSnapshot.
 * Adaptador de persistencia desacoplado de la serialización de transporte HTTP.
 * 
 * @param {Object|number} optionsOrDays - Objeto de opciones o días para retrocompatibilidad
 * @param {string|null} countryArg - Filtro por país (modo posicional)
 * @param {string} orderColumnArg - Columna de ordenamiento SQL (modo posicional)
 * @param {number} limitArg - Límite de resultados (modo posicional)
 * @param {Object|null} cursorDataArg - Datos planos del cursor { value, id, dir } (modo posicional)
 * @returns {Promise<Object>} Regresa los snapshots encontrados y metadatos de paginación
 */
const getSalesPerformanceData = async (
    optionsOrDays = 7,
    countryArg = null,
    orderColumnArg = 'totalProfit',
    limitArg = 10,
    cursorDataArg = null
) => {
    let periodDays, country, orderColumn, limit, cursorData;

    if (typeof optionsOrDays === 'object' && optionsOrDays !== null) {
        periodDays = optionsOrDays.periodDays !== undefined ? parseInt(optionsOrDays.periodDays, 10) : 7;
        country = optionsOrDays.country || null;
        orderColumn = optionsOrDays.orderColumn || 'totalProfit';
        limit = optionsOrDays.limit || 10;
        cursorData = optionsOrDays.cursorData || null;
    } else {
        periodDays = parseInt(optionsOrDays, 10) || 7;
        country = countryArg;
        orderColumn = orderColumnArg;
        limit = limitArg;
        cursorData = cursorDataArg;
    }

    const validPeriods = [1, 7, 30];
    if (!validPeriods.includes(periodDays)) {
        const error = new Error(`Periodo inválido. Usa: ${validPeriods.join(', ')}`);
        error.statusCode = 400;
        throw error;
    }

    const limitInt = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const whereProduct = country ? { country } : {};
    const whereSnapshot = { periodDays };

    const isPrev = cursorData?.dir === 'prev';

    if (cursorData) {
        const { value, id } = cursorData;
        if (isPrev) {
            whereSnapshot[Op.or] = [
                { [orderColumn]: { [Op.gt]: value } },
                { [orderColumn]: value, id: { [Op.lt]: id } }
            ];
        } else {
            whereSnapshot[Op.or] = [
                { [orderColumn]: { [Op.lt]: value } },
                { [orderColumn]: value, id: { [Op.gt]: id } }
            ];
        }
    }

    const snapshots = await SalesSnapshot.findAll({
        where: whereSnapshot,
        include: [{
            model: Product,
            attributes: ['id', 'name', 'country', 'image', 'sale_price', 'suggested_price', 'url', 'dropiId'],
            where: whereProduct,
            include: [{ model: Stock, attributes: ['quantity'] }]
        }],
        order: isPrev
            ? [[orderColumn, 'ASC'], ['id', 'DESC']]
            : [[orderColumn, 'DESC'], ['id', 'ASC']],
        limit: limitInt + 1
    });

    const hasMore = snapshots.length > limitInt;
    const results = hasMore ? snapshots.slice(0, limitInt) : snapshots;

    if (isPrev) results.reverse();

    return {
        snapshots: results,
        periodDays,
        hasMore,
        isPrev,
        orderColumn
    };
};

module.exports = { getSalesPerformanceData };