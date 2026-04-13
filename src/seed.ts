import "dotenv/config";
import bcrypt from "bcryptjs";
import { model as modelDefs } from "./model/model";

type AnyModel = { findOrCreate: Function; findOne: Function; create: Function };

async function findOrCreateByName(
  Model: AnyModel,
  name: string,
  extra: any,
  transaction: any,
) {
  const [row] = await Model.findOrCreate({
    where: { name },
    defaults: { name, ...extra },
    transaction,
  });
  return row;
}

export type SeedOptions = {
  sync?: boolean;
  closeConnection?: boolean;
};

export async function seedDatabase(options: SeedOptions = {}) {
  const { sync = false, closeConnection = false } = options;

  const { default: sequelize, createdModels } = await import("./model/db");

  await sequelize.authenticate();
  if (sync) {
    await sequelize.sync({ alter: true });
  }

  const Role = createdModels.Role;
  const User = createdModels.User;
  const ClientTypes = createdModels.ClientTypes;
  const ClientLevel = createdModels.ClientLevel;
  const ServiceCategory = createdModels.ServiceCategory;
  const ServiceType = createdModels.ServiceType;
  const File = createdModels.File;
  const Service = createdModels.Service;
  const ClientProfile = createdModels.ClientProfile;
  const ProfessionalProfile = createdModels.ProfessionalProfile;
  const PaymentMethod = createdModels.PaymentMethod;
  const Booking = createdModels.Booking;
  const Points = createdModels.Points;
  const AccessRule = createdModels.AccessRule;
  const RoleAccessRule = createdModels.RoleAccessRule;

  if (
    !Role ||
    !User ||
    !ClientTypes ||
    !ClientLevel ||
    !ServiceCategory ||
    !ServiceType ||
    !File ||
    !Service ||
    !ClientProfile ||
    !ProfessionalProfile ||
    !PaymentMethod ||
    !Booking ||
    !Points ||
    !AccessRule ||
    !RoleAccessRule
  ) {
    throw new Error("One or more models are missing; check src/model/model.ts");
  }

  await sequelize.transaction(async (transaction) => {
    // Roles
    const adminRole = await findOrCreateByName(
      Role as any,
      "Admin",
      { description: "System administrator" },
      transaction,
    );
    const userRole = await findOrCreateByName(
      Role as any,
      "User",
      { description: "Client user" },
      transaction,
    );
    const professionalRole = await findOrCreateByName(
      Role as any,
      "Professional",
      { description: "Healthcare professional" },
      transaction,
    );

    // Access rules (create_* / read_* / update_* / delete_* for each model)
    const actions = ["create", "read", "update", "delete"] as const;
    const allRuleNames: string[] = [];
    for (const modelName of Object.keys(modelDefs)) {
      for (const action of actions) {
        allRuleNames.push(`${action}_${modelName.toLowerCase()}`);
      }
    }

    await (AccessRule as any).bulkCreate(
      allRuleNames.map((name) => ({
        name,
        description: `${name} permission`,
      })),
      { transaction, ignoreDuplicates: true },
    );

    const rules = await (AccessRule as any).findAll({
      where: { name: allRuleNames },
      transaction,
    });

    const roleIds = [
      (adminRole as any).id,
      (userRole as any).id,
      (professionalRole as any).id,
    ];

    await (RoleAccessRule as any).bulkCreate(
      rules.flatMap((r: any) =>
        roleIds.map((roleId) => ({
          role_id: roleId,
          access_rule_id: r.id,
        })),
      ),
      { transaction, ignoreDuplicates: true },
    );

    // Lookups (types/levels/categories)
    const clientTypeIndividual = await findOrCreateByName(
      ClientTypes as any,
      "Individual",
      { description: "Individual client" },
      transaction,
    );
    await findOrCreateByName(
      ClientTypes as any,
      "Couple",
      { description: "Couple client" },
      transaction,
    );

    const clientLevelStandard = await findOrCreateByName(
      ClientLevel as any,
      "Standard",
      { description: "Standard support level" },
      transaction,
    );
    await findOrCreateByName(
      ClientLevel as any,
      "Premium",
      { description: "Priority support level" },
      transaction,
    );

    const catCounseling = await findOrCreateByName(
      ServiceCategory as any,
      "Counseling",
      { description: "Counseling and therapy services" },
      transaction,
    );
    const catWellness = await findOrCreateByName(
      ServiceCategory as any,
      "Wellness",
      { description: "Wellness and lifestyle services" },
      transaction,
    );

    const typeOnline = await findOrCreateByName(
      ServiceType as any,
      "Online",
      { description: "Remote (online) service" },
      transaction,
    );
    const typeInPerson = await findOrCreateByName(
      ServiceType as any,
      "In-Person",
      { description: "Physical (in-person) service" },
      transaction,
    );

    // Payment methods
    await findOrCreateByName(
      PaymentMethod as any,
      "M-Pesa",
      {
        description: "Mobile money",
        icon_url: "https://example.com/icons/mpesa.png",
        is_active: true,
      },
      transaction,
    );
    await findOrCreateByName(
      PaymentMethod as any,
      "Card",
      {
        description: "Debit/Credit card",
        icon_url: "https://example.com/icons/card.png",
        is_active: true,
      },
      transaction,
    );

    // Points reference
    await (Points as any).findOrCreate({
      where: { description: "Signup bonus" },
      defaults: { point: 50, description: "Signup bonus" },
      transaction,
    });

    // Users
    const adminUser =
      (await (User as any).findOne({ where: { name: "Admin" }, transaction })) ??
      (await (User as any).create(
        {
          name: "Admin",
          phone_number: "+254700000001",
          password: await bcrypt.hash("Admin@123", 10),
          role_id: (adminRole as any).id,
          status: "Active",
          point: 0,
        },
        { transaction },
      ));

    const clientUser =
      (await (User as any).findOne({ where: { name: "Test Client" }, transaction })) ??
      (await (User as any).create(
        {
          name: "Test Client",
          phone_number: "+254700000002",
          password: await bcrypt.hash("Client@123", 10),
          role_id: (userRole as any).id,
          status: "Active",
          point: 10,
        },
        { transaction },
      ));

    const professionalUser =
      (await (User as any).findOne({
        where: { name: "Test Professional" },
        transaction,
      })) ??
      (await (User as any).create(
        {
          name: "Test Professional",
          phone_number: "+254700000003",
          password: await bcrypt.hash("Pro@12345", 10),
          role_id: (professionalRole as any).id,
          status: "Active",
          point: 0,
        },
        { transaction },
      ));

    // Files (profile/service images)
    const profileFile =
      (await (File as any).findOne({
        where: { description: "Seed profile image" },
        transaction,
      })) ??
      (await (File as any).create(
        {
          url: "https://example.com/images/profile.png",
          description: "Seed profile image",
          type: "ProfilePic",
        },
        { transaction },
      ));

    if (!(adminUser as any).profile_image_id) {
      await (adminUser as any).update(
        { profile_image_id: (profileFile as any).id },
        { transaction },
      );
    }
    if (!(clientUser as any).profile_image_id) {
      await (clientUser as any).update(
        { profile_image_id: (profileFile as any).id },
        { transaction },
      );
    }
    if (!(professionalUser as any).profile_image_id) {
      await (professionalUser as any).update(
        { profile_image_id: (profileFile as any).id },
        { transaction },
      );
    }

    // Profiles
    const clientProfile =
      (await (ClientProfile as any).findOne({
        where: { user_id: (clientUser as any).id },
        transaction,
      })) ??
      (await (ClientProfile as any).create(
        {
          user_id: (clientUser as any).id,
          age: 28,
          sex: "Female",
          marital_status: "Single",
          residency: "Nairobi",
          academic_level: "University",
          work_status: "Employed",
          financial_problem: false,
          substance_use: ["None"],
          problem_description: "Feeling stressed and anxious.",
          client_type_id: (clientTypeIndividual as any).id,
          client_level_id: (clientLevelStandard as any).id,
        },
        { transaction },
      ));

    const professionalProfile =
      (await (ProfessionalProfile as any).findOne({
        where: { user_id: (professionalUser as any).id },
        transaction,
      })) ??
      (await (ProfessionalProfile as any).create(
        {
          user_id: (professionalUser as any).id,
          profession: "Therapist",
          bio: "Licensed therapist (seed account).",
          verification_status: "Verified",
        },
        { transaction },
      ));

    // Service + image file
    const serviceFile =
      (await (File as any).findOne({
        where: { description: "Seed service image" },
        transaction,
      })) ??
      (await (File as any).create(
        {
          url: "https://example.com/images/service.png",
          description: "Seed service image",
          type: "ServiceImage",
        },
        { transaction },
      ));

    const serviceName = "Initial Consultation (Online)";
    const seedService =
      (await (Service as any).findOne({ where: { name: serviceName }, transaction })) ??
      (await (Service as any).create(
        {
          name: serviceName,
          description: "30-minute online consultation session.",
          price: "1500",
          duration: "30",
          category_id: (catCounseling as any).id,
          type_id: (typeOnline as any).id,
          file_id: (serviceFile as any).id,
        },
        { transaction },
      ));

    // Another service for variety
    const serviceName2 = "Wellness Check-in (In-Person)";
    await (Service as any).findOrCreate({
      where: { name: serviceName2 },
      defaults: {
        name: serviceName2,
        description: "45-minute wellness check-in at the clinic.",
        price: "2500",
        duration: "45",
        category_id: (catWellness as any).id,
        type_id: (typeInPerson as any).id,
        file_id: (serviceFile as any).id,
      },
      transaction,
    });

    // Booking
    const existingBooking = await (Booking as any).findOne({
      where: {
        client_id: (clientProfile as any).id,
        service_id: (seedService as any).id,
      },
      transaction,
    });

    if (!existingBooking) {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const date = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD

      await (Booking as any).create(
        {
          client_id: (clientProfile as any).id,
          user_id: (adminUser as any).id,
          professional_id: (professionalProfile as any).id,
          service_id: (seedService as any).id,
          date,
          time: "10:00",
          status: "Confirmed",
          notes: "Seed booking",
          payment_status: "Paid",
          is_checked_in: false,
        },
        { transaction },
      );
    }
  });

  if (closeConnection) {
    await sequelize.close();
  }
}

if (require.main === module) {
  if (String(process.env.SEED_USE_LOCAL_DB || "").toLowerCase() === "true") {
    process.env.FORCE_LOCAL_DB = "true";
    process.env.NODE_ENV = "development";
  }

  seedDatabase({ sync: true, closeConnection: true })
    .then(() => {
      console.log("Seed complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
