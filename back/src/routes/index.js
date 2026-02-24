const { Router } = require('express');
const productsRoutes = require('./productsRoute');
const scraperRoutes = require('./scraperRoute');

const router = Router();

router.use((req, res, next) => {
    console.log(`[ROUTE DEBUG] Incoming request: ${req.method} ${req.url} - Original URL: ${req.originalUrl}`);
    next();
});

router.use('/products', productsRoutes);
router.use('/scraper', scraperRoutes);

module.exports = router;