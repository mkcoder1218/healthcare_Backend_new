import { sequelize } from "../../model/db";
import { PointService } from "./point";


export const BookingService = {
  async checkIn(booking_id: string) {
    const Booking = sequelize.models.Booking;
    const booking = await Booking.findByPk(booking_id);

    if (!booking) throw new Error("Booking not found");
    if ((booking as any).is_checked_in) throw new Error("Booking already checked in");

    (booking as any).is_checked_in = true;
    await booking.save();

    // 🎁 reward user with points
    await PointService.giveCheckInPoints((booking as any).user_id);

    return booking;
  },
};
