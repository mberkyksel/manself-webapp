export async function up(queryInterface, Sequelize) {
  // Named ENUM types so the DB schema matches the SQL source of truth exactly
  // (Sequelize's DataTypes.ENUM would otherwise auto-name these enum_tasks_status/priority).
  await queryInterface.sequelize.query(
    "CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');"
  );
  await queryInterface.sequelize.query(
    "CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');"
  );

  await queryInterface.createTable('tasks', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    board_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'boards', key: 'id' },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    status: {
      type: 'task_status',
      allowNull: false,
      defaultValue: 'todo',
    },
    priority: {
      type: 'task_priority',
      allowNull: false,
      defaultValue: 'medium',
    },
    // FLOAT (not integer) so drag-drop reordering can average neighboring
    // positions instead of re-numbering every row in the column.
    position: {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    due_date: {
      type: Sequelize.DATEONLY,
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

  await queryInterface.addIndex('tasks', ['board_id', 'status'], {
    name: 'idx_tasks_board_status',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('tasks');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS task_status;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS task_priority;');
}
