import { Task, Board, CalendarEvent } from '../models/index.js';

async function getOrCreateBoard(userId) {
  const [board] = await Board.findOrCreate({
    where: { userId },
    defaults: { name: 'My Board' },
  });
  return board;
}

export async function listTasks(req, res, next) {
  try {
    const board = await getOrCreateBoard(req.user.id);
    const tasks = await Task.findAll({
      where: { boardId: board.id },
      order: [['position', 'ASC']],
      include: [
        {
          model: CalendarEvent,
          as: 'calendarEvents',
          attributes: ['id', 'title', 'startTime', 'endTime', 'allDay'],
        },
      ],
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const board = await getOrCreateBoard(req.user.id);
    const { title, description, status, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: { message: 'title is required' } });
    }

    const targetStatus = status || 'todo';

    // New cards go to the end of their column.
    const maxPosition = await Task.max('position', {
      where: { boardId: board.id, status: targetStatus },
    });

    const task = await Task.create({
      boardId: board.id,
      userId: req.user.id,
      title: title.trim(),
      description,
      status: targetStatus,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      position: (Number(maxPosition) || 0) + 1,
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const board = await getOrCreateBoard(req.user.id);
    // Scoped to the caller's own board so one user can't edit another
    // user's task by guessing/iterating ids.
    const task = await Task.findOne({ where: { id: req.params.id, boardId: board.id } });
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }

    const { title, description, status, priority, position, dueDate } = req.body;
    await task.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(position !== undefined && { position }),
      ...(dueDate !== undefined && { dueDate }),
    });

    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const board = await getOrCreateBoard(req.user.id);
    const task = await Task.findOne({ where: { id: req.params.id, boardId: board.id } });
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }
    await task.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
