const { Router } = require('express');
const productsRoutes = require('./productsRoute');
const usersRoutes = require('./usersRoutes');
const subscriptionsRoutes = require('./subscriptionsRoutes');

const router = Router();

router.use('/products', productsRoutes);
router.use('/users', usersRoutes);
router.use('/subscriptions', subscriptionsRoutes);

module.exports = router;