import { Router } from 'express';
import { getCurrentWeather } from '../controllers/weather.controller.js';

const router = Router();

router.get('/', getCurrentWeather);

export default router;
