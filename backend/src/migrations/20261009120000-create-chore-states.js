// One row per user holding that user's chores as a JSON document: the chores
// by day plus the repeat rules. The shape is owned by the frontend's chore
// store (and validated in chore.controller.js); keeping it a single document
// lets the existing client logic stay as it is while the data becomes
// per-user and server-side instead of sitting in the browser.
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('chore_states', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    data: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: Sequelize.literal("'{}'::jsonb"),
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('chore_states');
}
