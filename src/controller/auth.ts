import { Request, Response } from "express";
import { authService } from "../service/auth";

export const authController = {
     async getProfile(req: Request, res: Response) {
    try {
      const user = await authService.getUserFromToken(req as any);
      res.json({ user });
    } catch (err: any) {
      res.status(401).json({ message: err.message });
    }
  },
  async register(req: Request, res: Response) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const data = await authService.login(req.body);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
};
