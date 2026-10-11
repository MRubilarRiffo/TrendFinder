/**
 * Helper de Paginación por Cursor
 * Desacopla la codificación/decodificación Base64 de la capa de persistencia (SQL).
 */

/**
 * Codifica un objeto de posición en un cursor Base64 seguro para HTTP.
 * 
 * @param {Object} data - { value: number, id: number, dir: 'prev'|'next' }
 * @returns {string} Cursor codificado en Base64
 */
const encodeCursor = ({ value, id, dir }) => {
    return Buffer.from(JSON.stringify({ value, id, dir })).toString('base64');
};

/**
 * Decodifica y valida un cursor Base64 recibido desde la petición HTTP.
 * 
 * @param {string|null} cursor - Cursor Base64
 * @returns {Object|null} { value: number, id: number, dir: 'prev'|'next' } o null si no se envía
 */
const decodeCursor = (cursor) => {
    if (!cursor) return null;

    try {
        const decodedStr = Buffer.from(cursor, 'base64').toString('utf-8');
        const parsed = JSON.parse(decodedStr);

        if (
            typeof parsed !== 'object' ||
            parsed === null ||
            parsed.value === undefined ||
            parsed.id === undefined ||
            parsed.dir === undefined
        ) {
            const err = new Error('Cursor inválido.');
            err.statusCode = 400;
            throw err;
        }

        return {
            value: Number(parsed.value),
            id: Number(parsed.id),
            dir: parsed.dir === 'prev' ? 'prev' : 'next'
        };
    } catch (err) {
        if (err.statusCode) throw err;
        const error = new Error('Cursor inválido.');
        error.statusCode = 400;
        throw error;
    }
};

/**
 * Construye los cursores nextCursor y prevCursor a partir de los resultados y estado de la consulta.
 * 
 * @param {Object} params
 * @returns {{ prevCursor: string|null, nextCursor: string|null }}
 */
const buildPaginationCursors = ({ results = [], orderColumn = 'totalProfit', hasMore = false, isPrev = false, currentCursor = null }) => {
    let nextCursor = null;
    let prevCursor = null;

    if (results.length > 0) {
        const firstItem = results[0];
        const lastItem = results[results.length - 1];

        // prevCursor
        if (currentCursor) {
            prevCursor = encodeCursor({
                value: parseFloat(firstItem[orderColumn]),
                id: firstItem.id,
                dir: 'prev'
            });
        }

        // nextCursor
        const hasNext = isPrev ? true : hasMore;
        if (hasNext) {
            nextCursor = encodeCursor({
                value: parseFloat(lastItem[orderColumn]),
                id: lastItem.id,
                dir: 'next'
            });
        }

        if (isPrev && !hasMore) {
            prevCursor = null;
        }
    }

    return { prevCursor, nextCursor };
};

module.exports = {
    encodeCursor,
    decodeCursor,
    buildPaginationCursors
};
