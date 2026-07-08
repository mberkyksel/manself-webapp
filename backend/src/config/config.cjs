// CommonJS config consumed only by sequelize-cli (migrations/seeders).
// The app itself connects via config/database.js (config/env.js), not this file.
require('dotenv').config();

const common = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
};

module.exports = {
  development: common,
  test: common,
  production: common,
};
