const { getSale } = require("../../handlers/Sale/getSale");
const { getCountSaleFindAll } = require("../../handlers/countSale/getCountSaleFindAll");

function calcularDiasConsecutivos(productos) {
    return productos.map(producto => {
      const ventasOrdenadas = producto.sales.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
      let diasConsecutivos = 1;
      let maxDiasConsecutivos = 1;
  
      for (let i = 0; i < ventasOrdenadas.length - 1; i++) {
        const fechaActualStr = new Date(ventasOrdenadas[i].createdAt).toISOString().split('T')[0];
        const fechaSiguienteStr = new Date(ventasOrdenadas[i + 1].createdAt).toISOString().split('T')[0];
  
        const fechaActual = new Date(fechaActualStr);
        const fechaSiguiente = new Date(fechaSiguienteStr);
  
        const diferenciaDias = (fechaSiguiente - fechaActual) / (1000 * 60 * 60 * 24);
  
        if (diferenciaDias === 1) {
          diasConsecutivos++;
        } 
        // Actualizar maxDiasConsecutivos en cada iteración
        maxDiasConsecutivos = Math.max(maxDiasConsecutivos, diasConsecutivos); 
      }
  
      return {
        ProductId: producto.ProductId,
        maxDiasConsecutivos: maxDiasConsecutivos
      };
    });
}

const getSale_Controller = async (req, res, next) => {
    try {
        const countSale = await getCountSaleFindAll({
            attributes: ['id', 'ProductId', 'maxConsecutiveDays'],
            // limit: 10
        });

        const salesPromises = countSale.map(async ({ ProductId }) => {
            const sales = await getSale({
                where: {
                    ProductId
                },
                attributes: ['createdAt']
            });
            return { ProductId, sales };
        });

        const products = await Promise.all(salesPromises);

        const resultados = calcularDiasConsecutivos(products);

        for (const resultado of resultados) {
            const element = countSale.find(({ ProductId }) => ProductId == resultado.ProductId);
            await element.update({ maxConsecutiveDays: resultado.maxDiasConsecutivos });
        }

        res.status(200).json(resultados);
    } catch (error) {
        next(error);
    };
};

module.exports = { getSale_Controller };