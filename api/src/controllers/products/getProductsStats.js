const { getProductsStatsFromDb } = require('../../handlers/products/getProductsStatsFromDb');
const { formatPrice } = require('../../functions/formatPrice');
const { calculateSalesAverage, calculateTrendGrowth, calculateBreakoutMetrics, calculateDropScore } = require('../../functions/salesCalculations');
const { calculateSuggestedPrices } = require('../../functions/financialCalculations');

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
        const financial = calculateSuggestedPrices(price, req.query);
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
        const endDateForLoop = new Date(end); // Iteramos hasta el end

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
        
        // Calcular banderas y DropScore
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

        const productStats = {
            productId: product.id,
            dropiId: product.dropiId,
            name: product.name,
            country: product.country,
            image: product.image,
            url: product.url,
            stock: currentStock,
            price: formatPrice(price, product.country),
            rawPrice: price,
            
            dropScore,
            isDeclining,
            isHighTicket,
            hasLowStock,

            // Precios Sugeridos y Ganancias Limpias
            suggestedPriceCod: formatPrice(financial.cod.suggestedPrice, product.country),
            unitProfitCod: formatPrice(financial.cod.weightedProfit, product.country),          // Ganancia Limpia COD ($8.000)
            rawSuggestedPriceCod: financial.cod.suggestedPrice,
            rawUnitProfitCod: financial.cod.weightedProfit,

            suggestedPricePrepaid: formatPrice(financial.prepaid.suggestedPrice, product.country),
            unitProfitPrepaid: formatPrice(financial.prepaid.netProfit, product.country),          // Ganancia Limpia Anticipado ($7.000)
            rawSuggestedPricePrepaid: financial.prepaid.suggestedPrice,
            rawUnitProfitPrepaid: financial.prepaid.netProfit,

            // Retrocompatibilidad
            suggestedPrice: formatPrice(financial.cod.suggestedPrice, product.country),
            unitProfit: formatPrice(financial.cod.weightedProfit, product.country),

            financialBreakdown: financial,

            salesInfo: {
                totalQuantitySold,
                totalRevenue: formatPrice(totalRevenue, product.country),
                totalProfit: formatPrice(totalProfitCod, product.country),
                salesAverage,
                maxDailySales,
                trendGrowthPercentage: Math.round(trendGrowth),
                isBreakout,
                breakoutScore
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