const scraperRoutes = require('express').Router();

const { getScraper } = require('../controllers/scraper/getScraper');

scraperRoutes.get('/', getScraper);

module.exports = scraperRoutes;