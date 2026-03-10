"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Deprecated by 20260310173000-fix-bookings-service-fk-by-data
    return;
  },

  async down(queryInterface, Sequelize) {
    // No-op: leaving FK in place
  },
};
