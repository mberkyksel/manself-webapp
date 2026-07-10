import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Note extends Model {}

Note.init(
  {
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    color: {
      type: DataTypes.ENUM('yellow', 'cyan', 'green'),
      allowNull: false,
      defaultValue: 'yellow',
    },
    positionX: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    positionY: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    // Highest wins the top stacking layer; bumped whenever a note is
    // clicked/dragged so it jumps above its siblings.
    zIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Note',
    tableName: 'notes',
    underscored: true,
  }
);
