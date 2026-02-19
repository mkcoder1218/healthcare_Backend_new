// src/utils/create_rules.ts
import { Sequelize, Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { createdModels } from "../model/db"; // Your initialized Sequelize models

const CRUD_ACTIONS = ["read"];

const main = async () => {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error(
        "Usage: npx ts-node src/utils/create_rules.ts <ModelName> <RoleID1> [RoleID2 ...]"
      );
      process.exit(1);
    }

    const modelName = args[0];
    const roleIds = args.slice(1);

    const AccessRule = createdModels["AccessRule"];
    const Role = createdModels["Role"];
    const RoleAccessRule = createdModels["RoleAccessRule"];

    if (!AccessRule || !Role || !RoleAccessRule) {
      throw new Error("Models AccessRule, Role or RoleAccessRule not found");
    }

    // Validate roles exist
    const roles = await Role.findAll({
      where: { id: { [Op.in]: roleIds } },
    });
    if (roles.length !== roleIds.length) {
      throw new Error("Some role IDs do not exist in DB");
    }

    // Prepare rules data
    const rulesData = CRUD_ACTIONS.map((action) => ({
      id: uuidv4(),
      name: `${action}_${modelName.toLowerCase()}`,
      description: `${action.toUpperCase()} permission for ${modelName}`,
    }));

    // Insert rules (ignore duplicates)
    await AccessRule.bulkCreate(rulesData as any, { ignoreDuplicates: true });

    // Fetch all rules to get actual IDs (new + existing)
    const allRules = await AccessRule.findAll({
      where: { name: rulesData.map((r) => r.name) },
    });

    // Prepare pivot table data
    const roleAccessRulesData = [];
    for (const rule of allRules) {
      for (const roleId of roleIds) {
        roleAccessRulesData.push({
          id: uuidv4(),
          role_id: roleId,
          access_rule_id: (rule as any).id,
        });
      }
    }

    // Insert into pivot table (ignore duplicates)
    await RoleAccessRule.bulkCreate(roleAccessRulesData, { ignoreDuplicates: true });

    console.log(
      `✅ Rules for model "${modelName}" linked to roles [${roleIds.join(", ")}] successfully.`
    );
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Error creating rules:", err.message);
    process.exit(1);
  }
};

main();
