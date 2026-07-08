import { Router } from 'express';
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/calendar.controller.js';

const router = Router();

router.get('/', listEvents);
router.post('/', createEvent);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
