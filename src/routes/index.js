const { Router } = require('express');

const scraperRoutes = require('./scraperRoute');
const salesRoutes = require('./salesRoute');

const router = Router();

router.use((req, res, next) => {
    console.log(`[ROUTE DEBUG] Incoming request: ${req.method} ${req.url} - Original URL: ${req.originalUrl}`);
    next();
});

router.use('/scraper', scraperRoutes);
router.use('/sales', salesRoutes);

module.exports = router;