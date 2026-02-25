const { getCategoryFindAll } = require('../../handlers/category/getCategoryFindAll');
const { createBulkProduct } = require('../../handlers/product/createBulkProduct');
const { Stock } = require('../../config/database');
const { logMessage } = require('../../helpers/logMessage');

const { validateDropiProduct } = require('../../helpers/scraper/dropiValidator');
const { compareCategories, convertirString, updateImages, updateStores } = require('../../helpers/scraper/dropiUtils');

/**
 * Inserta masivamente los productos que el scraper identificó como **nuevos**.
 * Establece su inventario inicial y sus categorías correspondientes haciendo un match con el diccionario.
 */
const processNonexistentProductsBatch = async (nonexistentProducts, DROPI_IMG_URL, DROPI_DETAILS_PRODUCTS, country) => {
    let nonexistentProductsCreating = nonexistentProducts.map(({ id, name, stock, gallery, categories, description, sale_price, suggested_price, warehouse_product, updated_at, created_at, variations }) => {
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
                // Stock directo de la variación
                if (variation.stock !== null && variation.stock !== undefined && !isNaN(parseInt(variation.stock))) {
                    totalVariationsStock += parseInt(variation.stock);
                } else if (Array.isArray(variation.warehouse_product_variation) && variation.warehouse_product_variation.length > 0) {
                    // Si no hay stock directo, sumamos el de las bodegas de la variación
                    variation.warehouse_product_variation.forEach(ware => {
                        if (ware.stock !== null && ware.stock !== undefined && !isNaN(parseInt(ware.stock))) {
                            totalVariationsStock += parseInt(ware.stock);
                        }
                    });
                }
            });

            // Si el stock general reportado es menor al de las variaciones o cero, prevalece el de variaciones
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

        const stores = updateStores(warehouse_product);
        const image = updateImages(gallery, DROPI_IMG_URL, null);
        const url = `${DROPI_DETAILS_PRODUCTS}${id}/${convertirString(name)}`;

        let productUpdateDate = updated_at ? updated_at : created_at;

        return { id, name, stock: totalStock, image, categories, description, sale_price: safeSalePrice, suggested_price: safeSuggestedPrice, url, country, stores, productUpdateDate };
    });

    nonexistentProductsCreating = nonexistentProductsCreating.filter(item => item);

    try {
        const createNonexistentProducts = await createBulkProduct(nonexistentProductsCreating);

        let categoriesArray = await getCategoryFindAll();

        for (const product of createNonexistentProducts) {
            const correspondingProduct = nonexistentProductsCreating.find(item => item.id == product.dropiId);

            if (!correspondingProduct) continue;

            const categoryPromises = correspondingProduct.categories.map(category => {
                let categoryInstance = categoriesArray.find(({ name }) => compareCategories(name, category.name));
                if (!categoryInstance) {
                    categoryInstance = categoriesArray.find(({ name }) => name == 'Otros');
                }
                return categoryInstance;
            });

            const findCategory = await Promise.all(categoryPromises);
            const setFindCategory = [...new Set(findCategory)].filter(item => item);

            // Asignar Relaciones de Categoría
            if (setFindCategory.length > 0) {
                await product.addCategories(setFindCategory);
            }

            // Crear el Registro de Stock
            await Stock.create({ ProductId: product.id, quantity: correspondingProduct.stock });
        }
    } catch (error) {
        throw error;
    }
};

module.exports = { processNonexistentProductsBatch };