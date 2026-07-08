export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('calendar_events', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    // Nullable: an event can exist standalone or be linked to a task's due date.
    task_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'tasks', key: 'id' },
      onDelete: 'SET NULL',
    },
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    start_time: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    end_time: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    all_day: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    // Present now (unused until Google Calendar sync lands) so that feature
    // doesn't require a schema migration later.
    google_event_id: {
      type: Sequelize.STRING(255),
    },
    source: {
      type: Sequelize.STRING(20),
      defaultValue: 'local',
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

  await queryInterface.addIndex('calendar_events', ['user_id', 'start_time'], {
    name: 'idx_calendar_user_time',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('calendar_events');
}
