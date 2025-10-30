// src/parser/index.ts (or parser.ts)
import { createdModels } from "../model/db";
import { Op } from "sequelize";
import { decodeQuery } from "../utils/queryBuilder";

export const buildSequelizeOptions = (q?: string) => {
  const { filters, search, limit = 100, offset = 0, order, include } = decodeQuery(q || "");

  const where: Record<string, any> = { ...filters };

  // map include strings to Sequelize models
  const mappedInclude = (include || []).map((inc: any) => {
    const model = typeof inc.model === "string" ? createdModels[inc.model] : inc.model;

    const includeWhere: Record<string, any> = {};
    if (search) {
      for (const key in search) {
        const [prefix, field] = key.split(".");
        if (prefix === model.name && field) {
          includeWhere[field] = { [Op.like]: `%${search[key]}%` };
        }
      }
    }

    return {
      ...inc,
      model,
      where: Object.keys(includeWhere).length ? includeWhere : undefined,
      required: Object.keys(includeWhere).length > 0,
    };
  });

  return {
    where,
    limit,
    offset,
    order: order ?? [["createdAt", "DESC"]],
    include: mappedInclude,
  };
};
