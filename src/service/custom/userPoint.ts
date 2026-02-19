import { Transaction } from "sequelize";
import { generateService } from "../service";


const userService = generateService("User");
const pointTransactionService = generateService("PointTransaction");

/**
 * Handles user point (coin) system operations.
 */
export const userPointService = {
  /**
   * Safely adjusts user points (can add or deduct).
   */
  adjustPoints: async (
    userId: string,
    amount: number,
    description?: string,
    transaction?: Transaction
  ) => {
    if (amount === 0) return;

    const user = await userService.getOne(userId, { transaction });
    const currentPoints = user.getDataValue("point") || 0;
    const newBalance = currentPoints + amount;

    if (newBalance < 0) {
      throw new Error("Insufficient points");
    }

    // Update user points
    await user.update({ point: newBalance }, { transaction });

    // Log the transaction
    await pointTransactionService.create(
      {
        user_id: userId,
        amount,
        type: amount > 0 ? "Reward" : "Redeem",
        description: description ?? "Point adjustment",
      } as any,
      { transaction }
    );

    return {
      userId,
      oldBalance: currentPoints,
      newBalance,
      amount,
    };
  },

  /**
   * Reward user for a completed booking.
   */
  rewardForBooking: async (
    userId: string,
    bookingPrice: number,
    transaction?: Transaction
  ) => {
    const reward = Math.floor(bookingPrice * 0.05); // 5% of booking price
    return await userPointService.adjustPoints(
      userId,
      reward,
      `Reward for booking (₦${bookingPrice})`,
      transaction
    );
  },

  /**
   * Redeem points (for discounts, etc.)
   */
  redeemPoints: async (
    userId: string,
    pointsToUse: number,
    transaction?: Transaction
  ) => {
    return await userPointService.adjustPoints(
      userId,
      -pointsToUse,
      "Redeemed points",
      transaction
    );
  },

  /**
   * Get all transactions for a user.
   */
  getTransactionHistory: async (userId: string) => {
    return await pointTransactionService.getAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });
  },
};
