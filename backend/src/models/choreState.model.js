import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

// A user's chores: { choresByDate, recurringSeries } as one JSON document.
export class ChoreState extends Model {}

ChoreState.init(
  {
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'ChoreState',
    tableName: 'chore_states',
    underscored: true,
  }
);
