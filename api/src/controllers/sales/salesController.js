const { getSalesPerformance } = require('../../domain/SalesPerformance');
const { formatPrice } = require('../../functions/formatPrice');
const { normalizeCountry } = require('../../helpers/validations');

const VALID_PERIODS = [1, 7, 30];
const VALID_SORT_KEYS = ['profit', 'sales', 'revenue', 'performance', 'trend', 'breakout'];

const formatSalesPerformanceResponse = (performanceResponse) => {
    const formattedData = performanceResponse.data.map(item => {
        const { product, metrics, financialBreakdown } = item;
        const country = product.country;

        return {
            productId: product.id,
            dropiId: product.dropiId,
            name: product.name,
            country: product.country,
            image: product.image,
            url: product.url,
            price: formatPrice(product.rawPrice, country),
            rawPrice: product.rawPrice,
            stock: product.stock,

            isDeclining: metrics.isDeclining,
            isHighTicket: metrics.isHighTicket,
            hasLowStock: metrics.hasLowStock,
            isBreakout: metrics.isBreakout,

            suggestedPriceCod: formatPrice(financialBreakdown.cod.suggestedPrice, country),
            unitProfitCod: formatPrice(financialBreakdown.cod.weightedProfit, country),
            rawSuggestedPriceCod: financialBreakdown.cod.suggestedPrice,
            rawUnitProfitCod: financialBreakdown.cod.weightedProfit,

            suggestedPricePrepaid: formatPrice(financialBreakdown.prepaid.suggestedPrice, country),
            unitProfitPrepaid: formatPrice(financialBreakdown.prepaid.netProfit, country),
            rawSuggestedPricePrepaid: financialBreakdown.prepaid.suggestedPrice,
            rawUnitProfitPrepaid: financialBreakdown.prepaid.netProfit,

            suggestedPrice: formatPrice(financialBreakdown.cod.suggestedPrice, country),
            unitProfit: formatPrice(financialBreakdown.cod.weightedProfit, country),

            totalQuantitySold: metrics.totalQuantitySold,
            totalRevenue: formatPrice(metrics.totalRevenue, country),
            totalProfit: formatPrice(metrics.totalProfit, country),
            performanceRate: metrics.performanceRate,
            trendGrowth: metrics.trendGrowth,
            breakoutScore: metrics.breakoutScore,
            calculatedAt: metrics.calculatedAt,
            dailySales: metrics.dailySales,
            dropScore: metrics.dropScore
        };
    });

    return {
        success: true,
        periodDays: performanceResponse.periodDays,
        pagination: performanceResponse.pagination,
        data: formattedData
    };
};

const getSalesStats = async (req, res, next) => {
    try {
        const { days = 7, country, sortBy = 'profit', limit = 10, cursor } = req.query;

        const periodDays = parseInt(days, 10);
        if (!VALID_PERIODS.includes(periodDays)) {
            const error = new Error(`Periodo inválido. Valores permitidos: ${VALID_PERIODS.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        if (sortBy && !VALID_SORT_KEYS.includes(sortBy)) {
            const error = new Error(`Criterio de ordenamiento inválido. Valores permitidos: ${VALID_SORT_KEYS.join(', ')}`);
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

        const limitInt = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

        // Llamada al dominio profundo
        const performanceResponse = await getSalesPerformance(periodDays, normalizedCountry, sortBy, limitInt, cursor);

        // Formatear datos usando el presenter local
        const response = formatSalesPerformanceResponse(performanceResponse);

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

module.exports = { getSalesStats };