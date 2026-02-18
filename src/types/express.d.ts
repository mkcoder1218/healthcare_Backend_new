import { UserInstance } from "../models/db"; // adjust path as needed

declare global {
  namespace Express {
    interface Request {
      user?: UserInstance & { role?: { name: string }; role_id?: string };
    }
  }
}
