import { createdModels } from "../model/db";
import { DataType } from "sequelize";

export const generateSwaggerSchemas = () => {
  const schemas: Record<string, any> = {};

  for (const modelName in createdModels) {
    const model = createdModels[modelName];
    const attributes = model.rawAttributes;

    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const field in attributes) {
      const attr: any = attributes[field]; // cast to any to avoid TS errors
      properties[field] = { type: mapSequelizeTypeToSwagger(attr.type) };

      // Check required fields
      if (attr.allowNull === false && !attr.autoIncrement) {
        required.push(field);
      }
    }

    schemas[modelName] = { type: "object", properties, required };
  }

  return schemas;
};

// Map Sequelize data types to Swagger types
const mapSequelizeTypeToSwagger = (type: any): string => {
  const key = type?.key || type?.constructor?.name; // fallback to constructor name
  switch (key) {
    case "STRING":
    case "TEXT":
    case "UUID":
    case "CHAR":
      return "string";
    case "INTEGER":
    case "BIGINT":
      return "integer";
    case "BOOLEAN":
      return "boolean";
    case "DATE":
    case "DATEONLY":
      return "string";
    case "FLOAT":
    case "DOUBLE":
    case "DECIMAL":
      return "number";
    default:
      return "string";
  }
};
