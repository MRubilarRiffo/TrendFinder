const server = require('./src/server');
const CronJob = require('cron').CronJob;
const { conn } = require('./src/db');
const { scraper } = require('./src/scraper/scraper');
const { logMessage } = require('./src/helpers/logMessage');
const { verifyCategory } = require('./src/scraper/verifyCategory');

const PORT = 3001;

conn.sync({ force: false })
    .then(async () => {
        // await verifyCategory();
    })
    .then(() => {
        server.listen(PORT, () => logMessage(`Server listening on port ${PORT}`));
    })
    .then(() => {
        // const scheduledTask = new CronJob('0 */2 * * *', async () => {
        //     await scraper();
        // }, null, true);

        // function timeRemainingUntilNextExecution(cronJob) {
        //     const now = new Date();
        //     const nextExecution = cronJob.nextDates(1)[0]; // Gets the next execution date
        //     const timeRemaining = nextExecution - now;
        //     const secondsRemaining = Math.round(timeRemaining / 1000);
        //     const minutesRemaining = Math.floor(secondsRemaining / 60);
        //     const extraSeconds = secondsRemaining % 60;
        //     return { minutes: minutesRemaining, seconds: extraSeconds };
        // };
    })
    .catch(error => {
        logMessage(`Error occurred during startup: ${error}`)
    });