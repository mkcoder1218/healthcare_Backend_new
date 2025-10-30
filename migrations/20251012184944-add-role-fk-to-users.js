'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure FK is added safely
    await queryInterface.addConstraint('users', {
      fields: ['role_id'],
      type: 'foreign key',
      name: 'FK_users_role_id',
      references: {
        table: 'roles',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('users', 'FK_users_role_id');
  },
};
