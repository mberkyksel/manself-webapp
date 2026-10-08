// Imported first by every backend test file: points the app at a throwaway
// test database *before* any app code reads its environment, and refuses to
// run against anything that isn't obviously a test database, because the
// tests truncate tables.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/manself_test';

if (!/test/i.test(new URL(TEST_DATABASE_URL).pathname)) {
  throw new Error(`Refusing to run tests against "${TEST_DATABASE_URL}": the database name must contain "test".`);
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = 'test-secret';
process.env.DEMO_MODE = 'true';
process.env.WEATHER_API_KEY = 'test-weather-key';

const { default: app } = await import('../src/app.js');
const { sequelize } = await import('../src/config/database.js');
const models = await import('../src/models/index.js');

export { app, models };

// The schema comes from the real migrations (`npm run test:setup`), so the
// ON DELETE CASCADE foreign keys behave exactly as in production.
export async function resetDatabase() {
  await sequelize.query('TRUNCATE users RESTART IDENTITY CASCADE');
}

export async function closeDatabase() {
  await sequelize.close();
}
