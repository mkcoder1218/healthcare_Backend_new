import { Op } from "sequelize";
import sequelize from "../../model/db";
import { PointService } from "./point";

export const BookingService = {
  async checkIn(booking_id: string) {
    const Booking = sequelize.models.Booking;
    const booking = await Booking.findByPk(booking_id);

    if (!booking) throw new Error("Booking not found");
    if ((booking as any).is_checked_in)
      throw new Error("Booking already checked in");

    (booking as any).is_checked_in = true;
    await booking.save();

    // 🎁 reward user with points
    await PointService.giveCheckInPoints((booking as any).user_id);

    return booking;
  },

  async getMyBookings(user_id: string, options: any = {}) {
    const Booking = sequelize.models.Booking;
    const Service = sequelize.models.Service;
    const ProfessionalProfile = sequelize.models.ProfessionalProfile;
    const ClientProfile = sequelize.models.ClientProfile;
    const User = sequelize.models.User;

    // 1️⃣ Find the client profile associated with this user
    const clientProfile = await ClientProfile.findOne({ where: { user_id } });
    const client_id = clientProfile ? (clientProfile as any).id : null;

    // 2️⃣ Build the OR condition
    const whereConditions: any[] = [{ user_id: user_id }];
    if (client_id) {
      whereConditions.push({ client_id: client_id });
    }

    // 3️⃣ Fetch bookings with count for pagination support
    const { rows, count } = await Booking.findAndCountAll({
      where: {
        [Op.or]: whereConditions,
      },
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
      include: [
        {
          model: Service,
          as: "service",
        },
        {
          model: ClientProfile,
          as: "client",
        },
        {
          model: ProfessionalProfile,
          as: "professional",
          include: [
            {
              model: User,
              attributes: ["name", "phone_number"],
              as: "user",
            },
          ],
        },
      ],
      order: options.order ?? [["createdAt", "DESC"]],
    });

    return { rows, count };
  },
};
