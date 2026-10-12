import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app, models, resetDatabase, closeDatabase } from './helpers.js';

const PASSWORD = 'correct-horse-1';
const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function registerUser(email) {
  const res = await request(app).post('/api/auth/register').send({ name: 'Chore Tester', email, password: PASSWORD });
  assert.equal(res.status, 201);
  return res.body.token;
}

const getChores = (token) => request(app).get('/api/chores').set(auth(token));
const saveChores = (token, body) => request(app).put('/api/chores').set(auth(token)).send(body);

const SAMPLE = {
  choresByDate: {
    '2026-10-07': [{ id: 'c1', type: 'laundry', state: 'colors', isDone: false, seriesId: null }],
  },
  recurringSeries: {
    s1: { type: 'trash', state: 'yellow', recurrence: 'weekly', anchorDateKey: '2026-10-13' },
  },
};

before(resetDatabase);
beforeEach(resetDatabase);
after(closeDatabase);

describe('chores API', () => {
  it('needs a login', async () => {
    assert.equal((await request(app).get('/api/chores')).status, 401);
    assert.equal((await request(app).put('/api/chores').send(SAMPLE)).status, 401);
  });

  it('gives a new user no chores at all', async () => {
    const token = await registerUser('new@example.test');
    const res = await getChores(token);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { choresByDate: {}, recurringSeries: {} });
  });

  it('saves and returns a user\'s chores, and a later save replaces the whole document', async () => {
    const token = await registerUser('a@example.test');

    assert.equal((await saveChores(token, SAMPLE)).status, 200);
    assert.deepEqual((await getChores(token)).body, SAMPLE);

    const replacement = { choresByDate: {}, recurringSeries: {} };
    assert.equal((await saveChores(token, replacement)).status, 200);
    assert.deepEqual((await getChores(token)).body, replacement);
    assert.equal(await models.ChoreState.count(), 1, 'still one row per user');
  });

  it('keeps each user\'s chores to themselves', async () => {
    const alice = await registerUser('alice@example.test');
    const bob = await registerUser('bob@example.test');

    await saveChores(alice, SAMPLE);

    assert.deepEqual((await getChores(bob)).body, { choresByDate: {}, recurringSeries: {} });
    assert.deepEqual((await getChores(alice)).body, SAMPLE);
  });

  it('deletes the chores along with the account', async () => {
    const token = await registerUser('gone@example.test');
    await saveChores(token, SAMPLE);
    assert.equal(await models.ChoreState.count(), 1);

    const res = await request(app).delete('/api/auth/account').set(auth(token)).send({ currentPassword: PASSWORD });
    assert.equal(res.status, 204);
    assert.equal(await models.ChoreState.count(), 0);
  });

  describe('validation', () => {
    const cases = {
      'a body that is not an object': ['nope'],
      'missing recurringSeries': [{ choresByDate: {} }],
      'a date key that is not a date': [{ choresByDate: { tuesday: [] }, recurringSeries: {} }],
      'chores that are not a list': [{ choresByDate: { '2026-10-07': {} }, recurringSeries: {} }],
      'a chore without an id': [{ choresByDate: { '2026-10-07': [{ type: 'mop' }] }, recurringSeries: {} }],
      'a chore without a type': [{ choresByDate: { '2026-10-07': [{ id: 'x' }] }, recurringSeries: {} }],
      'a repeat rule that is not an object': [{ choresByDate: {}, recurringSeries: { s: 'weekly' } }],
    };
    for (const [name, [body]] of Object.entries(cases)) {
      it(`rejects ${name}`, async () => {
        const token = await registerUser('v@example.test');
        assert.equal((await saveChores(token, body)).status, 400);
        assert.deepEqual((await getChores(token)).body, { choresByDate: {}, recurringSeries: {} }, 'nothing was stored');
      });
    }

    it('rejects an absurd number of chores', async () => {
      const token = await registerUser('big@example.test');
      const chores = Array.from({ length: 3001 }, (_, i) => ({ id: `c${i}`, type: 'mop' }));
      const res = await saveChores(token, { choresByDate: { '2026-10-07': chores }, recurringSeries: {} });
      assert.equal(res.status, 400);
    });

    it('drops unknown top-level keys', async () => {
      const token = await registerUser('extra@example.test');
      await saveChores(token, { ...SAMPLE, somethingElse: 'x' });
      assert.deepEqual(Object.keys((await getChores(token)).body).sort(), ['choresByDate', 'recurringSeries']);
    });
  });
});

describe('demo chores', () => {
  it('seeds the demo account with chores relative to the browser\'s today', async () => {
    const demo = await request(app).post('/api/auth/demo').send({ today: '2026-10-07' });
    assert.equal(demo.status, 200);

    const { choresByDate, recurringSeries } = (await getChores(demo.body.token)).body;
    const today = choresByDate['2026-10-07'];
    assert.equal(today.length, 3);
    assert.equal(today.filter((c) => c.isDone).length, 2, 'one chore short of done');
    assert.deepEqual(Object.keys(choresByDate).sort(), ['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']);

    const [series] = Object.values(recurringSeries);
    assert.deepEqual(series, { type: 'trash', state: 'grey', recurrence: 'weekly', anchorDateKey: '2026-10-09' });
  });

  it('falls back to the server\'s date when the browser sends nothing usable', async () => {
    for (const body of [{}, { today: 'tomorrow' }, { today: 20261007 }]) {
      const demo = await request(app).post('/api/auth/demo').send(body);
      assert.equal(demo.status, 200);
      const { choresByDate } = (await getChores(demo.body.token)).body;
      assert.equal(Object.keys(choresByDate).length, 4);
      assert.ok(Object.keys(choresByDate).every((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)));
    }
  });

  it('puts the chores back the way they were on the next demo login', async () => {
    const first = await request(app).post('/api/auth/demo').send({ today: '2026-10-07' });
    await saveChores(first.body.token, { choresByDate: {}, recurringSeries: {} });

    const second = await request(app).post('/api/auth/demo').send({ today: '2026-10-07' });
    const { choresByDate } = (await getChores(second.body.token)).body;
    assert.equal(choresByDate['2026-10-07'].length, 3);
    assert.equal(await models.ChoreState.count(), 1);
  });

  it('does not hand any of the demo\'s chores to a user who registers afterwards', async () => {
    // The reported bug: try the demo, then create your own account.
    const demo = await request(app).post('/api/auth/demo').send({ today: '2026-10-07' });
    assert.ok(Object.keys((await getChores(demo.body.token)).body.choresByDate).length > 0);

    const token = await registerUser('after-demo@example.test');
    assert.deepEqual((await getChores(token)).body, { choresByDate: {}, recurringSeries: {} });
  });
});
