const { searchProductCatalogue } = require('../../domain/ProductCatalogue');
const { formatPrice } = require('../../functions/formatPrice');
const { normalizeCountry, validatePositiveIntegerId } = require('../../helpers/validations');

const VALID_SORT_KEYS = ['recent', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'];

/**
 * Presenter para dar formato a los productos encontrados en la búsqueda.
 * Garantiza consistencia con las respuestas de latest y stats.
 */
const formatSearchProductsResponse = (products) => {
    return products.map(product => {
        const country = product.country;
        const financial = product.financialBreakdown;

        return {
            productId: product.id,
            dropiId: product.dropiId,
            name: product.name,
            country: product.country,
            image: product.image,
            price: formatPrice(product.rawPrice, country),
            rawPrice: product.rawPrice,

            suggestedPriceCod: formatPrice(financial.cod.suggestedPrice, country),
            unitProfitCod: formatPrice(financial.cod.weightedProfit, country),
            suggestedPricePrepaid: formatPrice(financial.prepaid.suggestedPrice, country),
            unitProfitPrepaid: formatPrice(financial.prepaid.netProfit, country),

            suggestedPrice: formatPrice(financial.cod.suggestedPrice, country),
            unitProfit: formatPrice(financial.cod.weightedProfit, country),

            stock: product.stock,
            url: product.url,
            addedAt: product.addedAt
        };
    });
};

/**
 * Controlador HTTP para la búsqueda de productos.
 * Valida parámetros de consulta y delega en la capa de dominio.
 */
const searchProducts = async (req, res, next) => {
    try {
        const { q, country, limit = 10, page = 1, sortBy = 'recent' } = req.query;

        // 1. Validación estricta del término de búsqueda (q)
        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            const error = new Error('El parámetro de búsqueda "q" es requerido.');
            error.statusCode = 400;
            throw error;
        }

        const trimmedQ = q.trim();

        const usefulLength = trimmedQ.replace(/[%_\\]/g, '').trim().length;
        if (trimmedQ.length < 2 || usefulLength < 2) {
            const error = new Error('El parámetro de búsqueda "q" debe tener al menos 2 caracteres.');
            error.statusCode = 400;
            throw error;
        }

        if (trimmedQ.length > 100) {
            const error = new Error('El parámetro de búsqueda "q" no puede exceder 100 caracteres.');
            error.statusCode = 400;
            throw error;
        }

        // 2. Validación de país
        let normalizedCountry = null;
        if (country) {
            normalizedCountry = normalizeCountry(country);
            if (!normalizedCountry) {
                const error = new Error('País no válido. Países soportados: Colombia, Chile, México, Panamá, Ecuador, Perú, España');
                error.statusCode = 400;
                throw error;
            }
        }

        // 3. Validación de número de página
        if (page !== undefined && page !== null && page !== '') {
            if (!validatePositiveIntegerId(page)) {
                const error = new Error('El parámetro "page" debe ser un número entero positivo.');
                error.statusCode = 400;
                throw error;
            }
        }
        const pageInt = parseInt(page, 10) || 1;

        // 4. Validación de límite
        if (limit !== undefined && limit !== null && limit !== '') {
            if (!validatePositiveIntegerId(limit)) {
                const error = new Error('El parámetro "limit" debe ser un número entero positivo.');
                error.statusCode = 400;
                throw error;
            }
        }
        const limitInt = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

        // 5. Validación de criterio de ordenamiento
        if (sortBy && !VALID_SORT_KEYS.includes(sortBy)) {
            const error = new Error(`Criterio de ordenamiento inválido. Valores permitidos: ${VALID_SORT_KEYS.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        // 6. Consulta al servicio de dominio
        const result = await searchProductCatalogue({
            searchTerm: trimmedQ,
            country: normalizedCountry,
            limit: limitInt,
            page: pageInt,
            sortBy
        });

        // 7. Formatear productos mediante presenter
        const formattedData = formatSearchProductsResponse(result.products);

        return res.status(200).json({
            success: true,
            query: trimmedQ,
            pagination: {
                page: result.page,
                limit: result.limit,
                totalMatches: result.totalMatches,
                totalPages: result.totalPages,
                hasNextPage: result.hasNextPage,
                hasPrevPage: result.hasPrevPage
            },
            data: formattedData
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    searchProducts,
    formatSearchProductsResponse,
    VALID_SORT_KEYS
};
