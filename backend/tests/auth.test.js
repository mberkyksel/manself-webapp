import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app, models, resetDatabase, closeDatabase } from './helpers.js';

const PASSWORD = 'correct-horse-1';

async function register(overrides = {}) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Tess Tester', email: 'tess@example.test', password: PASSWORD, ...overrides });
  return res;
}

async function registerAndGetToken(overrides) {
  const res = await register(overrides);
  assert.equal(res.status, 201);
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

before(resetDatabase);
beforeEach(resetDatabase);
after(closeDatabase);

describe('register', () => {
  it('creates an account and returns a token and the public user', async () => {
    const res = await register();
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'tess@example.test');
    assert.equal(res.body.user.isDemo, false);
    assert.equal(res.body.user.passwordHash, undefined);
  });

  it('stores a valid timezone and falls back to UTC for a bogus one', async () => {
    const good = await register({ timezone: 'Europe/Berlin' });
    assert.equal(good.body.user.timezone, 'Europe/Berlin');

    const bad = await register({ email: 'other@example.test', timezone: 'Not/AZone' });
    assert.equal(bad.body.user.timezone, 'UTC');
  });

  it('rejects missing fields, short passwords and duplicate emails', async () => {
    assert.equal((await register({ name: '' })).status, 400);
    assert.equal((await register({ password: 'short' })).status, 400);

    await register();
    const duplicate = await register();
    assert.equal(duplicate.status, 409);
  });
});

describe('login', () => {
  it('logs in with the right credentials', async () => {
    await register();
    const res = await request(app).post('/api/auth/login').send({ email: 'tess@example.test', password: PASSWORD });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    await register();
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tess@example.test', password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.test', password: PASSWORD });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.error.message, unknownEmail.body.error.message);
  });
});

describe('me and token checks', () => {
  it('requires a valid token', async () => {
    assert.equal((await request(app).get('/api/auth/me')).status, 401);
    assert.equal((await request(app).get('/api/auth/me').set(auth('garbage'))).status, 401);
  });

  it('returns the current user', async () => {
    const token = await registerAndGetToken();
    const res = await request(app).get('/api/auth/me').set(auth(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'Tess Tester');
  });
});

describe('profile', () => {
  it('updates the name and trims it', async () => {
    const token = await registerAndGetToken();
    const res = await request(app).patch('/api/auth/profile').set(auth(token)).send({ name: '  New Name  ' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'New Name');
  });

  it('sets, trims and clears the weather location', async () => {
    const token = await registerAndGetToken();

    const set = await request(app).patch('/api/auth/profile').set(auth(token)).send({ location: '  Munich ' });
    assert.equal(set.body.user.location, 'Munich');
    // Updating only the location leaves the name alone.
    assert.equal(set.body.user.name, 'Tess Tester');

    const cleared = await request(app).patch('/api/auth/profile').set(auth(token)).send({ location: '' });
    assert.equal(cleared.body.user.location, null);
  });

  it('rejects empty, blank-name and over-long input', async () => {
    const token = await registerAndGetToken();
    const patch = (body) => request(app).patch('/api/auth/profile').set(auth(token)).send(body);

    assert.equal((await patch({})).status, 400);
    assert.equal((await patch({ name: '   ' })).status, 400);
    assert.equal((await patch({ location: 'x'.repeat(101) })).status, 400);
    assert.equal((await patch({ location: 42 })).status, 400);
  });
});

describe('password', () => {
  it('changes the password when the current one is right', async () => {
    const token = await registerAndGetToken();
    const res = await request(app)
      .patch('/api/auth/password')
      .set(auth(token))
      .send({ currentPassword: PASSWORD, newPassword: 'brand-new-pass-2' });
    assert.equal(res.status, 200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email: 'tess@example.test', password: PASSWORD });
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tess@example.test', password: 'brand-new-pass-2' });
    assert.equal(oldLogin.status, 401);
    assert.equal(newLogin.status, 200);
  });

  it('answers a wrong current password with 403, not 401', async () => {
    // The frontend treats any 401 as an expired session and logs the user out.
    const token = await registerAndGetToken();
    const res = await request(app)
      .patch('/api/auth/password')
      .set(auth(token))
      .send({ currentPassword: 'wrong-password', newPassword: 'brand-new-pass-2' });
    assert.equal(res.status, 403);
  });

  it('rejects a too-short new password', async () => {
    const token = await registerAndGetToken();
    const res = await request(app)
      .patch('/api/auth/password')
      .set(auth(token))
      .send({ currentPassword: PASSWORD, newPassword: 'short' });
    assert.equal(res.status, 400);
  });
});

describe('email', () => {
  it('changes the email and issues a fresh token', async () => {
    const token = await registerAndGetToken();
    const res = await request(app)
      .patch('/api/auth/email')
      .set(auth(token))
      .send({ newEmail: 'renamed@example.test', currentPassword: PASSWORD });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'renamed@example.test');
    assert.ok(res.body.token);

    const login = await request(app).post('/api/auth/login').send({ email: 'renamed@example.test', password: PASSWORD });
    assert.equal(login.status, 200);
  });

  it('refuses a wrong password (403) and an email already in use (409)', async () => {
    await register({ email: 'taken@example.test' });
    const token = await registerAndGetToken();

    const wrong = await request(app)
      .patch('/api/auth/email')
      .set(auth(token))
      .send({ newEmail: 'x@example.test', currentPassword: 'wrong-password' });
    assert.equal(wrong.status, 403);

    const taken = await request(app)
      .patch('/api/auth/email')
      .set(auth(token))
      .send({ newEmail: 'taken@example.test', currentPassword: PASSWORD });
    assert.equal(taken.status, 409);
  });
});

describe('delete account', () => {
  it('requires the right password', async () => {
    const token = await registerAndGetToken();
    const res = await request(app).delete('/api/auth/account').set(auth(token)).send({ currentPassword: 'wrong-password' });
    assert.equal(res.status, 403);
    assert.equal(await models.User.count(), 1);
  });

  it('deletes the account and everything it owns', async () => {
    const token = await registerAndGetToken();
    const note = await request(app).post('/api/notes').set(auth(token)).send({ text: 'remember me' });
    assert.equal(note.status, 201);
    assert.equal(await models.Note.count(), 1);

    const res = await request(app).delete('/api/auth/account').set(auth(token)).send({ currentPassword: PASSWORD });
    assert.equal(res.status, 204);
    assert.equal(await models.User.count(), 0);
    assert.equal(await models.Note.count(), 0);
  });
});

describe('data isolation', () => {
  it("does not let one user edit another user's note", async () => {
    const alice = await registerAndGetToken({ email: 'alice@example.test' });
    const bob = await registerAndGetToken({ email: 'bob@example.test' });

    const note = await request(app).post('/api/notes').set(auth(alice)).send({ text: 'alice only' });

    const res = await request(app).patch(`/api/notes/${note.body.id}`).set(auth(bob)).send({ text: 'hacked' });
    assert.equal(res.status, 404);

    const list = await request(app).get('/api/notes').set(auth(bob));
    assert.deepEqual(list.body, []);
  });
});

describe('demo mode', () => {
  it('exposes the flag publicly', async () => {
    const res = await request(app).get('/api/config');
    assert.deepEqual(res.body, { demoEnabled: true });
  });

  it('logs into a seeded demo account flagged isDemo', async () => {
    const res = await request(app).post('/api/auth/demo');
    assert.equal(res.status, 200);
    assert.equal(res.body.user.isDemo, true);

    const tasks = await request(app).get('/api/tasks').set(auth(res.body.token));
    assert.ok(tasks.body.length > 0, 'demo account should come with tasks');
  });

  it('resets renamed data back to the sample data on the next demo login', async () => {
    const first = await request(app).post('/api/auth/demo');
    await request(app).patch('/api/auth/profile').set(auth(first.body.token)).send({ name: 'Vandal' });

    const second = await request(app).post('/api/auth/demo');
    assert.equal(second.body.user.name, 'Demo User');
  });

  it('lets the demo account change its name but not its credentials or existence', async () => {
    const { body } = await request(app).post('/api/auth/demo');
    const token = body.token;

    const name = await request(app).patch('/api/auth/profile').set(auth(token)).send({ name: 'Guest' });
    assert.equal(name.status, 200);

    const password = await request(app)
      .patch('/api/auth/password')
      .set(auth(token))
      .send({ currentPassword: 'demo-manself', newPassword: 'something-else-1' });
    const email = await request(app)
      .patch('/api/auth/email')
      .set(auth(token))
      .send({ newEmail: 'x@example.test', currentPassword: 'demo-manself' });
    const remove = await request(app).delete('/api/auth/account').set(auth(token)).send({ currentPassword: 'demo-manself' });

    assert.deepEqual([password.status, email.status, remove.status], [403, 403, 403]);
  });
});
