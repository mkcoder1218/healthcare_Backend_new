"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("bookings", "professional_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("bookings", "professional_id", {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },
};
