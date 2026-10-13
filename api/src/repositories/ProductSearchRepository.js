const { Product, Stock } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Normaliza y divide el texto de búsqueda en tokens de palabras seguras,
 * neutralizando comodines de SQL (% y _) y barras invertidas para evitar
 * manipulación de consultas LIKE o wildcard injection.
 * 
 * @param {string} str - Cadena de texto de búsqueda.
 * @returns {Array<string>} Arreglo de tokens limpios y no vacíos.
 */
const extractSearchTokens = (str) => {
    if (!str || typeof str !== 'string') return [];
    return str
        .replace(/[%_\\]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 0);
};

/**
 * Mapeo de criterios de ordenamiento seguros a columnas y direcciones de SQL.
 */
const ORDER_MAP = {
    recent: [['createdAt', 'DESC'], ['id', 'DESC']],
    oldest: [['createdAt', 'ASC'], ['id', 'ASC']],
    price_asc: [['sale_price', 'ASC'], ['id', 'ASC']],
    price_desc: [['sale_price', 'DESC'], ['id', 'ASC']],
    name_asc: [['name', 'ASC'], ['id', 'ASC']],
    name_desc: [['name', 'DESC'], ['id', 'ASC']]
};

/**
 * Repositorio puro para la búsqueda y filtrado de productos en base de datos.
 * Desacoplado de capas de transporte HTTP y de controladores.
 * 
 * @param {Object} params
 * @param {string} params.searchTerm - Término de búsqueda (mínimo 2 caracteres).
 * @param {string|null} [params.country=null] - Filtro opcional por país.
 * @param {number} [params.limit=10] - Cantidad máxima de resultados por página (1-50).
 * @param {number} [params.page=1] - Número de página (1-indexed).
 * @param {string} [params.sortBy='recent'] - Criterio de ordenamiento.
 * @returns {Promise<{ products: Array, totalMatches: number, totalPages: number, page: number, limit: number, hasNextPage: boolean, hasPrevPage: boolean }>}
 */
const searchProductsData = async ({
    searchTerm,
    country = null,
    limit = 10,
    page = 1,
    sortBy = 'recent'
}) => {
    const limitInt = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const pageInt = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (pageInt - 1) * limitInt;

    const whereConditions = [];

    // 1. Filtro opcional por país
    if (country) {
        whereConditions.push({ country });
    }

    // 2. Tokenización y búsqueda multi-palabra / Dropi ID
    const trimmed = (searchTerm || '').trim();
    const isNumeric = /^\d+$/.test(trimmed);

    const tokens = extractSearchTokens(trimmed);

    if (tokens.length > 0) {
        const textMatchConditions = tokens.map(token => ({
            name: { [Op.like]: `%${token}%` }
        }));

        if (isNumeric) {
            const numericId = parseInt(trimmed, 10);
            whereConditions.push({
                [Op.or]: [
                    { dropiId: numericId },
                    { id: numericId },
                    { [Op.and]: textMatchConditions }
                ]
            });
        } else {
            whereConditions.push({
                [Op.and]: textMatchConditions
            });
        }
    }

    const whereClause = whereConditions.length > 0
        ? { [Op.and]: whereConditions }
        : {};

    const order = ORDER_MAP[sortBy] || ORDER_MAP.recent;

    const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        include: [{
            model: Stock,
            attributes: ['quantity']
        }],
        order,
        limit: limitInt,
        offset,
        distinct: true
    });

    const totalPages = Math.ceil(count / limitInt) || (count > 0 ? 1 : 0);

    return {
        products: rows,
        totalMatches: count,
        totalPages,
        page: pageInt,
        limit: limitInt,
        hasNextPage: pageInt < totalPages,
        hasPrevPage: pageInt > 1 && totalPages > 0
    };
};

module.exports = {
    searchProductsData,
    extractSearchTokens,
    ORDER_MAP
};
