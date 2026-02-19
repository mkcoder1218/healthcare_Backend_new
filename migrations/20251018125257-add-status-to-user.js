'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Active', // or whatever default you want
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'status');
  },
};
