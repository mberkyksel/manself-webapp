import { describe, it, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app, closeDatabase } from './helpers.js';

const upstreamBody = {
  name: 'Testville',
  sys: { country: 'DE' },
  main: { temp: 14.4, feels_like: 13.6, humidity: 50 },
  wind: { speed: 3 },
  weather: [{ description: 'clear sky', icon: '01d' }],
};

function stubFetch(status, body) {
  return mock.method(globalThis, 'fetch', async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));
}

after(closeDatabase);
afterEach(() => mock.restoreAll());

describe('GET /api/weather', () => {
  it('needs either coordinates or a city', async () => {
    const res = await request(app).get('/api/weather');
    assert.equal(res.status, 400);
  });

  it('rejects an over-long city name', async () => {
    const res = await request(app).get('/api/weather').query({ city: 'x'.repeat(101) });
    assert.equal(res.status, 400);
  });

  it('looks up a city by name and rounds the numbers', async () => {
    const fetchMock = stubFetch(200, upstreamBody);
    const res = await request(app).get('/api/weather').query({ city: 'Testville' });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      location: 'Testville',
      country: 'DE',
      temperature: 14,
      feelsLike: 14,
      humidity: 50,
      windSpeed: 3,
      description: 'clear sky',
      icon: '01d',
    });

    const url = new URL(fetchMock.mock.calls[0].arguments[0]);
    assert.equal(url.searchParams.get('q'), 'Testville');
    assert.equal(url.searchParams.get('lat'), null);
  });

  it('looks up coordinates when given lat and lon', async () => {
    const fetchMock = stubFetch(200, upstreamBody);
    const res = await request(app).get('/api/weather').query({ lat: '52.52', lon: '13.4' });

    assert.equal(res.status, 200);
    const url = new URL(fetchMock.mock.calls[0].arguments[0]);
    assert.equal(url.searchParams.get('lat'), '52.52');
    assert.equal(url.searchParams.get('lon'), '13.4');
    assert.equal(url.searchParams.get('q'), null);
  });

  it('passes an unknown city through as a 404', async () => {
    stubFetch(404, { message: 'city not found' });
    const res = await request(app).get('/api/weather').query({ city: 'Nowhereville' });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.message, 'city not found');
  });

  it('never turns a rejected API key into a 401 (the client would log the user out)', async () => {
    stubFetch(401, { message: 'Invalid API key' });
    const res = await request(app).get('/api/weather').query({ city: 'Keyless' });
    assert.equal(res.status, 503);
  });

  it("serves a place's last good answer when the upstream call later fails", async () => {
    stubFetch(200, upstreamBody);
    await request(app).get('/api/weather').query({ city: 'Cacheville' });

    mock.restoreAll();
    mock.method(globalThis, 'fetch', async () => {
      throw new Error('network down');
    });
    const res = await request(app).get('/api/weather').query({ city: 'cacheville' });

    assert.equal(res.status, 200);
    assert.equal(res.body.location, 'Testville');
  });
});
