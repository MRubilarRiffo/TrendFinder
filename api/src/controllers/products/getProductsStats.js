const { getProductPerformance } = require('../../domain/ProductPerformance');
const { formatPrice } = require('../../functions/formatPrice');
const { validatePositiveIntegerId, validateDateRange, normalizeCountry } = require('../../helpers/validations');

/**
 * Presenter (formateador) para transformar las métricas crudas de dominio en 
 * el formato esperado por el frontend (con strings de moneda, estructura exacta, etc.).
 */
const formatProductStatsResponse = (performanceData) => {
    const { product, period, metrics, financialBreakdown, salesHistory } = performanceData;

    return {
        productId: product.id,
        dropiId: product.dropiId,
        name: product.name,
        country: product.country,
        image: product.image,
        url: product.url,
        stock: product.stock,
        price: formatPrice(product.rawPrice, product.country),
        rawPrice: product.rawPrice,
        
        dropScore: metrics.dropScore,
        isDeclining: metrics.isDeclining,
        isHighTicket: metrics.isHighTicket,
        hasLowStock: metrics.hasLowStock,

        // Precios Sugeridos y Ganancias Limpias (Formateados)
        suggestedPriceCod: formatPrice(financialBreakdown.cod.suggestedPrice, product.country),
        unitProfitCod: formatPrice(financialBreakdown.cod.weightedProfit, product.country),
        rawSuggestedPriceCod: financialBreakdown.cod.suggestedPrice,
        rawUnitProfitCod: financialBreakdown.cod.weightedProfit,

        suggestedPricePrepaid: formatPrice(financialBreakdown.prepaid.suggestedPrice, product.country),
        unitProfitPrepaid: formatPrice(financialBreakdown.prepaid.netProfit, product.country),
        rawSuggestedPricePrepaid: financialBreakdown.prepaid.suggestedPrice,
        rawUnitProfitPrepaid: financialBreakdown.prepaid.netProfit,

        // Retrocompatibilidad
        suggestedPrice: formatPrice(financialBreakdown.cod.suggestedPrice, product.country),
        unitProfit: formatPrice(financialBreakdown.cod.weightedProfit, product.country),

        financialBreakdown,

        salesInfo: {
            totalQuantitySold: metrics.totalQuantitySold,
            totalRevenue: formatPrice(metrics.totalRevenue, product.country),
            totalProfit: formatPrice(metrics.totalProfit, product.country),
            salesAverage: metrics.salesAverage,
            maxDailySales: metrics.maxDailySales,
            trendGrowthPercentage: metrics.trendGrowthPercentage,
            isBreakout: metrics.isBreakout,
            breakoutScore: metrics.breakoutScore
        },
        salesHistory
    };
};

/**
 * Adaptador HTTP para las estadísticas de un producto.
 * Extrae parámetros, llama al caso de uso de dominio, y usa un presenter para la respuesta.
 */
const getProductsStats = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, country } = req.query;

        if (!validatePositiveIntegerId(id)) {
            const error = new Error('ID de producto inválido. Debe ser un número entero positivo.');
            error.statusCode = 400;
            throw error;
        }

        const dateValidation = validateDateRange(startDate, endDate);
        if (!dateValidation.valid) {
            const error = new Error(dateValidation.error);
            error.statusCode = 400;
            throw error;
        }

        let normalizedCountry = null;
        if (country) {
            normalizedCountry = normalizeCountry(country);
            if (!normalizedCountry) {
                const error = new Error('País no válido. Países soportados: Colombia, Chile, México, Panamá, Ecuador, Perú, España');
                error.statusCode = 400;
                throw error;
            }
        }

        // Llamada al módulo profundo (Domain Service)
        const performanceData = await getProductPerformance(id, startDate, endDate, normalizedCountry);

        // Formatear datos crudos para la vista (Presenter)
        const productStats = formatProductStatsResponse(performanceData);

        return res.status(200).json({
            success: true,
            period: performanceData.period,
            data: productStats
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProductsStats };