import { generateService } from "../service";

const pointService = generateService("Points"); // Table that stores points to give
const pointTransactionService = generateService("PointTransaction");
const userService = generateService("User");

export const PointService = {
  /**
   * Give check-in points to a user
   */
  async giveCheckInPoints(user_id: string) {
    // 1️⃣ Get the user
    const user = await userService.getOne(user_id);
    if (!user) throw new Error("User not found");

    // 2️⃣ Get the points to give from Points table
    // Fetch the first Points record
    const pointsList = await pointService.getAll({ limit: 1, order: [["createdAt", "ASC"]] });
    const pointsConfig = pointsList[0];
    if (!pointsConfig) throw new Error("No points configuration found");

    const pointsToGive = (pointsConfig as any).point; // e.g., 3

    // 3️⃣ Add points to the user's total
    const currentPoints = user.getDataValue("point") || 0;
    const newTotal = currentPoints + pointsToGive;

    await user.update({ point: newTotal });

    // 4️⃣ Create a PointTransaction for history/logging
    const transaction = await pointTransactionService.create({
      user_id,
      amount: pointsToGive,
      type: "Reward",
      description: "Points awarded for check-in",
    } as any);

    return {
      user_id,
      addedPoints: pointsToGive,
      newTotal,
      transaction,
    };
  },
};
