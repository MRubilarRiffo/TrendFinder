const { getLatestProducts } = require('../../repositories/LatestProductsRepository');
const { searchProductsData } = require('../../repositories/ProductSearchRepository');
const { calculateSuggestedPrices } = require('../../functions/financialCalculations');

const getLatestProductCatalogue = async (limit, country) => {
    const products = await getLatestProducts(limit, country);

    const catalogue = products.map(product => {
        const currentStock = product.Stock ? product.Stock.quantity : 0;
        const salePrice = parseFloat(product.sale_price) || 0;
        const financial = calculateSuggestedPrices(salePrice, { country: product.country });

        return {
            id: product.id,
            dropiId: product.dropiId,
            name: product.name,
            country: product.country,
            image: product.image,
            rawPrice: salePrice,
            stock: currentStock,
            url: product.url,
            addedAt: product.createdAt,
            financialBreakdown: financial
        };
    });

    return catalogue;
};

const searchProductCatalogue = async ({ searchTerm, country, limit, page, sortBy }) => {
    const searchResult = await searchProductsData({
        searchTerm,
        country,
        limit,
        page,
        sortBy
    });

    const catalogue = searchResult.products.map(product => {
        const currentStock = product.Stock ? product.Stock.quantity : 0;
        const salePrice = parseFloat(product.sale_price) || 0;
        const financial = calculateSuggestedPrices(salePrice, { country: product.country });

        return {
            id: product.id,
            dropiId: product.dropiId,
            name: product.name,
            country: product.country,
            image: product.image,
            rawPrice: salePrice,
            stock: currentStock,
            url: product.url,
            addedAt: product.createdAt,
            financialBreakdown: financial
        };
    });

    return {
        products: catalogue,
        totalMatches: searchResult.totalMatches,
        totalPages: searchResult.totalPages,
        page: searchResult.page,
        limit: searchResult.limit,
        hasNextPage: searchResult.hasNextPage,
        hasPrevPage: searchResult.hasPrevPage
    };
};

module.exports = {
    getLatestProductCatalogue,
    searchProductCatalogue
};
