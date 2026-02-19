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
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const { rows: bookings, count: total } =
        await BookingService.getMyBookings(user_id, {
          limit,
          offset,
        });

      return res.json({
        status: "success",
        message: "Bookings fetched successfully",
        count: bookings.length,
        data: bookings,
        meta: {
          limit,
          offset,
          total,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },
};
