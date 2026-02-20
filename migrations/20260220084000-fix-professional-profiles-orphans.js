"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Clean up orphaned professional profiles
    await queryInterface.sequelize.query(`
      DELETE FROM "professional_profiles" 
      WHERE "user_id" NOT IN (SELECT "id" FROM "users");
    `);

    // 2. Ensure the foreign key constraint exists and is enforced
    // This SQL helps if alter:true is failing to add the constraint
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE "professional_profiles" 
        DROP CONSTRAINT IF EXISTS "professional_profiles_user_id_fkey",
        ADD CONSTRAINT "professional_profiles_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (err) {
      console.log(
        "Constraint might already exist or table structure differs, skipping manual constraint add.",
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Usually we don't restore deleted orphaned data
  },
};
