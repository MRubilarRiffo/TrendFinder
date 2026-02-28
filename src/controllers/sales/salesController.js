const { getSalesStatsHandler } = require('../../handlers/sales/getSalesStatsHandler');

const getSalesStats = async (req, res) => {
    try {
        const { days, country, startDate, endDate, sortByStr } = req.query;

        // 1. Obtener datos crudos desde la BD mediante el handler
        const { sales, daysEvaluated, midDateLimit } = await getSalesStatsHandler(days, country, startDate, endDate);

        // 2. Lógica de negocio: Procesar las ventas para armar las estadísticas
        const productStats = {};

        sales.forEach(sale => {
            if (!sale.Product) return;
            const productId = sale.Product.id;

            const salePrice = parseFloat(sale.Product.sale_price) || 0;
            const suggestedPrice = parseFloat(sale.Product.suggested_price) || 0;

            const unitProfit = suggestedPrice > salePrice ? (suggestedPrice - salePrice) : 0;
            const totalProfitSale = unitProfit * sale.quantitySold;
            const revenueSale = salePrice * sale.quantitySold;

            if (!productStats[productId]) {
                productStats[productId] = {
                    productId: sale.Product.id,
                    name: sale.Product.name,
                    country: sale.Product.country,
                    image: sale.Product.image,
                    price: salePrice,
                    suggestedPrice: suggestedPrice,
                    unitProfit: unitProfit,
                    totalQuantitySold: 0,
                    totalRevenue: 0,
                    totalProfit: 0,
                    salesHistory: {},
                    recentSalesCount: 0,
                    oldSalesCount: 0
                };
            }

            const pStats = productStats[productId];

            pStats.totalQuantitySold += sale.quantitySold;
            pStats.totalRevenue += revenueSale;
            pStats.totalProfit += totalProfitSale;

            if (sale.saleDate >= midDateLimit) {
                pStats.recentSalesCount += sale.quantitySold;
            } else {
                pStats.oldSalesCount += sale.quantitySold;
            }

            const dateKey = sale.saleDate.toISOString().split('T')[0];

            if (!pStats.salesHistory[dateKey]) {
                pStats.salesHistory[dateKey] = {
                    date: dateKey,
                    quantity: 0,
                    revenue: 0,
                    profit: 0
                };
            }

            pStats.salesHistory[dateKey].quantity += sale.quantitySold;
            pStats.salesHistory[dateKey].revenue += revenueSale;
            pStats.salesHistory[dateKey].profit += totalProfitSale;
        });

        // 3. Formatear la salida final y calcular tendencias
        const finalData = Object.values(productStats).map(p => {
            let trendGrowth = 0;
            if (p.oldSalesCount > 0) {
                trendGrowth = ((p.recentSalesCount - p.oldSalesCount) / p.oldSalesCount) * 100;
            } else if (p.recentSalesCount > 0) {
                trendGrowth = 100;
            }

            return {
                ...p,
                trendGrowthInfo: {
                    growthPercentage: Math.round(trendGrowth),
                    isTrendingUp: trendGrowth > 0,
                    isDying: trendGrowth < -20
                },
                salesHistory: Object.values(p.salesHistory).sort((a, b) => new Date(a.date) - new Date(b.date))
            };
        });

        // 4. Ordenamiento
        const sortBy = req.query.sortBy || 'profit';
        finalData.sort((a, b) => {
            if (sortBy === 'sales') {
                if (b.totalQuantitySold !== a.totalQuantitySold) return b.totalQuantitySold - a.totalQuantitySold;
                return b.totalProfit - a.totalProfit;
            } else {
                if (b.totalProfit !== a.totalProfit) return b.totalProfit - a.totalProfit;
                return b.totalQuantitySold - a.totalQuantitySold;
            }
        });

        return res.status(200).json({
            success: true,
            totalSalesRecords: sales.length,
            daysIncluded: daysEvaluated,
            data: finalData
        });
    } catch (error) {
        console.error("Error obteniendo estadísticas de ventas:", error);
        return res.status(500).json({ success: false, message: 'Error interno obteniendo ventas', error: error.message });
    }
};

module.exports = { getSalesStats };