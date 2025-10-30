import { Request, Response } from "express";
import { generateService } from "../service/service";
import jwt from "jsonwebtoken";
import { buildSequelizeOptions } from "../middleware/parser";
import { asyncHandler } from "../utils/asyncHandler";
import { model as models } from "../model/model";

// Simple validation passthrough
const validateInput = (modelName: string, data: any) => data;

// Map string to generated service
const getService = (modelName: string) => generateService(modelName);

export const generateController = (modelName: string) => {
  const service = getService(modelName);
  const userService = getService("User");

  const sendResponse = (
    res: Response,
    statusCode: number,
    status: "success" | "error",
    message: string,
    data: any = null,
    meta: any = {}
  ) => {
    res.status(statusCode).json({
      status,
      message,
      count: Array.isArray(data) ? data.length : data ? 1 : 0,
      data,
      meta,
      timestamp: new Date().toISOString(),
    });
  };

  return {
   getAll: asyncHandler(async (req: Request, res: Response) => {
  const options = buildSequelizeOptions(req.query.q as string);

  if (options.include && Array.isArray(options.include)) {
    options.include = options.include.map((inc: any) => {
      if (typeof inc.model === "string" && models[inc.model]) {
        return { ...inc, model: inc.model };
      }
      return inc;
    });
  }

  // Sequelize: findAndCountAll returns rows + total
  const { rows: items, count: total } = await service.getAllWithCount(options);

  sendResponse(res, 200, "success", `${modelName} list fetched`, items, {
    limit: options.limit,
    offset: options.offset,
    total, // send total so frontend knows how many pages exist
  });
}),


    getOne: asyncHandler(async (req: Request, res: Response) => {
      const include = req.query.include ? JSON.parse(req.query.include as string) : [];
      const parsedInclude = include.map((inc: any) => {
        if (typeof inc.model === "string" && models[inc.model]) {
          return { ...inc, model: inc.model }; // keep as string
        }
        return inc;
      });

      const item = await service.getOne(req.params.id, { include: parsedInclude });
      sendResponse(res, 200, "success", `${modelName} fetched successfully`, item);
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
      const validatedData = validateInput(modelName, req.body);
      const item = await service.create(validatedData);
      sendResponse(res, 201, "success", `${modelName} created successfully`, item);
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
      const validatedData = validateInput(modelName, req.body);
      const updated = await service.update(req.params.id, validatedData);
      sendResponse(res, 200, "success", `${modelName} updated successfully`, updated);
    }),

    delete: asyncHandler(async (req: Request, res: Response) => {
      await service.delete(req.params.id);
      sendResponse(res, 200, "success", `${modelName} deleted successfully`);
    }),

    getMe: asyncHandler(async (req: Request, res: Response) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await userService.getMe(decoded.id);
      res.json(user);
    }),
  };
};
