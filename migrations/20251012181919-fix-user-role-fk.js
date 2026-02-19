'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Fix any invalid role_id
    await queryInterface.sequelize.query(`
      UPDATE "users"
      SET role_id = NULL
      WHERE role_id IS NOT NULL
        AND role_id NOT IN (SELECT id FROM "roles");
    `);

    // 2. Drop old constraint if exists
    const constraintNameQuery = `
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'users'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%role_id%';
    `;
    const results = await queryInterface.sequelize.query(constraintNameQuery);
    const constraintName = results[0][0]?.constraint_name;
    if (constraintName) {
      await queryInterface.removeConstraint('users', constraintName);
    }

    // 3. Add new FK
    await queryInterface.addConstraint('users', {
      fields: ['role_id'],
      type: 'foreign key',
      name: 'users_role_id_fkey', // optional, explicitly set name
      references: {
        table: 'roles',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove FK on rollback
    await queryInterface.removeConstraint('users', 'users_role_id_fkey');
  },
};
