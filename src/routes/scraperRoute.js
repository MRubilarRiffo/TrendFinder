const scraperRoutes = require('express').Router();

const { scraperController } = require('../controllers/scraper/scraperController');

scraperRoutes.post('/', scraperController);

module.exports = scraperRoutes;