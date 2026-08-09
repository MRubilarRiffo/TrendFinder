const { getProductPerformanceData } = require('../../repositories/ProductPerformanceRepository');
const { calculateSalesAverage, calculateTrendGrowth, calculateBreakoutMetrics, calculateDropScore } = require('../../functions/salesCalculations');
const { calculateSuggestedPrices } = require('../../functions/financialCalculations');

/**
 * Orquestador principal de la lógica de dominio para el rendimiento de un producto.
 * Realiza cálculos matemáticos sin preocuparse del formato de la interfaz de usuario.
 */
const getProductPerformance = async (productId, startDate, endDate, country) => {
    const { products, daysEvaluated, start, end, midDateLimit } = await getProductPerformanceData(productId, startDate, endDate, country);

    if (!products || products.length === 0) {
        const error = new Error('Producto no encontrado o sin datos');
        error.statusCode = 404;
        throw error;
    }

    const product = products[0];

    let totalQuantitySold = 0;
    let recentSalesCount = 0;
    let oldSalesCount = 0;
    let salesHistoryMap = {};

    const price = parseFloat(product.sale_price) || 0;
    const financial = calculateSuggestedPrices(price, { country });
    let totalRevenue = 0;

    if (product.ProductSales && product.ProductSales.length > 0) {
        const sales = product.ProductSales.sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));

        sales.forEach(sale => {
            totalQuantitySold += sale.quantitySold;
            totalRevenue += sale.quantitySold * price;

            if (sale.saleDate >= midDateLimit) {
                recentSalesCount += sale.quantitySold;
            } else {
                oldSalesCount += sale.quantitySold;
            }

            const dateKey = sale.saleDate.toISOString().split('T')[0];
            if (!salesHistoryMap[dateKey]) {
                salesHistoryMap[dateKey] = 0;
            }
            salesHistoryMap[dateKey] += sale.quantitySold;
        });
    }

    const salesHistory = [];
    let currentDate = new Date(start);
    const endDateForLoop = new Date(end); 

    while (currentDate < endDateForLoop) {
        const dateKey = currentDate.toISOString().split('T')[0];
        salesHistory.push({
            date: dateKey,
            quantity: salesHistoryMap[dateKey] || 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const maxDailySales = salesHistory.length > 0
        ? Math.max(...salesHistory.map(day => day.quantity))
        : 0;

    const salesAverage = calculateSalesAverage({
        totalQuantitySold,
        daysEvaluated,
        productSales: product.ProductSales,
        start,
        end,
        createdAt: product.createdAt
    });

    let trendGrowth = calculateTrendGrowth(recentSalesCount, oldSalesCount);
    const { isBreakout, breakoutScore } = calculateBreakoutMetrics(recentSalesCount, oldSalesCount, Math.floor(daysEvaluated / 2));

    const unitProfitCod = financial.cod.weightedProfit;
    const totalProfitCod = totalQuantitySold * unitProfitCod;

    const currentStock = product.Stock ? product.Stock.quantity : 0;
    
    const suggestedPriceCod = financial.cod.suggestedPrice;
    const dropScore = calculateDropScore({
        salePrice: price,
        suggestedPriceCod,
        trendGrowth,
        totalQuantitySold,
        periodDays: daysEvaluated,
        isBreakout
    });
    
    const isDeclining = trendGrowth <= -50;
    const isHighTicket = price >= 15000;
    const hasLowStock = currentStock > 0 && currentStock <= 50;

    return {
        product: {
            id: product.id,
            dropiId: product.dropiId,
            name: product.name,
            country: product.country,
            image: product.image,
            url: product.url,
            stock: currentStock,
            rawPrice: price,
        },
        period: {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            daysEvaluated
        },
        metrics: {
            dropScore,
            isDeclining,
            isHighTicket,
            hasLowStock,
            trendGrowthPercentage: Math.round(trendGrowth),
            isBreakout,
            breakoutScore,
            totalQuantitySold,
            totalRevenue,
            totalProfit: totalProfitCod,
            salesAverage,
            maxDailySales,
        },
        financialBreakdown: financial,
        salesHistory
    };
};

module.exports = { getProductPerformance };
