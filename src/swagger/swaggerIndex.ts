// src/swagger/swagger.ts
import { Application } from "express";
import swaggerJsdoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { model } from "../model/model";

/** Generate schemas dynamically from model definitions */
const generateSchemas = () => {
  const schemas: Record<string, any> = {};

  for (const modelName in model) {
    const def = model[modelName];
    const properties: Record<string, any> = {};
    const required: string[] = [];

    if (def?.fields) {
      for (const field in def.fields) {
        const f = def.fields[field];
        let type = "string";
        if (f.type === "INTEGER") type = "integer";
        if (f.type === "BOOLEAN") type = "boolean";
        if (f.type === "JSON") type = "object";
        if (f.type === "ENUM" && f.values) type = "string";

        properties[field] = { type };
        if (f.type === "ENUM" && f.values) properties[field].enum = f.values;

        if (!f.allowNull) required.push(field);
      }
    }

    schemas[modelName] = { type: "object", properties };
    if (required.length > 0) schemas[modelName].required = required;
  }

  return schemas;
};

/** Generate dynamic paths for CRUD + auth + custom routes */
const generatePaths = () => {
  const paths: Record<string, any> = {};

  // ================== AUTH ROUTES ==================
  paths["/auth/register"] = {
    post: {
      summary: "Register new user",
      tags: ["auth"],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
      },
      responses: { 201: { description: "User registered" } },
    },
  };

  paths["/auth/login"] = {
    post: {
      summary: "Login user",
      tags: ["auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { email: { type: "string" }, password: { type: "string" } },
            },
          },
        },
      },
      responses: { 200: { description: "Login successful" }, 401: { description: "Invalid credentials" } },
    },
  };

  paths["/auth/profile"] = {
    get: {
      summary: "Get user profile",
      tags: ["auth"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Success" }, 401: { description: "Unauthorized" } },
    },
  };

  // ================== CUSTOM BOOKING ROUTE ==================
  paths["/booking/{id}/checkin"] = {
    post: {
      summary: "Check in a booking by ID",
      tags: ["booking"],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, description: "Booking ID" }],
      requestBody: {
        required: false,
        content: { "application/json": { schema: { type: "object", properties: { check_in_time: { type: "string", format: "date-time" } } } } },
      },
      responses: {
        200: { description: "Booking successfully checked in" },
        404: { description: "Booking not found" },
        400: { description: "Invalid booking ID" },
      },
    },
  };

  // ================== DYNAMIC CRUD ROUTES ==================
  for (const modelName in model) {
    const def = model[modelName];
    const basePath = `/${modelName.toLowerCase()}`;

    // GET all & POST create
    if (def.routes?.includes("read") || def.routes?.includes("create")) {
      paths[basePath] = {
        get: def.routes.includes("read")
          ? {
              summary: `Get all ${modelName}`,
              tags: [modelName],
              security: [{ bearerAuth: [] }],
              responses: { 200: { description: "Success" } },
            }
          : undefined,
        post: def.routes.includes("create")
          ? {
              summary: `Create ${modelName}`,
              tags: [modelName],
              security: [{ bearerAuth: [] }],
              requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${modelName}` } } } },
              responses: { 201: { description: `${modelName} created successfully` } },
            }
          : undefined,
      };
    }

    // GET /:id, PUT /:id, DELETE /:id
    if (def.routes?.length) {
      paths[`${basePath}/{id}`] = {
        get: def.routes.includes("read")
          ? {
              summary: `Get ${modelName} by ID`,
              tags: [modelName],
              security: [{ bearerAuth: [] }],
              parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
              responses: { 200: { description: "Success" } },
            }
          : undefined,
        put: def.routes.includes("update")
          ? {
              summary: `Update ${modelName}`,
              tags: [modelName],
              security: [{ bearerAuth: [] }],
              parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
              requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${modelName}` } } } },
              responses: { 200: { description: `${modelName} updated successfully` } },
            }
          : undefined,
        delete: def.routes.includes("delete")
          ? {
              summary: `Delete ${modelName}`,
              tags: [modelName],
              security: [{ bearerAuth: [] }],
              parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
              responses: { 200: { description: `${modelName} deleted successfully` } },
            }
          : undefined,
      };
    }
  }

  return paths;
};

/** Swagger Options */
const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "Mental Health Platform API", version: "1.0.0", description: "All endpoints require JWT bearer" },
    servers: [{ url: "/api" }],
    components: {
      schemas: generateSchemas(),
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    },
    paths: generatePaths(),
  },
  apis: [],
};

/** Swagger Spec */
const swaggerSpec = swaggerJsdoc(options);

/** Initialize Swagger */
export default (app: Application) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true, swaggerOptions: { filter: true } }));
  console.log("📖 Swagger Initialized at /api-docs");
};
