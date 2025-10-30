// rolesController.ts
import { Request, Response } from "express";
import { createdModels } from "../../model/db";
// your dynamic Sequelize models

const Role = createdModels.Role;
const AccessRule = createdModels.AccessRule;

export const getRolesWithRulesController = async (req: Request, res: Response) => {
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: AccessRule,
          through: { attributes: [] }, // skip pivot table attributes
        },
      ],
    });

    const result = roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      rules: role.AccessRules.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
      })),
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
