import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class CalendarEvent extends Model {}

CalendarEvent.init(
  {
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    allDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Unused until Google Calendar sync lands; present now so that
    // feature doesn't require a schema migration later.
    googleEventId: {
      type: DataTypes.STRING(255),
    },
    source: {
      type: DataTypes.STRING(20),
      defaultValue: 'local',
    },
  },
  {
    sequelize,
    modelName: 'CalendarEvent',
    tableName: 'calendar_events',
    underscored: true,
  }
);
