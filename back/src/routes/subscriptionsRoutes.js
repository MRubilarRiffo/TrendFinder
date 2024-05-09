const subscriptionsRoutes = require('express').Router();

const { createSubscription_Controllers } = require('../controllers/subscription/createSubscription_Controllers');

subscriptionsRoutes.post('/create', createSubscription_Controllers);

module.exports = subscriptionsRoutes;