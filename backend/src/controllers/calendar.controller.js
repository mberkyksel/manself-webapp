import { CalendarEvent } from '../models/index.js';
import { getDefaultUser } from '../services/demoUser.service.js';

export async function listEvents(req, res, next) {
  try {
    const user = await getDefaultUser();
    const events = await CalendarEvent.findAll({
      where: { userId: user.id },
      order: [['startTime', 'ASC']],
    });
    res.json(events);
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req, res, next) {
  try {
    const user = await getDefaultUser();
    const { title, description, startTime, endTime, allDay, taskId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: { message: 'title is required' } });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ error: { message: 'startTime and endTime are required' } });
    }

    const event = await CalendarEvent.create({
      userId: user.id,
      taskId: taskId || null,
      title: title.trim(),
      description,
      startTime,
      endTime,
      allDay: Boolean(allDay),
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req, res, next) {
  try {
    const event = await CalendarEvent.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }

    const { title, description, startTime, endTime, allDay } = req.body;
    await event.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(allDay !== undefined && { allDay }),
    });

    res.json(event);
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const event = await CalendarEvent.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }
    await event.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
