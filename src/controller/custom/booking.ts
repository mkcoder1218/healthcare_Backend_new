import { Request, Response } from "express";
import { BookingService } from "../../service/custom/booking";

export const BookingController = {
  async checkIn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const booking = await BookingService.checkIn(id as string);
      return res.json({
        message: "Check-in successful. Points have been awarded.",
        booking,
      });
    } catch (error: any) {
      console.error(error);
    }
  },

  async getMyBookings(req: any, res: Response) {
    try {
      const user_id = req.user.id;
      const bookings = await BookingService.getMyBookings(user_id);
      return res.json({
        success: true,
        bookings,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },
};
