import express, { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createdModels } from "../model/db";
import { UserInstance } from "../model/types";

// Extend Express Request type
declare module "express-serve-static-core" {
  interface Request {
    user?: UserInstance & { role?: { name: string } };
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role_id: string;
}

/**
 * Middleware: Authenticate JWT token and attach user to request
 */
export const authenticateToken = (secret: string) => {
  if (!secret) {
    throw new Error("JWT secret must be provided");
  }

  return async (req: express.Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ status: "error", message: "No token provided" });
      }

      const payload = jwt.verify(token, secret) as JwtPayload;

      const UserModel = createdModels["User"];
      const user = (await UserModel.findByPk(payload.id)) as unknown as UserInstance;

      if (!user) {
        return res.status(401).json({ status: "error", message: "User not found" });
      }

      (req as any).user = user;
      next();
    } catch (err: any) {
      console.error("JWT verify failed:", err);
      res.status(401).json({ status: "error", message: "Invalid token" });
    }
  };
};

/**
 * Middleware: Check if user has one of the allowed roles
 */
export const authorizeRoles = (roles: string[]) => {
  return (req: express.Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role?.name || "")) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    next();
  };
};

/**
 * Middleware: Check if user has access to a specific model/action
 */
export const checkAccess =
  (modelName: string, action: "create" | "read" | "update" | "delete") =>
  async (req: express.Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const UserModel = createdModels["User"];
      const RoleModel = createdModels["Role"];

      const user = (await UserModel.findByPk(userId, {
        include: [{ model: RoleModel, as: "role" }],
      })) as unknown as UserInstance & { role?: { name: string } };

      if (!user || !user.role_id) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      // Super Admin bypass (hard-coded id)
      if (user.role_id === "3b05a837-fe13-4e70-ae2b-e0a7becebcb0") {
        req.user = user;
        return next();
      }

      const AccessRule = createdModels["AccessRule"];
      const RoleAccessRule = createdModels["RoleAccessRule"];

      if (!AccessRule || !RoleAccessRule) {
        throw new Error("AccessRule or RoleAccessRule model not found");
      }

      const ruleName = `${action}_${modelName.toLowerCase()}`;

      const roleHasRule = await RoleAccessRule.findOne({
        where: { role_id: user.role_id },
        include: [
          {
            model: AccessRule,
            as: "AccessRule",
            where: { name: ruleName },
          },
        ],
      });

      if (!roleHasRule) {
        return res
          .status(403)
          .json({ status: "error", message: `Forbidden: no permission to ${action} ${modelName}` });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("Access middleware error:", err);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  };
