const server = require('./src/config/server');
const { conn } = require('./src/config/database');
const { logMessage } = require('./src/helpers/logMessage');
// const { configCategory } = require('./src/config/configCategory');

const PORT = 3001;

conn.sync({ force: false })
    // .then(async () => {
    //     function calcularDiasConsecutivos(productos) {
    //         return productos.map(producto => {
    //             const ventasOrdenadas = producto.sales.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
    //             let diasConsecutivos = 1;
    //             let maxDiasConsecutivos = 1;
            
    //             for (let i = 0; i < ventasOrdenadas.length - 1; i++) {
    //                 const fechaActualStr = new Date(ventasOrdenadas[i].createdAt).toISOString().split('T')[0];
    //                 const fechaSiguienteStr = new Date(ventasOrdenadas[i + 1].createdAt).toISOString().split('T')[0];
            
    //                 const fechaActual = new Date(fechaActualStr);
    //                 const fechaSiguiente = new Date(fechaSiguienteStr);
            
    //                 const diferenciaDias = (fechaSiguiente - fechaActual) / (1000 * 60 * 60 * 24);
            
    //                 if (diferenciaDias === 1) {
    //                 diasConsecutivos++;
    //                 } 
    //                 // Actualizar maxDiasConsecutivos en cada iteración
    //                 maxDiasConsecutivos = Math.max(maxDiasConsecutivos, diasConsecutivos); 
    //             }
            
    //             return {
    //                 ProductId: producto.ProductId,
    //                 maxDiasConsecutivos: maxDiasConsecutivos
    //             };
    //         });
    //     }

    //     const countSale = await conn.models.CountSale.findAll({
    //         attributes: ['id', 'ProductId'],
    //         limit: 2000,
    //         offset: 1000,
    //         order: [['ProductId', 'ASC']]
    //     });

    //     const products = [];
    //     let cont = 0;
    //     const batchSize = 500;
    //     for (let i = 0; i < countSale.length; i += batchSize) {
    //         const batch = countSale.slice(i, i + batchSize);
    //         const salesPromises = batch.map(async ({ ProductId }) => {
    //             const sales = await conn.models.Sale.findAll({
    //                 where: { ProductId },
    //                 attributes: ['createdAt']
    //             });
    //             return { ProductId, sales };
    //         });
    //         const batchResults = await Promise.all(salesPromises);
    //         cont = cont + batchSize;
    //         console.log(">>", cont, " de ", countSale.length);
    //         products.push(...batchResults); 
    //     }

    //     const resultados = calcularDiasConsecutivos(products);

    //     for (let i = 0; i < resultados.length; i += batchSize) {
    //         const batch = resultados.slice(i, i + batchSize);
    //         await Promise.all(batch.map(async (resultado) => {
    //             const element = countSale.find(({ ProductId }) => ProductId == resultado.ProductId);
    //             if (element) { // Verificar si el elemento existe antes de actualizar
    //                 await element.update({ maxConsecutiveDays: resultado.maxDiasConsecutivos });
    //             }
    //         }));
    //     }
    // })
    .then(async () => {
        // await configCategory();
    })
    .then(() => {
        server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`);
    });