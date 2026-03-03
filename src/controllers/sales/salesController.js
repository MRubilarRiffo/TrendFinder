const { getSalesStatsHandler } = require('../../handlers/sales/getSalesStatsHandler');

const getSalesStats = async (req, res, next) => {
    try {
        const { days, country, sortBy, limit, cursor } = req.query;

        const { snapshots, periodDays, nextCursor, prevCursor } = await getSalesStatsHandler(days, country, sortBy, limit, cursor);

        const data = snapshots.map(snapshot => {
            const product = snapshot.Product;
            const salePrice = parseFloat(product.sale_price) || 0;
            const suggestedPrice = parseFloat(product.suggested_price) || 0;
            const unitProfit = suggestedPrice > salePrice ? (suggestedPrice - salePrice) : 0;
            const totalQuantitySold = snapshot.totalQuantitySold;
            const totalRevenue = salePrice * totalQuantitySold;

            return {
                productId: snapshot.ProductId,
                name: product.name,
                country: product.country,
                image: product.image,
                price: salePrice,
                suggestedPrice: suggestedPrice,
                unitProfit: unitProfit,
                totalQuantitySold: totalQuantitySold,
                totalRevenue: totalRevenue,
                totalProfit: parseFloat(snapshot.totalProfit) || 0,
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