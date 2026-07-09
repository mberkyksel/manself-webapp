import { env } from '../config/env.js';

const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

// OpenWeatherMap's free tier has a limited call quota, so the endpoint
// always returns this fixed sample instead of hitting the real API for now.
// Swap getCurrentWeather to call fetchFromOpenWeather() once live data is
// worth spending the quota on.
const DEFAULT_WEATHER_RESPONSE = {
  location: 'Gartenfeld',
  country: 'DE',
  temperature: 23,
  feelsLike: 23,
  humidity: 59,
  windSpeed: 2.68,
  description: 'clear sky',
  icon: '01d',
};

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

export async function getCurrentWeather(req, res) {
  res.json(DEFAULT_WEATHER_RESPONSE);
}
