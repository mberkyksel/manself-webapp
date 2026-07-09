import { env } from '../config/env.js';

const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Proxied through the backend so the API key never reaches the browser.
export async function getCurrentWeather(req, res, next) {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: { message: 'lat and lon are required' } });
    }
    if (!env.weatherApiKey) {
      return res.status(503).json({ error: { message: 'Weather API key is not configured' } });
    }

    const url = new URL(OPENWEATHER_URL);
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lon);
    url.searchParams.set('units', 'metric');
    url.searchParams.set('appid', env.weatherApiKey);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: { message: data.message || 'Weather lookup failed' } });
    }

    res.json({
      location: data.name,
      country: data.sys?.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed,
      description: data.weather?.[0]?.description,
      icon: data.weather?.[0]?.icon,
    });
  } catch (err) {
    next(err);
  }
}
