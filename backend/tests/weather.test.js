import { describe, it, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app, closeDatabase } from './helpers.js';
import { env } from '../src/config/env.js';

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

describe('GET /api/weather without an OpenWeather key (Open-Meteo)', () => {
  const forecast = (overrides = {}) => ({
    current: {
      temperature_2m: 17.4,
      apparent_temperature: 16.2,
      relative_humidity_2m: 62,
      weather_code: 63,
      wind_speed_10m: 4.1,
      is_day: 1,
      ...overrides,
    },
  });

  // Answers by URL, like the real services: geocoding for a place name, then the forecast.
  function stubOpenMeteo({ geocode = { results: [{ name: 'Munich', country_code: 'DE', latitude: 48.1, longitude: 11.6 }] }, current } = {}) {
    return mock.method(globalThis, 'fetch', async (url) => {
      const body = String(url).includes('geocoding-api') ? geocode : forecast(current);
      return { ok: true, status: 200, json: async () => body };
    });
  }

  let savedKey;
  before(() => {
    savedKey = env.weatherApiKey;
    env.weatherApiKey = null;
  });
  after(() => {
    env.weatherApiKey = savedKey;
  });

  it('looks a city up, then fetches its forecast, in the same shape as the keyed provider', async () => {
    const fetchMock = stubOpenMeteo();
    const res = await request(app).get('/api/weather').query({ city: 'Munich' });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      location: 'Munich',
      country: 'DE',
      temperature: 17,
      feelsLike: 16,
      humidity: 62,
      windSpeed: 4.1,
      description: 'rain',
      icon: '10d',
    });

    const urls = fetchMock.mock.calls.map((call) => new URL(call.arguments[0]));
    assert.equal(urls[0].searchParams.get('name'), 'Munich');
    assert.equal(urls[1].searchParams.get('latitude'), '48.1');
    assert.equal(urls[1].searchParams.get('wind_speed_unit'), 'ms');
  });

  it('goes straight to the forecast for coordinates', async () => {
    const fetchMock = stubOpenMeteo();
    const res = await request(app).get('/api/weather').query({ lat: '52.5', lon: '13.4' });

    assert.equal(res.status, 200);
    assert.equal(res.body.location, 'Your location');
    assert.equal(fetchMock.mock.calls.length, 1);
  });

  it('uses the night icon after dark and a sensible fallback for an unknown weather code', async () => {
    stubOpenMeteo({ current: { is_day: 0, weather_code: 0 } });
    const night = await request(app).get('/api/weather').query({ lat: '1', lon: '1' });
    assert.equal(night.body.icon, '01n');

    mock.restoreAll();
    stubOpenMeteo({ current: { weather_code: 1234 } });
    const unknown = await request(app).get('/api/weather').query({ lat: '2', lon: '2' });
    assert.equal(unknown.status, 200);
    assert.equal(unknown.body.icon, '03d');
  });

  it('answers 404 for a city nobody has heard of', async () => {
    stubOpenMeteo({ geocode: {} });
    const res = await request(app).get('/api/weather').query({ city: 'Nowhereville-xyz' });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.message, 'city not found');
  });
});
