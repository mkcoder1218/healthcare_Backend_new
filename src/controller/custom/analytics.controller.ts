import { Request, Response } from "express";
import { Op } from "sequelize";
import { createdModels } from "../../model/db";

const Booking = createdModels["Booking"];
const Service = createdModels["Service"];
const ClientProfile = createdModels["ClientProfile"];
const ProfessionalProfile = createdModels["ProfessionalProfile"];
const User = createdModels["User"];
const Role = createdModels["Role"];

const parsePrice = (value: any) => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(num) ? num : 0;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatMonth = (d: Date) =>
  d.toLocaleString("en-US", { month: "short" });

export const analyticsController = {
  async dashboardSummary(req: Request, res: Response) {
    try {
      const [totalPatients, totalBookings, newProfessionals] = await Promise.all([
        ClientProfile.count(),
        Booking.count(),
        ProfessionalProfile.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const bookingsForRevenue = await Booking.findAll({
        where: { payment_status: "Paid" },
        include: [{ model: Service, as: "service" }],
      });

      const revenue = bookingsForRevenue.reduce((sum: number, b: any) => {
        const price = parsePrice(b?.service?.price);
        return sum + price;
      }, 0);

      res.json({
        totalPatients,
        totalBookings,
        revenue,
        newProfessionals,
      });
    } catch (err) {
      console.error("dashboardSummary failed", err);
      res.status(500).json({ message: "Failed to load dashboard summary" });
    }
  },

  async bookingsActivity(req: Request, res: Response) {
    try {
      const days = 7;
      const today = startOfDay(new Date());
      const from = new Date(today);
      from.setDate(today.getDate() - (days - 1));

      const bookings = await Booking.findAll({
        where: {
          createdAt: { [Op.gte]: from },
        },
      });

      const buckets = Array.from({ length: days }).map((_, i) => {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        return {
          key,
          name: d.toLocaleString("en-US", { weekday: "short" }),
          bookings: 0,
        };
      });

      const indexByKey = new Map(buckets.map((b) => [b.key, b]));
      bookings.forEach((b: any) => {
        const key = new Date(b.createdAt).toISOString().slice(0, 10);
        const bucket = indexByKey.get(key);
        if (bucket) bucket.bookings += 1;
      });

      res.json(buckets.map(({ key, ...rest }) => rest));
    } catch (err) {
      console.error("bookingsActivity failed", err);
      res.status(500).json({ message: "Failed to load booking activity" });
    }
  },

  async recentBookings(req: Request, res: Response) {
    try {
      const recent = await Booking.findAll({
        limit: 5,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: ClientProfile,
            as: "client",
            include: [{ model: User, as: "user" }],
          },
          {
            model: Service,
            as: "service",
          },
        ],
      });

      const data = recent.map((b: any) => ({
        id: b.id,
        patientName: b?.client?.user?.name || "Unknown",
        serviceName: b?.service?.name || "Service",
        time: b?.time || "-",
        status: b?.status || "Pending",
      }));

      res.json(data);
    } catch (err) {
      console.error("recentBookings failed", err);
      res.status(500).json({ message: "Failed to load recent bookings" });
    }
  },

  async patientDemographics(req: Request, res: Response) {
    try {
      const profiles = await ClientProfile.findAll({
        attributes: ["age", "sex"],
      });

      const ageBuckets = [
        { name: "18-25", value: 0 },
        { name: "26-40", value: 0 },
        { name: "41-60", value: 0 },
        { name: "60+", value: 0 },
      ];

      const sexBuckets: Record<string, number> = { Male: 0, Female: 0, Other: 0 };

      profiles.forEach((p: any) => {
        const age = Number(p.age);
        if (Number.isFinite(age)) {
          if (age >= 18 && age <= 25) ageBuckets[0].value += 1;
          else if (age >= 26 && age <= 40) ageBuckets[1].value += 1;
          else if (age >= 41 && age <= 60) ageBuckets[2].value += 1;
          else if (age > 60) ageBuckets[3].value += 1;
        }

        const sex = p.sex;
        if (sex && sexBuckets[sex] !== undefined) sexBuckets[sex] += 1;
      });

      const sexData = Object.entries(sexBuckets).map(([name, value]) => ({
        name,
        value,
      }));

      res.json({ age: ageBuckets, sex: sexData });
    } catch (err) {
      console.error("patientDemographics failed", err);
      res.status(500).json({ message: "Failed to load demographics" });
    }
  },

  async revenueHistory(req: Request, res: Response) {
    try {
      const months = 6;
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

      const bookings = await Booking.findAll({
        where: {
          payment_status: "Paid",
          createdAt: { [Op.gte]: start },
        },
        include: [{ model: Service, as: "service" }],
      });

      const bucketMap = new Map<string, { month: string; revenue: number }>();
      for (let i = 0; i < months; i += 1) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        bucketMap.set(key, { month: formatMonth(d), revenue: 0 });
      }

      bookings.forEach((b: any) => {
        const d = new Date(b.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const bucket = bucketMap.get(key);
        if (bucket) {
          bucket.revenue += parsePrice(b?.service?.price);
        }
      });

      res.json(Array.from(bucketMap.values()));
    } catch (err) {
      console.error("revenueHistory failed", err);
      res.status(500).json({ message: "Failed to load revenue history" });
    }
  },
};
