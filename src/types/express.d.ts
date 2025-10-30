import "express";
import { UserInstance } from "../models/db"; // adjust import path

declare module "express-serve-static-core" {
  interface Request {
    user?: UserInstance & { role_id?: string };
  }
}
