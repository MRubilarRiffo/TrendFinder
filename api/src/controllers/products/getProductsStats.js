const { getProductsStatsFromDb } = require('../../handlers/products/getProductsStatsFromDb');
const { formatPrice } = require('../../functions/formatPrice');
const { calculateSalesAverage, calculateTrendGrowth } = require('../../functions/salesCalculations');

const getProductsStats = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, country } = req.query;

        if (!id) {
            const error = new Error('Se requiere un productId');
            error.statusCode = 400;
            throw error;
        }

        const { products, daysEvaluated, start, end, midDateLimit } = await getProductsStatsFromDb(id, startDate, endDate, country);

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
        const suggestedPrice = parseFloat(product.suggested_price) || 0;
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

        // Rellenar días sin ventas (0) para tener una línea de tiempo continua en los gráficos frontends
        const salesHistory = [];
        let currentDate = new Date(start);
        const endDateForLoop = new Date(end); // Iteramos hasta el end (no incluido, ya que end es el truncado del próximo día a las 00:00)

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

        const currentStock = product.Stock ? product.Stock.quantity : 0;

        const productStats = {
            productId: product.id,
            dropiId: product.dropiId,
            name: product.name,
            country: product.country,
            stock: currentStock,
            price: formatPrice(price, product.country),
            suggestedPrice: formatPrice(suggestedPrice, product.country),
            salesInfo: {
                totalQuantitySold,
                totalRevenue: formatPrice(totalRevenue, product.country),
                salesAverage,
                maxDailySales,
                trendGrowthPercentage: Math.round(trendGrowth)
            },
            salesHistory
        };

        return res.status(200).json({
            success: true,
            period: {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0],
                daysEvaluated
            },
            data: productStats
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProductsStats };