import { ChoreState } from '../models/index.js';

// What a user with no saved chores gets.
export const EMPTY_CHORE_STATE = { choresByDate: {}, recurringSeries: {} };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
// Generous (a daily chore is ~31 entries) but stops a runaway client from
// storing an unbounded document.
const MAX_CHORES = 3000;
const MAX_SERIES = 200;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Checks the document's shape and returns it with only the two known keys, or
// an error message. Chore contents are only checked for the fields the app
// relies on (id, type), so the client can add optional fields without a
// server change.
export function parseChoreState(body) {
  if (!isPlainObject(body) || !isPlainObject(body.choresByDate) || !isPlainObject(body.recurringSeries)) {
    return { error: 'choresByDate and recurringSeries must be objects' };
  }

  let total = 0;
  for (const [dateKey, chores] of Object.entries(body.choresByDate)) {
    if (!DATE_KEY.test(dateKey)) return { error: `"${dateKey}" is not a YYYY-MM-DD date` };
    if (!Array.isArray(chores)) return { error: `chores for ${dateKey} must be a list` };
    for (const chore of chores) {
      if (!isPlainObject(chore) || typeof chore.id !== 'string' || typeof chore.type !== 'string') {
        return { error: `each chore needs a text id and type (${dateKey})` };
      }
    }
    total += chores.length;
    if (total > MAX_CHORES) return { error: `too many chores (limit ${MAX_CHORES})` };
  }

  const seriesEntries = Object.entries(body.recurringSeries);
  if (seriesEntries.length > MAX_SERIES) return { error: `too many repeat rules (limit ${MAX_SERIES})` };
  if (seriesEntries.some(([, series]) => !isPlainObject(series))) {
    return { error: 'each repeat rule must be an object' };
  }

  return { value: { choresByDate: body.choresByDate, recurringSeries: body.recurringSeries } };
}

export async function getChores(req, res, next) {
  try {
    const row = await ChoreState.findOne({ where: { userId: req.user.id } });
    res.json(row?.data?.choresByDate ? row.data : EMPTY_CHORE_STATE);
  } catch (err) {
    next(err);
  }
}

// Replaces the user's whole chore document.
export async function saveChores(req, res, next) {
  try {
    const { value, error } = parseChoreState(req.body);
    if (error) return res.status(400).json({ error: { message: error } });

    const [row, created] = await ChoreState.findOrCreate({
      where: { userId: req.user.id },
      defaults: { data: value },
    });
    if (!created) await row.update({ data: value });

    res.json(row.data);
  } catch (err) {
    next(err);
  }
}
