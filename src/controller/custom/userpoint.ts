import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { generateService } from "../../service/service";
import { userPointService } from "../../service/custom/userPoint";

const userService = generateService("User");

export const userPointController = {
  /**
   * Add or deduct points manually (admin or system use)
   */
  adjustPoints: asyncHandler(async (req: Request, res: Response) => {
    const { userId, amount, description } = req.body;

    if (!userId || typeof amount !== "number") {
      return res.status(400).json({ message: "userId and amount are required" });
    }

    const result = await userPointService.adjustPoints(userId, amount, description);
    res.status(200).json({
      status: "success",
      message: `User points updated successfully`,
      data: result,
    });
  }),

  /**
   * Reward user after booking completion
   */
  rewardForBooking: asyncHandler(async (req: Request, res: Response) => {
    const { userId, bookingPrice } = req.body;

    if (!userId || typeof bookingPrice !== "number") {
      return res.status(400).json({ message: "userId and bookingPrice are required" });
    }

    const result = await userPointService.rewardForBooking(userId, bookingPrice);
    res.status(200).json({
      status: "success",
      message: "Reward points granted successfully",
      data: result,
    });
  }),

  /**
   * Redeem user points
   */
  redeemPoints: asyncHandler(async (req: Request, res: Response) => {
    const { userId, pointsToUse } = req.body;

    if (!userId || typeof pointsToUse !== "number") {
      return res.status(400).json({ message: "userId and pointsToUse are required" });
    }

    const result = await userPointService.redeemPoints(userId, pointsToUse);
    res.status(200).json({
      status: "success",
      message: "Points redeemed successfully",
      data: result,
    });
  }),

  /**
   * Get user's current balance and transaction history
   */
  getUserPoints: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId;

    const user = await userService.getOne(userId);
    const transactions = await userPointService.getTransactionHistory(userId);

    res.status(200).json({
      status: "success",
      data: {
        balance: user.getDataValue("point") || 0,
        transactions,
      },
    });
  }),
};
