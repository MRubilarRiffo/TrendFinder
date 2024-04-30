const server = require('./src/infrastructure/config/server');
const { conn } = require('./src/infrastructure/config/database');
const { logMessage } = require('./src/helpers/logMessage');
const { configCategory } = require('./src/infrastructure/config/configCategory');
const { configCron } = require('./src/infrastructure/config/configCron');
const { getSale } = require('./src/handlers/Sale/getSale');
const { dailySaleReport } = require('./src/infrastructure/cron/dailySaleReport');

const PORT = 3001;

conn.sync({ force: false })
    .then(async () => {
        // await configCategory();
        // await configCron();

        await dailySaleReport();
        // const sale = await getSale({ where: { ProductId: 1 } });
        // console.log(sale);
    })
    .then(() => {
        server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`)
    });