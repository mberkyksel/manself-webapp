export async function up(queryInterface, Sequelize) {
  // Named ENUM type so the DB schema matches the SQL source of truth exactly
  // (Sequelize's DataTypes.ENUM would otherwise auto-name this enum_notes_color).
  await queryInterface.sequelize.query("CREATE TYPE note_color AS ENUM ('yellow', 'cyan', 'green');");

  await queryInterface.createTable('notes', {
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
    text: {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    color: {
      type: 'note_color',
      allowNull: false,
      defaultValue: 'yellow',
    },
    position_x: {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    position_y: {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    z_index: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
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

  await queryInterface.addIndex('notes', ['user_id'], {
    name: 'idx_notes_user',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('notes');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS note_color;');
}
