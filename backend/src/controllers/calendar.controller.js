import { CalendarEvent, Task } from '../models/index.js';

export async function listEvents(req, res, next) {
  try {
    const events = await CalendarEvent.findAll({
      where: { userId: req.user.id },
      order: [['startTime', 'ASC']],
      include: [{ model: Task, as: 'task', attributes: ['id', 'title', 'status'] }],
    });
    res.json(events);
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req, res, next) {
  try {
    const { title, description, startTime, endTime, allDay, taskId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: { message: 'title is required' } });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ error: { message: 'startTime and endTime are required' } });
    }

    const event = await CalendarEvent.create({
      userId: req.user.id,
      taskId: taskId || null,
      title: title.trim(),
      description,
      startTime,
      endTime,
      allDay: Boolean(allDay),
    });
    await event.reload({ include: [{ model: Task, as: 'task', attributes: ['id', 'title', 'status'] }] });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req, res, next) {
  try {
    // Scoped to the caller's own events so one user can't edit another
    // user's event by guessing/iterating ids.
    const event = await CalendarEvent.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }

    const { title, description, startTime, endTime, allDay, taskId } = req.body;
    await event.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(allDay !== undefined && { allDay }),
      ...(taskId !== undefined && { taskId: taskId || null }),
    });
    await event.reload({ include: [{ model: Task, as: 'task', attributes: ['id', 'title', 'status'] }] });

    res.json(event);
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const event = await CalendarEvent.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }
    await event.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
