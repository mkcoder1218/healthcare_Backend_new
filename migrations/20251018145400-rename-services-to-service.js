'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('service') && !tables.includes('services')) {
      await queryInterface.renameTable('service', 'services');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('services') && !tables.includes('service')) {
      await queryInterface.renameTable('services', 'service');
    }
  },
};
