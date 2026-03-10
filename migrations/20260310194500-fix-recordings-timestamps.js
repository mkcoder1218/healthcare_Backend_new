"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = "recordings";
    // Rename camelCase timestamps to underscored if they exist
    const describe = await queryInterface.describeTable(table);

    if (describe.createdAt && !describe.created_at) {
      await queryInterface.renameColumn(table, "createdAt", "created_at");
    }
    if (describe.updatedAt && !describe.updated_at) {
      await queryInterface.renameColumn(table, "updatedAt", "updated_at");
    }
    if (describe.deletedAt && !describe.deleted_at) {
      await queryInterface.renameColumn(table, "deletedAt", "deleted_at");
    }
  },

  async down(queryInterface) {
    const table = "recordings";
    const describe = await queryInterface.describeTable(table);

    if (describe.created_at && !describe.createdAt) {
      await queryInterface.renameColumn(table, "created_at", "createdAt");
    }
    if (describe.updated_at && !describe.updatedAt) {
      await queryInterface.renameColumn(table, "updated_at", "updatedAt");
    }
    if (describe.deleted_at && !describe.deletedAt) {
      await queryInterface.renameColumn(table, "deleted_at", "deletedAt");
    }
  },
};
