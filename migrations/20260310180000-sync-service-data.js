"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const hasService = tables.includes("service");
    const hasServices = tables.includes("services");
    if (!hasService || !hasServices) return;

    await queryInterface.sequelize.query(`
      INSERT INTO services (id, name, description, price, duration, category_id, file_id, type_id, created_at, updated_at, deleted_at)
      SELECT s.id, s.name, s.description, s.price, s.duration, s.category_id, s.file_id, s.type_id, s.created_at, s.updated_at, s.deleted_at
      FROM service s
      LEFT JOIN services t ON t.id = s.id
      WHERE t.id IS NULL;
    `);
  },

  async down() {
    // no-op
  },
};
