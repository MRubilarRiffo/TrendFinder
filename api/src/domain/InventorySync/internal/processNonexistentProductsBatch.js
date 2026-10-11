const { getCategoryFindAll } = require('../../../repositories/CategoryRepository');
const { createBulkProduct } = require('../../../repositories/ProductAdminRepository');
const { createBulkStock } = require('../../../repositories/StockRepository');
const { runTransaction } = require('../../../repositories/transactionHelper');
const { logMessage } = require('../../../helpers/logMessage');

const { validateDropiProduct } = require('./dropiValidator');
const { compareCategories, convertirString, updateImages } = require('./dropiUtils');

/**
 * Inserta masivamente los productos que el scraper identificó como **nuevos**.
 * Establece su inventario inicial en bloque y sus categorías de forma atómica bajo una transacción.
 */
const processNonexistentProductsBatch = async (nonexistentProducts, DROPI_DETAILS_PRODUCTS, country) => {
    let nonexistentProductsCreating = nonexistentProducts.map(({ id, name, stock, gallery, categories, sale_price, suggested_price, warehouse_product, variations }) => {
        // Extracción correcta de Stock sumando inventario de Warehouses y Variaciones (Dropi V2 API Bug Fix)
        let totalStock = 0;

        // 1. Stock Base
        if (stock !== null && stock !== undefined && !isNaN(parseInt(stock))) {
            totalStock += parseInt(stock);
        }

        // 2. Stock de Bodegas
        if (Array.isArray(warehouse_product) && warehouse_product.length > 0) {
            totalStock = warehouse_product.reduce((acc, curr) => {
                const whStock = curr.stock;
                return acc + (whStock !== null && whStock !== undefined && !isNaN(parseInt(whStock)) ? parseInt(whStock) : 0);
            }, totalStock);
        }

        // 3. Stock de Variaciones
        if (Array.isArray(variations) && variations.length > 0) {
            let totalVariationsStock = 0;
            variations.forEach(variation => {
                if (variation.stock !== null && variation.stock !== undefined && !isNaN(parseInt(variation.stock))) {
                    totalVariationsStock += parseInt(variation.stock);
                } else if (Array.isArray(variation.warehouse_product_variation) && variation.warehouse_product_variation.length > 0) {
                    variation.warehouse_product_variation.forEach(ware => {
                        if (ware.stock !== null && ware.stock !== undefined && !isNaN(parseInt(ware.stock))) {
                            totalVariationsStock += parseInt(ware.stock);
                        }
                    });
                }
            });

            if (totalStock < totalVariationsStock || totalStock === 0) {
                totalStock = totalVariationsStock;
            }
        }

        const safeSalePrice = sale_price !== null && sale_price !== undefined ? parseFloat(sale_price) : 0;
        const safeSuggestedPrice = suggested_price !== null && suggested_price !== undefined ? parseFloat(suggested_price) : 0;

        try {
            validateDropiProduct(id, name, totalStock);
        } catch (error) {
            logMessage(`Error al validar producto nuevo (${name}): ${error.message}`);
            return null;
        }

        const image = updateImages(gallery);
        const url = `${DROPI_DETAILS_PRODUCTS}${id}/${convertirString(name)}`;

        return { id, name, stock: totalStock, image, categories, sale_price: safeSalePrice, suggested_price: safeSuggestedPrice, url, country };
    });

    nonexistentProductsCreating = nonexistentProductsCreating.filter(Boolean);
    if (nonexistentProductsCreating.length === 0) return;

    // Ejecución atómica en transacción
    await runTransaction(async (transaction) => {
        const createNonexistentProducts = await createBulkProduct(nonexistentProductsCreating, transaction);
        const categoriesArray = await getCategoryFindAll();

        const stockToCreate = [];
        const categoryAssociationPromises = [];

        for (const product of createNonexistentProducts) {
            const correspondingProduct = nonexistentProductsCreating.find(item => item.id == product.dropiId);
            if (!correspondingProduct) continue;

            // Recopilar stock para inserción masiva en 1 sola query
            stockToCreate.push({
                ProductId: product.id,
                quantity: correspondingProduct.stock
            });

            // Asignar Relaciones de Categoría
            if (Array.isArray(correspondingProduct.categories) && correspondingProduct.categories.length > 0) {
                const matchedCategories = correspondingProduct.categories.map(category => {
                    let categoryInstance = categoriesArray.find(({ name }) => compareCategories(name, category.name));
                    if (!categoryInstance) {
                        categoryInstance = categoriesArray.find(({ name }) => name === 'Otros' || name === 'Otro');
                    }
                    return categoryInstance;
                }).filter(Boolean);

                const setFindCategory = [...new Set(matchedCategories)];
                if (setFindCategory.length > 0 && typeof product.addCategories === 'function') {
                    categoryAssociationPromises.push(product.addCategories(setFindCategory, { transaction }));
                }
            }
        }

        // Inserción en bloque de inventario (elimina N+1 queries)
        if (stockToCreate.length > 0) {
            await createBulkStock(stockToCreate, transaction);
        }

        // Asociaciones en paralelo dentro de la transacción
        if (categoryAssociationPromises.length > 0) {
            await Promise.all(categoryAssociationPromises);
        }
    });
};

module.exports = { processNonexistentProductsBatch };