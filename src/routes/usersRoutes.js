const usersRoutes = require('express').Router();

const { createUser_Controller } = require('../controllers/user/createUser_Controller');

usersRoutes.post('/create', createUser_Controller);

module.exports = usersRoutes;