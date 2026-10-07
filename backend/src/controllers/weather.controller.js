import { env } from '../config/env.js';

const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

// OpenWeatherMap's free tier caps out well below what unlimited traffic
// would need, so we budget a fixed number of real calls per day (shared
// across all locations - that's a genuinely global resource) and serve
// each location's own most recent successful response for anything beyond
// that instead of erroring out. State is in-memory (single process) -
// acceptable for this single-instance app, but it resets on restart, and a
// multi-instance deployment would need a shared store (e.g. Redis) to
// enforce one true shared budget.
const MAX_CALLS_PER_DAY = 100;

// Cache key precision: ~1.1km at the equator - tight enough that weather
// doesn't meaningfully vary within it, but loose enough to coalesce the
// sub-meter jitter between repeated geolocation reads from the same spot
// into the same slot.
const CACHE_KEY_PRECISION = 2;

let callCount = 0;
let callCountDate = utcDateKey();
// Keyed by rounded "lat,lon" so the quota-exhaustion / error fallback below
// serves each requester's own last-known-good weather instead of whichever
// location happened to be fetched most recently for a different request.
const lastResponseByLocation = new Map();

function locationKey(lat, lon) {
  return `${Number(lat).toFixed(CACHE_KEY_PRECISION)},${Number(lon).toFixed(CACHE_KEY_PRECISION)}`;
}

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

// A place is either coordinates or a city name (the fallback when the
// browser won't share its location).
function cityKey(city) {
  return `city:${city.trim().toLowerCase()}`;
}

async function fetchFromOpenWeather({ lat, lon, city }) {
  if (!env.weatherApiKey) {
    const err = new Error('Weather API key is not configured');
    err.status = 503;
    throw err;
  }

  const url = new URL(OPENWEATHER_URL);
  if (city) {
    url.searchParams.set('q', city);
  } else {
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lon);
  }
  url.searchParams.set('units', 'metric');
  url.searchParams.set('appid', env.weatherApiKey);

  // Counts against the daily budget as soon as the request goes out,
  // regardless of whether OpenWeatherMap's response ends up being an error -
  // the call itself is what consumes their quota.
  callCount += 1;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    // Our own API key being rejected is a server problem, not the visitor's
    // session expiring - and the client logs out on any 401.
    const err = new Error(
      response.status === 401 || response.status === 403 ? 'Weather service is unavailable' : data.message || 'Weather lookup failed'
    );
    err.status = response.status === 401 || response.status === 403 ? 503 : response.status;
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
  const { lat, lon } = req.query;
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: { message: 'lat and lon, or a city, are required' } });
  }
  if (city.length > 100) {
    return res.status(400).json({ error: { message: 'city is too long' } });
  }
  const key = city ? cityKey(city) : locationKey(lat, lon);

  try {
    resetDailyCounterIfNeeded();

    if (callCount >= MAX_CALLS_PER_DAY) {
      const cached = lastResponseByLocation.get(key);
      if (cached) {
        return res.json(cached);
      }
      return res.status(503).json({
        error: { message: 'Daily weather API quota reached and no cached response is available yet for this location' },
      });
    }

    const result = await fetchFromOpenWeather({ lat, lon, city });
    lastResponseByLocation.set(key, result);
    res.json(result);
  } catch (err) {
    // Prefer serving this location's last known-good response over a hard
    // failure, whether the call above failed because we're out of budget or
    // for any other reason (network blip, upstream error, etc).
    const cached = lastResponseByLocation.get(key);
    if (cached) {
      return res.json(cached);
    }
    next(err);
  }
}
