const { Router } = require('express');
const productsRoutes = require('./productsRoute');
const usersRoutes = require('./usersRoutes');
const subscriptionsRoutes = require('./subscriptionsRoutes');
const scraperRoutes = require('./scraperRoute');
const salesRoutes = require('./salesRoute');

const router = Router();

router.use('/products', productsRoutes);
router.use('/users', usersRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/scraper', scraperRoutes);
router.use('/sales', salesRoutes);

module.exports = router;