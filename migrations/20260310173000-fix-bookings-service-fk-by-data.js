"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("bookings")) return;

    const hasServices = tables.includes("services");
    const hasService = tables.includes("service");
    if (!hasServices && !hasService) return;

    const [[sample]] = await queryInterface.sequelize.query(
      `SELECT service_id FROM bookings WHERE service_id IS NOT NULL LIMIT 1;`,
    );
    const sampleId = sample?.service_id;
    if (!sampleId) return;

    let targetTable = null;
    if (hasServices) {
      const [[row]] = await queryInterface.sequelize.query(
        `SELECT id FROM services WHERE id = :id LIMIT 1;`,
        { replacements: { id: sampleId } },
      );
      if (row?.id) targetTable = "services";
    }

    if (!targetTable && hasService) {
      const [[row]] = await queryInterface.sequelize.query(
        `SELECT id FROM service WHERE id = :id LIMIT 1;`,
        { replacements: { id: sampleId } },
      );
      if (row?.id) targetTable = "service";
    }

    if (!targetTable) return;

    const bookingConstraints =
      await queryInterface.getForeignKeyReferencesForTable("bookings");
    const serviceFk = bookingConstraints.find(
      (c) => c.columnName === "service_id",
    );
    if (serviceFk) {
      await queryInterface.removeConstraint("bookings", serviceFk.constraintName);
    }

    await queryInterface.addConstraint("bookings", {
      fields: ["service_id"],
      type: "foreign key",
      name: "bookings_service_id_fkey",
      references: { table: targetTable, field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  async down() {
    // no-op
  },
};
