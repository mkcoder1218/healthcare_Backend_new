import { Request, Response, NextFunction, RequestHandler } from "express";

// Wrap async middleware/controller to catch errors
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
