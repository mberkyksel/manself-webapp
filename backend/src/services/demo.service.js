import bcrypt from 'bcrypt';
import { sequelize } from '../config/database.js';
import { User, Board, Task, CalendarEvent, Note } from '../models/index.js';

export const DEMO_EMAIL = 'demo@manself.local';
export const DEMO_PASSWORD = 'demo-manself';

const DEMO_NAME = 'Demo User';
const DEMO_TIMEZONE = 'Europe/Berlin';
const SALT_ROUNDS = 10;

function dayAt(offset, hour = 0, minute = 0) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute);
}

function dateOnly(offset) {
  const d = dayAt(offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Everything is relative to "today", so the demo always has something due
// today, something overdue, and events in the coming days no matter when it's
// (re)seeded - fixed dates would go stale within a day.
function buildTasks() {
  return [
    { title: 'Book dentist appointment', status: 'todo', priority: 'high', dueDate: dateOnly(-2), position: 1 },
    { title: 'Renew gym membership', status: 'todo', priority: 'medium', dueDate: dateOnly(0), position: 2 },
    {
      title: 'Plan weekend trip itinerary',
      description: 'Trains, the hostel booking, and a rainy-day backup plan.',
      status: 'todo',
      priority: 'medium',
      dueDate: dateOnly(3),
      position: 3,
    },
    { title: 'Read chapter 4 of the data book', status: 'todo', priority: 'low', dueDate: null, position: 4 },
    {
      title: 'Prepare Friday demo slides',
      description: 'Keep it to five slides and one live walkthrough.',
      status: 'in_progress',
      priority: 'high',
      dueDate: dateOnly(0),
      position: 1,
    },
    { title: 'Refactor the settings page', status: 'in_progress', priority: 'medium', dueDate: dateOnly(2), position: 2 },
    { title: 'Set up the CI pipeline', status: 'done', priority: 'low', dueDate: null, position: 1 },
    { title: 'Pay electricity bill', status: 'done', priority: 'medium', dueDate: dateOnly(-1), position: 2 },
  ];
}

function buildEvents(demoSlidesTaskId) {
  const allDay = (offset) => ({ startTime: dayAt(offset, 0, 0), endTime: dayAt(offset, 23, 59), allDay: true });
  const timed = (offset, [h1, m1], [h2, m2]) => ({
    startTime: dayAt(offset, h1, m1),
    endTime: dayAt(offset, h2, m2),
    allDay: false,
  });

  return [
    { title: 'Team standup', ...timed(0, [9, 0], [9, 15]) },
    { title: 'Demo rehearsal', ...timed(1, [15, 0], [16, 0]), taskId: demoSlidesTaskId },
    { title: 'Lunch with Anna', ...timed(2, [12, 30], [13, 30]) },
    { title: 'Rent due', ...allDay(4) },
    { title: 'Weekend trip', ...allDay(5) },
    { title: 'Sprint planning', ...timed(7, [9, 30], [10, 30]) },
  ];
}

// X is far past any real viewport on purpose: StickyNote clamps its on-screen
// position to the viewport, so this pins the pile to the right-hand edge at
// any screen width instead of covering the welcome message in the middle.
const NOTES = [
  { text: 'Welcome to manself! Jot things down here.', color: 'yellow', positionX: 9999, positionY: 340 },
  { text: 'Groceries: oat milk, eggs, basil', color: 'cyan', positionX: 9999, positionY: 450 },
  { text: 'Call mum on Sunday', color: 'green', positionX: 9999, positionY: 560 },
];

// Creates the demo account if it doesn't exist, restores its credentials
// (a visitor may have been poking at the profile), and replaces everything it
// owns with fresh sample data. Safe to call repeatedly.
export async function resetDemoAccount() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  return sequelize.transaction(async (transaction) => {
    const [user] = await User.findOrCreate({
      where: { email: DEMO_EMAIL },
      defaults: { name: DEMO_NAME, passwordHash, timezone: DEMO_TIMEZONE },
      transaction,
    });
    await user.update({ name: DEMO_NAME, passwordHash, timezone: DEMO_TIMEZONE, location: null }, { transaction });

    const where = { userId: user.id };
    await CalendarEvent.destroy({ where, transaction });
    await Task.destroy({ where, transaction });
    await Note.destroy({ where, transaction });
    await Board.destroy({ where, transaction });

    const board = await Board.create({ userId: user.id, name: 'My Board' }, { transaction });

    const tasks = await Task.bulkCreate(
      buildTasks().map((task) => ({ ...task, boardId: board.id, userId: user.id })),
      { transaction, returning: true }
    );
    const demoSlides = tasks.find((task) => task.title === 'Prepare Friday demo slides');

    await CalendarEvent.bulkCreate(
      buildEvents(demoSlides.id).map((event) => ({ ...event, userId: user.id })),
      { transaction }
    );

    await Note.bulkCreate(
      NOTES.map((note, index) => ({ ...note, zIndex: index + 1, userId: user.id })),
      { transaction }
    );

    return user;
  });
}

export function isDemoUser(user) {
  return user?.email === DEMO_EMAIL;
}
