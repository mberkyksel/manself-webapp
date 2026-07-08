import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Task extends Model {}

Task.init(
  {
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'done'),
      allowNull: false,
      defaultValue: 'todo',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
    // FLOAT so drag-drop reordering can average neighboring positions
    // instead of re-numbering every row in the column.
    position: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
    },
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    underscored: true,
  }
);
