const { getSalesPerformance } = require('../../domain/SalesPerformance');
const { formatPrice } = require('../../functions/formatPrice');

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
        const { days, country, sortBy, limit, cursor } = req.query;

        // Llamada al dominio profundo
        const performanceResponse = await getSalesPerformance(days, country, sortBy, limit, cursor);

        // Formatear datos usando el presenter local
        const response = formatSalesPerformanceResponse(performanceResponse);

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

module.exports = { getSalesStats };