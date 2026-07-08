import app from './src/app.js';
import { env } from './src/config/env.js';
import { sequelize } from './src/config/database.js';

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    app.listen(env.port, () => {
      console.log(`Server listening on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
};

start();
