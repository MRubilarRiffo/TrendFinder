const { logMessage } = require('../../helpers/logMessage');
const { scraperConfig } = require('../../services/scraper/scraperOrchestrator');

const scraperController = (req, res, next) => {
    try {
        // Ejecución en segundo plano sin esperar a que termine para no bloquear el response del cliente
        scraperConfig().catch(err => {
            logMessage(`Error crítico asíncrono en Scraper: ${err.message}`);
        });

        // Retornamos 200 INMEDIATAMENTE al cliente.
        res.status(200).json({
            success: true,
            message: 'El scraper ha sido inicializado y se está ejecutando en segundo plano.'
        });

    } catch (error) {
        logMessage(`Error al inicializar el scraper: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error interno al intentar lanzar el scraper.'
        });
    }
};

module.exports = { scraperController };