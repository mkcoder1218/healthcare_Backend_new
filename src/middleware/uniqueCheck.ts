import { Request, Response, NextFunction } from "express";
import { generateService } from "../service/service";
import { Op } from "sequelize";

export const uniqueCheck = (modelName: string, field: string, idField?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure body exists and field is provided
      if (!req.body || typeof req.body !== "object") return next();

      const value = req.body[field];
      if (value === undefined || value === null) return next(); // skip if field not provided

      const service = generateService(modelName);
      const where: any = { [field]: value };

      // If updating, ignore self
      if (idField && req.body[idField]) {
        where[idField] = { [Op.ne]: req.body[idField] };
      }

      const existing = await service.getAll({ where });
      if (existing && existing.length > 0) {
        return res.status(400).json({ message: `${field} must be unique` });
      }

      next();
    } catch (err: any) {
      next(err);
    }
  };
};
