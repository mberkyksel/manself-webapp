import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

// env.js decides things once, at import time, so each case loads it in a fresh
// process with a controlled environment (and no .env file to leak values in).
const envModule = fileURLToPath(new URL('../config/env.js', import.meta.url));

function loadEnv(vars) {
  const script = `import(${JSON.stringify(envModule)}).then((m) => console.log(JSON.stringify({ secretLength: m.env.jwtSecret.length })))`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    // Run from an empty directory: dotenv looks for .env in the working directory.
    cwd: tmpdir(),
    env: { PATH: process.env.PATH, ...vars },
    encoding: 'utf8',
  });
  // dotenv may print a tip line first, so the answer is the last line.
  const lastLine = result.stdout.trim().split('\n').at(-1) ?? '';
  return { ...result, parsed: lastLine.startsWith('{') ? JSON.parse(lastLine) : null };
}

describe('config/env', () => {
  it('uses the JWT secret it is given', () => {
    const result = loadEnv({ DATABASE_URL: 'postgres://x/y', JWT_SECRET: 'my-own-secret' });
    assert.equal(result.status, 0);
    assert.equal(result.parsed.secretLength, 'my-own-secret'.length);
    assert.doesNotMatch(result.stderr, /JWT_SECRET is not set/);
  });

  it('makes a random secret, with a warning, in demo mode when none is set', () => {
    const result = loadEnv({ DATABASE_URL: 'postgres://x/y', DEMO_MODE: 'true' });
    assert.equal(result.status, 0);
    assert.equal(result.parsed.secretLength, 64);
    assert.match(result.stderr, /JWT_SECRET is not set/);
  });

  it('refuses to start without a secret outside demo mode', () => {
    const result = loadEnv({ DATABASE_URL: 'postgres://x/y' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing required environment variable: JWT_SECRET/);
  });

  it('still requires a database URL', () => {
    const result = loadEnv({ JWT_SECRET: 'x' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing required environment variable: DATABASE_URL/);
  });
});
