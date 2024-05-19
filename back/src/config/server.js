const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const errorMiddleware = require('../middleware/errorMiddleware');

const router = require('../routes');

const server = express();

server.use(morgan('dev'));
server.use(express.json());
server.use(cors());

server.use('/', router);

server.use(errorMiddleware);

module.exports = server;