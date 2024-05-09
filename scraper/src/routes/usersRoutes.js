const usersRoutes = require('express').Router();

const { createUser_Controller } = require('../controllers/user/createUser_Controller');
const { loginUser } = require('../controllers/user/loginUser');

usersRoutes.post('/create', createUser_Controller);
usersRoutes.post('/login', loginUser);

module.exports = usersRoutes;