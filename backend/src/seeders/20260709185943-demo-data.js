import { User, Board, Task, CalendarEvent } from '../models/index.js';

// Seeds the same demo user/board that task.controller.js and
// calendar.controller.js auto-provision via getDefaultUser(), so this data
// shows up in the app immediately (no auth flow exists yet to pick a
// different user).
export async function up() {
  const [user] = await User.findOrCreate({
    where: { email: 'demo@manself.local' },
    defaults: { name: 'Demo User', passwordHash: 'unused-until-auth-is-implemented' },
  });

  const [board] = await Board.findOrCreate({
    where: { userId: user.id },
    defaults: { name: 'My Board' },
  });

  const tasks = [
    { title: 'Design onboarding flow', status: 'todo', priority: 'high', position: 1 },
    { title: 'Write API docs', status: 'todo', priority: 'medium', position: 2 },
    { title: 'Fix calendar timezone bug', status: 'todo', priority: 'low', position: 3 },
    { title: 'Implement drag-and-drop polish', status: 'in_progress', priority: 'medium', position: 1 },
    { title: 'Review PR #12', status: 'in_progress', priority: 'high', position: 2 },
    { title: 'Set up CI pipeline', status: 'done', priority: 'medium', position: 1 },
    { title: 'Deploy staging environment', status: 'done', priority: 'low', position: 2 },
  ];

  // Re-running `npm run seed` shouldn't pile up duplicates.
  const alreadySeeded = await Task.findOne({ where: { boardId: board.id, title: tasks[0].title } });
  if (alreadySeeded) {
    return;
  }

  await Task.bulkCreate(tasks.map((task) => ({ ...task, boardId: board.id, userId: user.id })));

  const today = new Date();
  const at = (dayOffset, hour, minute) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);
  const allDay = (dayOffset) => ({
    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, 0, 0, 0),
    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, 23, 59, 59),
  });

  const events = [
    { title: 'Team standup', startTime: at(0, 9, 0), endTime: at(0, 9, 15), allDay: false },
    { title: '1:1 with manager', startTime: at(1, 10, 30), endTime: at(1, 11, 0), allDay: false },
    { title: 'Product demo', startTime: at(2, 14, 0), endTime: at(2, 15, 0), allDay: false },
    { title: 'Design review', startTime: at(3, 11, 0), endTime: at(3, 12, 0), allDay: false },
    { title: 'Company holiday', ...allDay(5), allDay: true },
    { title: 'Sprint planning', startTime: at(7, 9, 30), endTime: at(7, 10, 30), allDay: false },
  ];

  await CalendarEvent.bulkCreate(events.map((event) => ({ ...event, userId: user.id })));
}

export async function down() {
  const taskTitles = [
    'Design onboarding flow',
    'Write API docs',
    'Fix calendar timezone bug',
    'Implement drag-and-drop polish',
    'Review PR #12',
    'Set up CI pipeline',
    'Deploy staging environment',
  ];
  await Task.destroy({ where: { title: taskTitles } });

  const eventTitles = [
    'Team standup',
    '1:1 with manager',
    'Product demo',
    'Design review',
    'Company holiday',
    'Sprint planning',
  ];
  await CalendarEvent.destroy({ where: { title: eventTitles } });
}
