const { getLatestProductCatalogue } = require('../../domain/ProductCatalogue');
const { formatPrice } = require('../../functions/formatPrice');
const { normalizeCountry } = require('../../helpers/validations');

const formatLatestProductsResponse = (catalogue) => {
    return catalogue.map(product => {
        const country = product.country;
        const financial = product.financialBreakdown;

        return {
            productId: product.id,
            dropiId: product.dropiId,
            name: product.name,
            country: product.country,
            image: product.image,
            price: formatPrice(product.rawPrice, country),
            rawPrice: product.rawPrice,
            
            suggestedPriceCod: formatPrice(financial.cod.suggestedPrice, country),
            unitProfitCod: formatPrice(financial.cod.weightedProfit, country),
            suggestedPricePrepaid: formatPrice(financial.prepaid.suggestedPrice, country),
            unitProfitPrepaid: formatPrice(financial.prepaid.netProfit, country),
            
            suggestedPrice: formatPrice(financial.cod.suggestedPrice, country),
            unitProfit: formatPrice(financial.cod.weightedProfit, country),
            
            stock: product.stock,
            url: product.url,
            addedAt: product.addedAt
        };
    });
};

const getLatestProducts = async (req, res, next) => {
    try {
        const { limit, country } = req.query;

        let normalizedCountry = null;
        if (country) {
            normalizedCountry = normalizeCountry(country);
            if (!normalizedCountry) {
                const error = new Error('País no válido. Países soportados: Colombia, Chile, México, Panamá, Ecuador, Perú, España');
                error.statusCode = 400;
                throw error;
            }
        }

        const limitInt = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

        const catalogue = await getLatestProductCatalogue(limitInt, normalizedCountry);

        const formattedProducts = formatLatestProductsResponse(catalogue);

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