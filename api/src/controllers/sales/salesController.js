const { getSalesStatsHandler } = require('../../handlers/sales/getSalesStatsHandler');
const { formatPrice } = require('../../functions/formatPrice');

const getSalesStats = async (req, res, next) => {
    try {
        const { days, country, sortBy, limit, cursor } = req.query;

        const { snapshots, periodDays, nextCursor, prevCursor } = await getSalesStatsHandler(days, country, sortBy, limit, cursor);

        const data = snapshots.map(snapshot => {
            const product = snapshot.Product;
            const salePrice = parseFloat(product.sale_price) || 0;
            const suggestedPrice = parseFloat(product.suggested_price) || 0;
            const unitProfit = suggestedPrice > salePrice ? (suggestedPrice - salePrice) : 0;

            const country = product.country;

            return {
                productId: snapshot.ProductId,
                dropiId: product.dropiId,
                name: product.name,
                country: product.country,
                image: product.image,
                url: product.url,
                price: formatPrice(salePrice, country),
                suggestedPrice: formatPrice(suggestedPrice, country),
                unitProfit: formatPrice(unitProfit, country),
                totalQuantitySold: snapshot.totalQuantitySold,
                totalRevenue: formatPrice(parseFloat(snapshot.totalRevenue) || 0, country),
                totalProfit: formatPrice(parseFloat(snapshot.totalProfit) || 0, country),
                performanceRate: parseFloat(snapshot.performanceRate) || 0,
                trendGrowth: parseFloat(snapshot.trendGrowth) || 0,
                calculatedAt: snapshot.calculatedAt,
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