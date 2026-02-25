const { getSalesStatsHandler } = require('../../handlers/sales/getSalesStatsHandler');

const getSalesStats = async (req, res) => {
    try {
        const { days, country } = req.query;

        const stats = await getSalesStatsHandler(days, country);

        return res.status(200).json({
            success: true,
            ...stats
        });
    } catch (error) {
        console.error("Error obteniendo estadísticas de ventas:", error);
        return res.status(500).json({ success: false, message: 'Error interno obteniendo ventas', error: error.message });
    }
};

module.exports = { getSalesStats };