import { env } from '../config/env.js';

const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

// OpenWeatherMap's free tier caps out well below what unlimited traffic
// would need, so we budget a fixed number of real calls per day and serve
// the most recent successful response for anything beyond that instead of
// erroring out. State is in-memory (single process) - acceptable for this
// single-instance app, but it resets on restart, and a multi-instance
// deployment would need a shared store (e.g. Redis) to enforce one true
// shared budget.
const MAX_CALLS_PER_DAY = 100;

let callCount = 0;
let callCountDate = utcDateKey();
let lastResponse = null;

// Calendar day in UTC, not server-local time, so the daily reset is the
// same instant regardless of which timezone the host machine happens to be
// configured with.
function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function resetDailyCounterIfNeeded() {
  const today = utcDateKey();
  if (callCountDate !== today) {
    callCountDate = today;
    callCount = 0;
  }
}

async function fetchFromOpenWeather(lat, lon) {
  if (!env.weatherApiKey) {
    const err = new Error('Weather API key is not configured');
    err.status = 503;
    throw err;
  }

  const url = new URL(OPENWEATHER_URL);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('units', 'metric');
  url.searchParams.set('appid', env.weatherApiKey);

  // Counts against the daily budget as soon as the request goes out,
  // regardless of whether OpenWeatherMap's response ends up being an error -
  // the call itself is what consumes their quota.
  callCount += 1;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.message || 'Weather lookup failed');
    err.status = response.status;
    throw err;
  }

  return {
    location: data.name,
    country: data.sys?.country,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: data.wind?.speed,
    description: data.weather?.[0]?.description,
    icon: data.weather?.[0]?.icon,
  };
}

export async function getCurrentWeather(req, res, next) {
  try {
    resetDailyCounterIfNeeded();

    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: { message: 'lat and lon are required' } });
    }

    if (callCount >= MAX_CALLS_PER_DAY) {
      if (lastResponse) {
        return res.json(lastResponse);
      }
      return res.status(503).json({
        error: { message: 'Daily weather API quota reached and no cached response is available yet' },
      });
    }

    lastResponse = await fetchFromOpenWeather(lat, lon);
    res.json(lastResponse);
  } catch (err) {
    // Prefer serving the last known-good response over a hard failure,
    // whether the call above failed because we're out of budget or for any
    // other reason (network blip, upstream error, etc).
    if (lastResponse) {
      return res.json(lastResponse);
    }
    next(err);
  }
}
