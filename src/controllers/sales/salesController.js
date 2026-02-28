const { getSalesStatsHandler } = require('../../handlers/sales/getSalesStatsHandler');

const getSalesStats = async (req, res) => {
    try {
        const { days, country, startDate, endDate, sortByStr, page } = req.query;

        const pageInt = parseInt(page) || 1;
        const limit = 10;
        const offset = (pageInt - 1) * limit;

        const sortBy = req.query.sortBy || 'profit';

        // 1. Obtener datos pre-agrupados HÍBRIDOS desde la BD mediante el handler
        const { topProducts, historySales, totalCount, daysEvaluated, midDateLimit } = await getSalesStatsHandler(days, country, startDate, endDate, limit, offset, sortBy);

        // 2. Lógica de negocio: Procesar el TOP N extraído
        const finalData = topProducts.map(tp => {
            const productId = tp.ProductId;
            const product = tp.Product;

            // Datos base pre-sumados en el query de base de datos
            const totalQuantitySold = parseFloat(tp.totalQuantitySold) || 0;
            const totalProfit = parseFloat(tp.totalProfit) || 0;

            const salePrice = parseFloat(product.sale_price) || 0;
            const suggestedPrice = parseFloat(product.suggested_price) || 0;
            const unitProfit = suggestedPrice > salePrice ? (suggestedPrice - salePrice) : 0;
            const totalRevenue = salePrice * totalQuantitySold;

            // Extraer array de historial transaccional específicamente para este ID producto
            const pHistory = historySales.filter(h => h.ProductId === productId) || [];

            let recentSalesCount = 0;
            let oldSalesCount = 0;
            let salesHistoryMap = {};

            pHistory.forEach(sale => {
                const saleDateObj = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate);

                if (saleDateObj >= midDateLimit) {
                    recentSalesCount += sale.quantitySold;
                } else {
                    oldSalesCount += sale.quantitySold;
                }

                const dateKey = saleDateObj.toISOString().split('T')[0];

                if (!salesHistoryMap[dateKey]) {
                    salesHistoryMap[dateKey] = {
                        date: dateKey,
                        quantity: 0,
                        revenue: 0,
                        profit: 0
                    };
                }

                const sRev = sale.quantitySold * salePrice;
                const sProf = sale.quantitySold * unitProfit;

                salesHistoryMap[dateKey].quantity += sale.quantitySold;
                salesHistoryMap[dateKey].revenue += sRev;
                salesHistoryMap[dateKey].profit += sProf;
            });

            // Formatear tendencias
            let trendGrowth = 0;
            if (oldSalesCount > 0) {
                trendGrowth = ((recentSalesCount - oldSalesCount) / oldSalesCount) * 100;
            } else if (recentSalesCount > 0) {
                trendGrowth = 100;
            }

            return {
                productId: productId,
                name: product.name,
                country: product.country,
                image: product.image,
                price: salePrice,
                suggestedPrice: suggestedPrice,
                unitProfit: unitProfit,
                totalQuantitySold: totalQuantitySold,
                totalRevenue: totalRevenue,
                totalProfit: totalProfit,
                trendGrowthInfo: {
                    growthPercentage: Math.round(trendGrowth),
                    isTrendingUp: trendGrowth > 0,
                    isDying: trendGrowth < -20
                },
                salesHistory: Object.values(salesHistoryMap).sort((a, b) => new Date(a.date) - new Date(b.date))
            };
        });

        // NOTA: El sort in-memory fue DEPRECADO. Ya MySQL ordenó topProducts dictando las posiciones relativas absolutas.

        return res.status(200).json({
            success: true,
            totalSalesRecords: totalCount,
            daysIncluded: daysEvaluated,
            pagination: {
                totalProducts: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: pageInt,
                limit
            },
            data: finalData
        });
    } catch (error) {
        console.error("Error obteniendo estadísticas de ventas:", error);
        return res.status(500).json({ success: false, message: 'Error interno obteniendo ventas', error: error.message });
    }
};

module.exports = { getSalesStats };