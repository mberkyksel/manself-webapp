import { Sequelize } from 'sequelize';
import { env } from './env.js';

// Single shared Sequelize instance used by models and the app at runtime.
// sequelize-cli reads its own connection info from config/config.cjs
// (CommonJS is required there since this project runs as an ES module).
export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? console.log : false,
});
