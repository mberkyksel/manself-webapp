import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Board extends Model {}

Board.init(
  {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'My Board',
    },
  },
  {
    sequelize,
    modelName: 'Board',
    tableName: 'boards',
    underscored: true,
    updatedAt: false, // boards table only tracks created_at per schema
  }
);
