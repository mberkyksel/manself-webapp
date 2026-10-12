import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import taskRoutes from './routes/task.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import authRoutes from './routes/auth.routes.js';
import noteRoutes from './routes/note.routes.js';
import choreRoutes from './routes/chore.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public, non-sensitive flags the frontend needs before anyone is logged in.
app.get('/api/config', (req, res) => {
  res.json({ demoEnabled: env.demoMode });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar-events', calendarRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/chores', choreRoutes);

app.use(errorHandler);

export default app;
