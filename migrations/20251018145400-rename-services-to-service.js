'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename the table
    await queryInterface.renameTable('service', 'services');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert table name
    await queryInterface.renameTable('service', 'services');
  },
};
