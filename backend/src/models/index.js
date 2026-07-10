import { sequelize } from '../config/database.js';
import { User } from './user.model.js';
import { Board } from './board.model.js';
import { Task } from './task.model.js';
import { CalendarEvent } from './calendarEvent.model.js';
import { Note } from './note.model.js';

User.hasMany(Board, { foreignKey: { name: 'userId', allowNull: false }, as: 'boards' });
Board.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

Board.hasMany(Task, { foreignKey: { name: 'boardId', allowNull: false }, as: 'tasks' });
Task.belongsTo(Board, { foreignKey: { name: 'boardId', allowNull: false }, as: 'board' });

User.hasMany(Task, { foreignKey: { name: 'userId', allowNull: false }, as: 'tasks' });
Task.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

// Optional link: a calendar event may or may not be tied to a task's due date.
Task.hasMany(CalendarEvent, { foreignKey: { name: 'taskId', allowNull: true }, as: 'calendarEvents' });
CalendarEvent.belongsTo(Task, { foreignKey: { name: 'taskId', allowNull: true }, as: 'task' });

User.hasMany(CalendarEvent, { foreignKey: { name: 'userId', allowNull: false }, as: 'calendarEvents' });
CalendarEvent.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

User.hasMany(Note, { foreignKey: { name: 'userId', allowNull: false }, as: 'notes' });
Note.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, as: 'user' });

export { sequelize, User, Board, Task, CalendarEvent, Note };
