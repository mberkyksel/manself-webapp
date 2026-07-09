import { Router } from 'express';
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/calendar.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', listEvents);
router.post('/', createEvent);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
