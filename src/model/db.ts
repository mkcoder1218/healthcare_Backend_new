import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { model as modelDefs } from "./model";

export const sequelize = new Sequelize(
  "health_care_new",
  "postgres",
  "postgres",
  {
    host: "localhost",
    dialect: "postgres",
    logging: console.log,
  }
);

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

    fields[key] = { ...field, type };
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
          `Model "${rel.model}" not found for relation in "${modelName}"`
        );
      }

      switch (rel.type) {
        case "hasMany":
          mdl.hasMany(target, rel.options);
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

// Step 3: Sync (use force: true for first-time dev)
sequelize
  .sync({ alter: true }) // or { force: true } if starting fresh
  .then(() => console.log("✅ All tables synced"))
  .catch((err) => console.error("❌ Sequelize sync error:", err));
