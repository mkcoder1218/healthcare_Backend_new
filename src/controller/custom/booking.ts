import { Request, Response } from "express";
import { BookingService } from "../../service/custom/booking";

export const BookingController = {
  async checkIn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const booking = await BookingService.checkIn(id);
      return res.json({
        message: "Check-in successful. Points have been awarded.",
        booking,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({ message: error.message });
    }
  },
};
