const { getLatestProductsFromDb } = require('../../handlers/products/getLatestProductsFromDb');

const getLatestProducts = async (req, res, next) => {
    try {
        const { limit, country } = req.query;

        // Llamada al Handler para obtener de DB
        const products = await getLatestProductsFromDb(limit, country);

        // Formatear JSON response (Lógica de Negocio)
        const formattedProducts = products.map(product => {
            const currentStock = product.Stock ? product.Stock.quantity : 0;
            const salePrice = parseFloat(product.sale_price) || 0;
            const suggestedPrice = parseFloat(product.suggested_price) || 0;
            const unitProfit = suggestedPrice > salePrice ? (suggestedPrice - salePrice) : 0;

            return {
                productId: product.id,
                dropiId: product.dropiId,
                name: product.name,
                country: product.country,
                image: product.image,
                price: salePrice,
                suggestedPrice: suggestedPrice,
                unitProfit: unitProfit,
                stock: currentStock,
                url: product.url,
                addedAt: product.createdAt
            };
        });

        return res.status(200).json({
            success: true,
            totalReturned: formattedProducts.length,
            data: formattedProducts
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getLatestProducts };