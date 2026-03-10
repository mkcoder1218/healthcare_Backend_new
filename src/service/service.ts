// service.ts
import { createdModels } from "../model/db";
import { Model, Transaction, FindOptions, Op, ModelStatic } from "sequelize";
import bcrypt from "bcryptjs";

interface ServiceOptions {
  transaction?: Transaction;
  paranoid?: boolean;
}

interface GetAllOptions extends ServiceOptions {
  limit?: number;
  offset?: number;
  where?: Record<string, any>;
  order?: any[];
  include?: any[];
}

export const generateService = <T extends Model>(modelName: string) => {
  const ModelClass = createdModels[modelName] as ModelStatic<Model>;

  if (!ModelClass) throw new Error(`Model "${modelName}" does not exist`);

  const findById = async (id: string | number, options?: ServiceOptions) => {
    const instance = await ModelClass.findByPk(id, {
      paranoid: options?.paranoid ?? true,
      transaction: options?.transaction,
    });
    if (!instance) throw new Error(`${modelName} with id ${id} not found`);
    return instance as T;
  };

  return {
    // CREATE
    create: async (data: Partial<T>, options?: ServiceOptions) => {
      try {
        if (modelName === "User" && (data as any).password) {
          (data as any).password = await bcrypt.hash(
            (data as any).password,
            10,
          );
        }
        const created = await ModelClass.create(data, {
          transaction: options?.transaction,
        });
        if (modelName === "Booking") {
          try {
            const ClientProfile = createdModels.ClientProfile;
            const Notification = createdModels.Notification;
            const Role = createdModels.Role;
            const User = createdModels.User;

            const clientProfile = await ClientProfile.findByPk(
              (created as any).client_id,
            );
            const clientUserId = (clientProfile as any)?.user_id;

            if (clientUserId) {
              await Notification.create({
                user_id: clientUserId,
                title: "Booking created",
                message:
                  "Your booking was created successfully. Awaiting admin assignment.",
              });
              (global as any).io
                ?.to(`user:${clientUserId}`)
                .emit("notification", {
                  title: "Booking created",
                  message:
                    "Your booking was created successfully. Awaiting admin assignment.",
                });
            }

            const adminRole = await Role.findOne({
              where: { name: "Admin" },
            });
            if (adminRole) {
              const admins = await User.findAll({
                where: { role_id: (adminRole as any).id },
              });
              await Promise.all(
                admins.map((admin: any) =>
                  Notification.create({
                    user_id: admin.id,
                    title: "New booking",
                    message: "A new booking was created and needs assignment.",
                  }),
                ),
              );
              (global as any).io?.to("admin").emit("notification", {
                title: "New booking",
                message: "A new booking was created and needs assignment.",
              });
            }
          } catch (notifyErr) {
            console.error("booking notification failed", notifyErr);
          }
        }
        if (modelName === "Service") {
          try {
            const Notification = createdModels.Notification;
            const Role = createdModels.Role;
            const User = createdModels.User;

            const userRole = await Role.findOne({ where: { name: "User" } });
            if (userRole) {
              const users = await User.findAll({
                where: { role_id: (userRole as any).id },
              });
              await Promise.all(
                users.map((u: any) =>
                  Notification.create({
                    user_id: u.id,
                    title: "New service",
                    message: "A new service has been added. Check services.",
                  }),
                ),
              );
              (global as any).io?.emit("notification", {
                title: "New service",
                message: "A new service has been added. Check services.",
              });
            }
          } catch (notifyErr) {
            console.error("service notification failed", notifyErr);
          }
        }
        return created;
      } catch (err: any) {
        throw new Error(`Failed to create ${modelName}: ${err.message}`);
      }
    },

    // BULK CREATE
    bulkCreate: async (data: Partial<T>[], options?: ServiceOptions) => {
      try {
        return await ModelClass.bulkCreate(data, {
          transaction: options?.transaction,
        });
      } catch (err: any) {
        throw new Error(`Failed to bulk create ${modelName}: ${err.message}`);
      }
    },

    // GET ALL with filters, pagination, includes
    getAll: async (options: GetAllOptions = {}) => {
      try {
        return await ModelClass.findAll({
          limit: options.limit ?? 100,
          offset: options.offset ?? 0,
          where: options.where ?? {},
          order: options.order ?? [["createdAt", "DESC"]],
          include: options.include ?? [],
          paranoid: options.paranoid ?? true,
          transaction: options.transaction,
        });
      } catch (err: any) {
        throw new Error(`Failed to get all ${modelName}: ${err.message}`);
      }
    },
    getAllWithCount: async (options: GetAllOptions = {}) => {
      try {
        const { rows, count } = await ModelClass.findAndCountAll({
          limit: options.limit ?? 100,
          offset: options.offset ?? 0,
          where: options.where ?? {},
          order: options.order ?? [["createdAt", "DESC"]],
          include: options.include ?? [],
          paranoid: options.paranoid ?? true,
          transaction: options.transaction,
        });

        return { rows, count };
      } catch (err: any) {
        throw new Error(
          `Failed to get all ${modelName} with count: ${err.message}`,
        );
      }
    },

    // GET ONE by primary key
    getOne: async (
      id: string | number,
      options?: { include?: any[] } & ServiceOptions,
    ) => {
      try {
        const instance = await ModelClass.findByPk(id, {
          paranoid: options?.paranoid ?? true,
          include: options?.include ?? [],
          transaction: options?.transaction,
        });
        if (!instance) throw new Error(`${modelName} with id ${id} not found`);
        return instance as T;
      } catch (err: any) {
        throw new Error(`Failed to get ${modelName}: ${err.message}`);
      }
    },

    // UPDATE by primary key
    update: async (
      id: string | number,
      data: Partial<T>,
      options?: ServiceOptions,
    ) => {
      try {
        const instance = await findById(id, options);
        const beforeProfessionalId =
          modelName === "Booking" ? (instance as any).professional_id : null;
        const beforePaymentStatus =
          modelName === "Booking" ? (instance as any).payment_status : null;
        if (modelName === "User" && (data as any).password) {
          (data as any).password = await bcrypt.hash(
            (data as any).password,
            10,
          );
        }
        const updated = await instance.update(data, {
          transaction: options?.transaction,
        });
        if (modelName === "Booking") {
          const afterProfessionalId = (updated as any).professional_id;
          if (
            afterProfessionalId &&
            String(afterProfessionalId) !== String(beforeProfessionalId)
          ) {
            try {
              const ClientProfile = createdModels.ClientProfile;
              const ProfessionalProfile = createdModels.ProfessionalProfile;
              const Notification = createdModels.Notification;

              const bookingClientId = (updated as any).client_id;
              const clientProfile = await ClientProfile.findByPk(
                bookingClientId,
                { transaction: options?.transaction },
              );

              const professionalProfile = await ProfessionalProfile.findByPk(
                afterProfessionalId,
                { transaction: options?.transaction },
              );

              const clientUserId = (clientProfile as any)?.user_id;
              const professionalUserId = (professionalProfile as any)?.user_id;

              if (clientUserId) {
                await Notification.create(
                  {
                    user_id: clientUserId,
                    title: "Booking assigned",
                    message:
                      "Your booking has been assigned to a professional. Please check your bookings for details.",
                  },
                  { transaction: options?.transaction },
                );
              }

              if (professionalUserId) {
                await Notification.create(
                  {
                    user_id: professionalUserId,
                    title: "New booking assigned",
                    message:
                      "A new booking has been assigned to you. Please check your assigned bookings.",
                  },
                  { transaction: options?.transaction },
                );
              }
            } catch (notifyErr) {
              console.error("Failed to create booking assignment notification", notifyErr);
            }
          }
          const afterPaymentStatus = (updated as any).payment_status;
          if (
            afterPaymentStatus === "Paid" &&
            String(beforePaymentStatus) !== "Paid"
          ) {
            try {
              const ClientProfile = createdModels.ClientProfile;
              const Notification = createdModels.Notification;

              const clientProfile = await ClientProfile.findByPk(
                (updated as any).client_id,
              );
              const clientUserId = (clientProfile as any)?.user_id;

              if (clientUserId) {
                await Notification.create({
                  user_id: clientUserId,
                  title: "Payment approved",
                  message:
                    "Your payment has been approved. Your booking is confirmed.",
                });
                (global as any).io
                  ?.to(`user:${clientUserId}`)
                  .emit("notification", {
                    title: "Payment approved",
                    message:
                      "Your payment has been approved. Your booking is confirmed.",
                  });
              }
            } catch (notifyErr) {
              console.error("payment approval notification failed", notifyErr);
            }
          }
        }
        return updated;
      } catch (err: any) {
        throw new Error(`Failed to update ${modelName}: ${err.message}`);
      }
    },

    // BULK UPDATE by where condition
    bulkUpdate: async (
      data: Partial<T>,
      where: Record<string, any>,
      options?: ServiceOptions,
    ) => {
      try {
        return await ModelClass.update(data, {
          where,
          transaction: options?.transaction,
        });
      } catch (err: any) {
        throw new Error(`Failed to bulk update ${modelName}: ${err.message}`);
      }
    },

    // DELETE by primary key (soft or hard)
    delete: async (id: string | number, options?: ServiceOptions) => {
      try {
        const instance = await findById(id, options);
        return await instance.destroy({ transaction: options?.transaction });
      } catch (err: any) {
        throw new Error(`Failed to delete ${modelName}: ${err.message}`);
      }
    },
    getMe: async (
      userId: string | number,
      options?: ServiceOptions & { include?: any[] },
    ) => {
      try {
        const instance = await ModelClass.findByPk(userId, {
          paranoid: options?.paranoid ?? true,
          include: options?.include ?? [],
          transaction: options?.transaction,
        });
        if (!instance)
          throw new Error(`${modelName} with id ${userId} not found`);
        return instance as T;
      } catch (err: any) {
        throw new Error(`Failed to get ${modelName}: ${err.message}`);
      }
    },
    // BULK DELETE by where condition
    bulkDelete: async (
      where: Record<string, any>,
      options?: ServiceOptions,
    ) => {
      try {
        return await ModelClass.destroy({
          where,
          transaction: options?.transaction,
        });
      } catch (err: any) {
        throw new Error(`Failed to bulk delete ${modelName}: ${err.message}`);
      }
    },

    // RESTORE soft-deleted record
    restore: async (id: string | number, options?: ServiceOptions) => {
      if (!ModelClass.options.paranoid)
        throw new Error(
          `${modelName} does not support restore (paranoid disabled)`,
        );

      try {
        const instance = await ModelClass.findByPk(id, {
          paranoid: false,
          transaction: options?.transaction,
        });
        if (!instance) throw new Error(`${modelName} with id ${id} not found`);
        return await instance.restore({ transaction: options?.transaction });
      } catch (err: any) {
        throw new Error(`Failed to restore ${modelName}: ${err.message}`);
      }
    },
  };
};
