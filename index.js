const server = require('./src/server');
const cron = require('node-cron');
const { conn } = require('./src/db');
const { getProducts } = require('./src/scraper/getProducts');

const PORT = 3001;

const executeTask = async () => {
    console.log("Hola");
};

conn.sync({ force: false })
    .then( async () => {
        await getProducts();
    })
    .then(() => {
        server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    })
    .then(() => {
        // m h d
        cron.schedule('0 0 * * *', () => {
            executeTask();
        });
    })
    .catch(error => console.error('Error occurred during startup:', error));