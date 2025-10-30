'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add foreign key
    await queryInterface.addConstraint('point_transactions', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'FK_user_id',
      references: {
        table: 'users',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key
    await queryInterface.removeConstraint('point_transactions', 'FK_user_id');
  },
};
