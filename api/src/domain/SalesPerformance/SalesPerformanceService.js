const { getSalesPerformanceData } = require('../../repositories/SalesRepository');
const { calculateSuggestedPrices, getHighTicketThreshold } = require('../../functions/financialCalculations');
const { calculateDropScore } = require('../../functions/salesCalculations');
const { decodeCursor, buildPaginationCursors } = require('../../helpers/cursorPagination');

const SORT_OPTIONS = {
    profit: 'totalProfit',
    sales: 'totalQuantitySold',
    revenue: 'totalRevenue',
    performance: 'performanceRate',
    trend: 'trendGrowth',
    breakout: 'breakoutScore'
};

const getSalesPerformance = async (days = 7, country = null, sortBy = 'profit', limit = 10, cursor = null) => {
    const periodDays = parseInt(days, 10) || 7;
    const orderColumn = SORT_OPTIONS[sortBy] || 'totalProfit';
    const cursorData = decodeCursor(cursor);

    const repoResult = await getSalesPerformanceData({
        periodDays,
        country,
        orderColumn,
        limit,
        cursorData
    });

    const { snapshots, hasMore, isPrev } = repoResult;

    const data = snapshots.map(snapshot => {
        const product = snapshot.Product;
        const salePrice = parseFloat(product.sale_price) || 0;
        const financial = calculateSuggestedPrices(salePrice, { country: product.country });

        const suggestedPriceCod = financial.cod.suggestedPrice;
        const dropScore = calculateDropScore({
            salePrice,
            suggestedPriceCod,
            trendGrowth: snapshot.trendGrowth,
            totalQuantitySold: snapshot.totalQuantitySold,
            periodDays,
            isBreakout: snapshot.isBreakout
        });

        const trendGrowthVal = parseFloat(snapshot.trendGrowth) || 0;
        const isDeclining = trendGrowthVal <= -50;
        const isHighTicket = salePrice >= getHighTicketThreshold(product.country);
        const stockQty = product.Stock ? product.Stock.quantity : 0;
        const hasLowStock = stockQty > 0 && stockQty <= 50;

        return {
            product: {
                id: snapshot.ProductId,
                dropiId: product.dropiId,
                name: product.name,
                country: product.country,
                image: product.image,
                url: product.url,
                rawPrice: salePrice,
                stock: stockQty,
            },
            metrics: {
                dropScore,
                isDeclining,
                isHighTicket,
                hasLowStock,
                isBreakout: Boolean(snapshot.isBreakout),
                totalQuantitySold: snapshot.totalQuantitySold,
                totalRevenue: parseFloat(snapshot.totalRevenue) || 0,
                totalProfit: parseFloat(snapshot.totalProfit) || 0,
                performanceRate: parseFloat(snapshot.performanceRate) || 0,
                trendGrowth: trendGrowthVal,
                breakoutScore: parseFloat(snapshot.breakoutScore) || 0,
                dailySales: snapshot.dailySales || [],
                calculatedAt: snapshot.calculatedAt
            },
            financialBreakdown: financial
        };
    });

    const pagination = buildPaginationCursors({
        results: snapshots,
        orderColumn,
        hasMore,
        isPrev,
        currentCursor: cursor
    });

    return {
        periodDays,
        pagination,
        data
    };
};

module.exports = { getSalesPerformance };
