const { scraperConfig } = require('../../scraper/scraper');

const getScraper = (req, res, next) => {
    try {
        scraperConfig();

        return res.send('Scraper iniciado');
    } catch (error) {
        next(error);
    };
};

module.exports = { getScraper };