import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { model as modelDefs } from "./model";

import dotenv from "dotenv";
dotenv.config();

let sequelize: Sequelize;

if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
  // Production: Use full URL from Render
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // necessary for Render / cloud SSL
      },
    },
  });
} else {
  // Development: Use local Postgres
  if (
    !process.env.DB_NAME ||
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD ||
    !process.env.DB_HOST
  ) {
    throw new Error("Missing DB config in .env for development");
  }

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      dialect: "postgres",
      logging: console.log,
    },
  );
}

type AnyModel = ModelStatic<Model<any, any>>;
export const createdModels: Record<string, AnyModel> = {};

// Step 1: Define all models
for (const modelName in modelDefs) {
  const def = modelDefs[modelName];
  const fields: any = {};

  // Primary key
  fields.id = {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  };

  // Add fields
  for (const key in def.fields) {
    const field = def.fields[key];
    let type: any;
    switch (field.type) {
      case "STRING":
        type = DataTypes.STRING;
        break;
      case "UUID":
        type = DataTypes.UUID;
        break;
      case "INTEGER":
        type = DataTypes.INTEGER;
        break;
      case "BOOLEAN":
        type = DataTypes.BOOLEAN;
        break;
      case "DATE":
        type = DataTypes.DATE;
        break;
      case "ENUM":
        type = DataTypes.ENUM(...field.values);
        break;
      case "JSON":
        type = DataTypes.JSON;
        break;
      default:
        type = DataTypes.STRING;
    }

    const { default: defaultValue, ...otherFieldProps } = field as any;
    fields[key] = { ...otherFieldProps, type, defaultValue };
  }

  createdModels[modelName] = sequelize.define(modelName, fields, {
    timestamps: true,
    paranoid: true,
    underscored: true,
  });
}

// Step 2: Apply relations
for (const modelName in modelDefs) {
  const def = modelDefs[modelName];
  const mdl = createdModels[modelName];

  if (def.relations) {
    def.relations.forEach((rel) => {
      const target = createdModels[rel.model];
      if (!target) {
        throw new Error(
          `Model "${rel.model}" not found for relation in "${modelName}"`,
        );
      }

      switch (rel.type) {
        case "hasMany":
          mdl.hasMany(target, rel.options);
          break;
        case "hasOne":
          mdl.hasOne(target, rel.options);
          break;
        case "belongsTo":
          mdl.belongsTo(target, rel.options);
          break;
        case "belongsToMany":
          mdl.belongsToMany(target, rel.options);
          break;
      }
    });
  }
}
export default sequelize;
