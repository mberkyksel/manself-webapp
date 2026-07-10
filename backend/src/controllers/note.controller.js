import { Note } from '../models/index.js';

const MAX_NOTES_PER_USER = 5;

export async function listNotes(req, res, next) {
  try {
    const notes = await Note.findAll({
      where: { userId: req.user.id },
      order: [['zIndex', 'ASC']],
    });
    res.json(notes);
  } catch (err) {
    next(err);
  }
}

export async function createNote(req, res, next) {
  try {
    const count = await Note.count({ where: { userId: req.user.id } });
    if (count >= MAX_NOTES_PER_USER) {
      return res.status(400).json({ error: { message: `You can only have ${MAX_NOTES_PER_USER} notes at once` } });
    }

    const { text, color, positionX, positionY } = req.body;
    const maxZIndex = await Note.max('zIndex', { where: { userId: req.user.id } });

    const note = await Note.create({
      userId: req.user.id,
      text: text || '',
      color: color || 'yellow',
      positionX: positionX ?? 40,
      positionY: positionY ?? 40,
      zIndex: (Number(maxZIndex) || 0) + 1,
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

export async function updateNote(req, res, next) {
  try {
    // Scoped to the caller's own notes so one user can't edit another
    // user's note by guessing/iterating ids.
    const note = await Note.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!note) {
      return res.status(404).json({ error: { message: 'Note not found' } });
    }

    const { text, color, positionX, positionY, zIndex } = req.body;
    await note.update({
      ...(text !== undefined && { text }),
      ...(color !== undefined && { color }),
      ...(positionX !== undefined && { positionX }),
      ...(positionY !== undefined && { positionY }),
      ...(zIndex !== undefined && { zIndex }),
    });

    res.json(note);
  } catch (err) {
    next(err);
  }
}

export async function deleteNote(req, res, next) {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!note) {
      return res.status(404).json({ error: { message: 'Note not found' } });
    }
    await note.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
