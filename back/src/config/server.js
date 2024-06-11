const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const errorMiddleware = require('../middleware/errorMiddleware');
const helmet = require('helmet');

const router = require('../routes');

const server = express();

server.use(morgan('dev'));
server.use(express.json());
server.use(cors());
server.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://example.com'], // Permitir scripts de un dominio específico
            // ... otras directivas
        },
    },
    crossOriginResourcePolicy: { policy: "same-origin" }, // Configurar CORS
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));

server.use('/', router);

server.use(errorMiddleware);

module.exports = server;