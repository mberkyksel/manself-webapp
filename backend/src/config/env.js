import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

// Fail fast if the app is missing something it truly cannot run without.
const required = ['DATABASE_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Demo mode exists so a stranger can run the app with no setup, so there the
// signing secret may be left out: a random one is made for this run. Tokens
// then stop working when the server restarts, which is fine for a demo. It is
// never done outside demo mode - a real deployment must set its own secret.
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (process.env.DEMO_MODE !== 'true') {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    'JWT_SECRET is not set, so a random one is used for this run (demo mode). ' +
      'Everyone is signed out when the server restarts. Set JWT_SECRET for anything beyond a demo.'
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Enables POST /api/auth/demo, which resets and logs into the shared demo
  // account. Off unless explicitly turned on.
  demoMode: process.env.DEMO_MODE === 'true',

  // Reserved for future integrations, wired up as those features land.
  weatherApiKey: process.env.WEATHER_API_KEY || null,
  googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || null,
};
