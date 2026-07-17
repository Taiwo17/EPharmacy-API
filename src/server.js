const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    app.listen(PORT, () => {
      logger.info(`MedCart API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

start();
