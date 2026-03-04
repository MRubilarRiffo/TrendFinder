const { SalesSnapshot, Product } = require('../../config/database');
const { Op } = require('sequelize');

/**
 * Handler de Ventas: Lee los datos pre-calculados desde SalesSnapshot con Cursor Pagination bidireccional.
 * 
 * @param {number|string} days - Periodo del snapshot (1, 7 o 30).
 * @param {string|null} country - Filtra por país del producto.
 * @param {string} sortBy - Criterio de orden (profit/sales).
 * @param {number} limit - Cantidad de resultados por página.
 * @param {string|null} cursor - Cursor codificado en base64 (incluye dirección internamente).
 * @returns {Promise<Object>} Regresa los snapshots paginados con cursores bidireccionales.
 */
const getSalesStatsHandler = async (days = 7, country = null, sortBy = 'profit', limit = 10, cursor = null) => {
    const periodDays = parseInt(days);
    const validPeriods = [1, 7, 30];
    if (!validPeriods.includes(periodDays)) {
        throw new Error(`Periodo inválido. Usa: ${validPeriods.join(', ')}`);
    }

    const limitInt = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
    const whereProduct = country ? { country } : {};

    let orderColumn = 'totalProfit';
    if (sortBy === 'sales') orderColumn = 'totalQuantitySold';

    const whereSnapshot = { periodDays };
    let isPrev = false;

    if (cursor) {
        try {
            const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
            const { value, id, dir } = decoded;
            isPrev = dir === 'prev';

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
        } catch {
            throw new Error('Cursor inválido.');
        }
    }

    const snapshots = await SalesSnapshot.findAll({
        where: whereSnapshot,
        include: [{
            model: Product,
            attributes: ['id', 'name', 'country', 'image', 'sale_price', 'suggested_price', 'url', 'dropiId'],
            where: whereProduct
        }],
        order: isPrev
            ? [[orderColumn, 'ASC'], ['id', 'DESC']]
            : [[orderColumn, 'DESC'], ['id', 'ASC']],
        limit: limitInt + 1
    });

    const hasMore = snapshots.length > limitInt;
    const results = hasMore ? snapshots.slice(0, limitInt) : snapshots;

    if (isPrev) results.reverse();

    let nextCursor = null;
    let prevCursor = null;

    if (results.length > 0) {
        const firstItem = results[0];
        const lastItem = results[results.length - 1];

        // prevCursor: dirección 'prev' codificada dentro del cursor
        if (cursor) {
            prevCursor = Buffer.from(JSON.stringify({
                value: parseFloat(firstItem[orderColumn]),
                id: firstItem.id,
                dir: 'prev'
            })).toString('base64');
        }

        // nextCursor: dirección 'next' codificada dentro del cursor
        const hasNext = isPrev ? true : hasMore;
        if (hasNext) {
            nextCursor = Buffer.from(JSON.stringify({
                value: parseFloat(lastItem[orderColumn]),
                id: lastItem.id,
                dir: 'next'
            })).toString('base64');
        }

        if (isPrev && !hasMore) {
            prevCursor = null;
        }
    }

    return { snapshots: results, periodDays, nextCursor, prevCursor };
};

module.exports = { getSalesStatsHandler };