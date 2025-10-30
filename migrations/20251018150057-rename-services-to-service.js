'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableList = await queryInterface.showAllTables();

      // 1️⃣ Remove duplicate "services" table if it exists
      if (tableList.includes('services')) {
        console.log('Dropping duplicate table "services"...');
        await queryInterface.dropTable('services', { transaction });
      }

      // 2️⃣ Rename "Services" to "service"
      if (tableList.includes('Services')) {
        console.log('Renaming "Services" to "service"...');
        await queryInterface.renameTable('Services', 'service', { transaction });
      }

      // 3️⃣ Fix users.role_id FK
      const userConstraints = await queryInterface.getForeignKeyReferencesForTable('users');
      const roleFk = userConstraints.find((c) => c.columnName === 'role_id');
      if (roleFk) {
        await queryInterface.removeConstraint('users', roleFk.constraintName, { transaction });
      }
      await queryInterface.addConstraint('users', {
        fields: ['role_id'],
        type: 'foreign key',
        name: 'users_role_id_fkey',
        references: { table: 'roles', field: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        transaction,
      });

      // 4️⃣ Fix bookings.service_id FK
      const bookingConstraints = await queryInterface.getForeignKeyReferencesForTable('bookings');
      const serviceFk = bookingConstraints.find((c) => c.columnName === 'service_id');
      if (serviceFk) {
        await queryInterface.removeConstraint('bookings', serviceFk.constraintName, { transaction });
      }
      await queryInterface.changeColumn('bookings', 'service_id', {
        type: Sequelize.UUID,
        allowNull: false,
      }, { transaction });
      await queryInterface.addConstraint('bookings', {
        fields: ['service_id'],
        type: 'foreign key',
        name: 'bookings_service_id_fkey',
        references: { table: 'service', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction,
      });

      // 5️⃣ Fix BookingServices.service_id FK
      const bsConstraints = await queryInterface.getForeignKeyReferencesForTable('BookingServices');
      const bsServiceFk = bsConstraints.find((c) => c.columnName === 'service_id');
      if (bsServiceFk) {
        await queryInterface.removeConstraint('BookingServices', bsServiceFk.constraintName, { transaction });
      }
      await queryInterface.addConstraint('BookingServices', {
        fields: ['service_id'],
        type: 'foreign key',
        name: 'bookingservices_service_id_fkey',
        references: { table: 'service', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction,
      });

      // 6️⃣ Fix Reviews.service_id FK
      const reviewConstraints = await queryInterface.getForeignKeyReferencesForTable('reviews');
      const reviewServiceFk = reviewConstraints.find((c) => c.columnName === 'service_id');
      if (reviewServiceFk) {
        await queryInterface.removeConstraint('reviews', reviewServiceFk.constraintName, { transaction });
      }
      await queryInterface.addConstraint('reviews', {
        fields: ['service_id'],
        type: 'foreign key',
        name: 'reviews_service_id_fkey',
        references: { table: 'service', field: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction,
      });

      await transaction.commit();
      console.log('✅ Migration applied successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Reverse table rename
      const tableList = await queryInterface.showAllTables();
      if (tableList.includes('service')) {
        await queryInterface.renameTable('service', 'Services', { transaction });
      }

      // Optionally reverse FKs (similar logic can be added)
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
