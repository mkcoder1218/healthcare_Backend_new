// service.ts
import { createdModels } from "../model/db";
import { Model, Transaction, FindOptions, Op, ModelStatic } from "sequelize";

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
        return await ModelClass.create(data, { transaction: options?.transaction });
      } catch (err: any) {
        throw new Error(`Failed to create ${modelName}: ${err.message}`);
      }
    },

    // BULK CREATE
    bulkCreate: async (data: Partial<T>[], options?: ServiceOptions) => {
      try {
        return await ModelClass.bulkCreate(data, { transaction: options?.transaction });
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
    throw new Error(`Failed to get all ${modelName} with count: ${err.message}`);
  }
},

    // GET ONE by primary key
    getOne: async (id: string | number, options?: { include?: any[] } & ServiceOptions) => {
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
    update: async (id: string | number, data: Partial<T>, options?: ServiceOptions) => {
      try {
        const instance = await findById(id, options);
        return await instance.update(data, { transaction: options?.transaction });
      } catch (err: any) {
        throw new Error(`Failed to update ${modelName}: ${err.message}`);
      }
    },

    // BULK UPDATE by where condition
    bulkUpdate: async (data: Partial<T>, where: Record<string, any>, options?: ServiceOptions) => {
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
getMe: async (userId: string | number, options?: ServiceOptions & { include?: any[] }) => {
  try {
    const instance = await ModelClass.findByPk(userId, {
      paranoid: options?.paranoid ?? true,
      include: options?.include ?? [],
      transaction: options?.transaction,
    });
    if (!instance) throw new Error(`${modelName} with id ${userId} not found`);
    return instance as T;
  } catch (err: any) {
    throw new Error(`Failed to get ${modelName}: ${err.message}`);
  }
},
    // BULK DELETE by where condition
    bulkDelete: async (where: Record<string, any>, options?: ServiceOptions) => {
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
        throw new Error(`${modelName} does not support restore (paranoid disabled)`);

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
