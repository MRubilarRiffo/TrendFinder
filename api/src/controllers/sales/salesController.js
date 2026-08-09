const { getSalesStatsHandler } = require('../../handlers/sales/getSalesStatsHandler');
const { formatPrice } = require('../../functions/formatPrice');
const { calculateSuggestedPrices } = require('../../functions/financialCalculations');
const { calculateDropScore } = require('../../functions/salesCalculations');

const getSalesStats = async (req, res, next) => {
    try {
        const { days, country, sortBy, limit, cursor } = req.query;

        const { snapshots, periodDays, nextCursor, prevCursor } = await getSalesStatsHandler(days, country, sortBy, limit, cursor);

        const data = snapshots.map(snapshot => {
            const product = snapshot.Product;
            const salePrice = parseFloat(product.sale_price) || 0;

            const financial = calculateSuggestedPrices(salePrice, req.query);
            const country = product.country;

                const suggestedPriceCod = financial.cod.suggestedPrice;
                const dropScore = calculateDropScore({
                    salePrice,
                    suggestedPriceCod,
                    trendGrowth: snapshot.trendGrowth,
                    totalQuantitySold: snapshot.totalQuantitySold,
                    periodDays,
                    isBreakout: snapshot.isBreakout
                });

                // Banderas para Etiquetas Inteligentes (Smart Badges)
                const trendGrowthVal = parseFloat(snapshot.trendGrowth) || 0;
                const isDeclining = trendGrowthVal <= -50;
                // High Ticket ahora es si el costo del producto en Dropi es >= 15.000 (ajustable)
                const isHighTicket = salePrice >= 15000;
                const stockQty = product.Stock ? product.Stock.quantity : 0;
                const hasLowStock = stockQty > 0 && stockQty <= 50;

                return {
                    productId: snapshot.ProductId,
                    dropiId: product.dropiId,
                    name: product.name,
                    country: product.country,
                    image: product.image,
                    url: product.url,
                    price: formatPrice(salePrice, country),
                    rawPrice: salePrice,
                    stock: stockQty,

                    // Banderas de Etiquetado
                    isDeclining,
                    isHighTicket,
                    hasLowStock,
                    isBreakout: Boolean(snapshot.isBreakout),

                    // Precios Sugeridos y Ganancias Limpias
                    suggestedPriceCod: formatPrice(financial.cod.suggestedPrice, country),
                    unitProfitCod: formatPrice(financial.cod.weightedProfit, country),             // Ganancia Limpia COD ($8.000)
                    rawSuggestedPriceCod: financial.cod.suggestedPrice,
                    rawUnitProfitCod: financial.cod.weightedProfit,

                    suggestedPricePrepaid: formatPrice(financial.prepaid.suggestedPrice, country),
                    unitProfitPrepaid: formatPrice(financial.prepaid.netProfit, country),          // Ganancia Limpia Anticipado ($7.000)
                    rawSuggestedPricePrepaid: financial.prepaid.suggestedPrice,
                    rawUnitProfitPrepaid: financial.prepaid.netProfit,

                    // Retrocompatibilidad
                    suggestedPrice: formatPrice(financial.cod.suggestedPrice, country),
                    unitProfit: formatPrice(financial.cod.weightedProfit, country),

                    totalQuantitySold: snapshot.totalQuantitySold,
                    totalRevenue: formatPrice(parseFloat(snapshot.totalRevenue) || 0, country),
                    totalProfit: formatPrice(parseFloat(snapshot.totalProfit) || 0, country),
                    performanceRate: parseFloat(snapshot.performanceRate) || 0,
                    trendGrowth: parseFloat(snapshot.trendGrowth) || 0,
                    breakoutScore: parseFloat(snapshot.breakoutScore) || 0,
                    isBreakout: Boolean(snapshot.isBreakout),
                    calculatedAt: snapshot.calculatedAt,
                    dailySales: snapshot.dailySales || [],
                    dropScore: dropScore
                };
        });

        return res.status(200).json({
            success: true,
            periodDays: periodDays,
            pagination: {
                prevCursor,
                nextCursor
            },
            data
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSalesStats };