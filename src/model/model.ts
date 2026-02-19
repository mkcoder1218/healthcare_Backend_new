// src/model/model.ts
import { GLOBAL_STATUS, ModelDefinition } from "../types/global";

export const model: Record<string, ModelDefinition> = {
  User: {
    fields: {
      name: { type: "STRING", allowNull: false },
      phone_number: { type: "STRING", allowNull: true },
      password: { type: "STRING", allowNull: false },
      role_id: { type: "UUID", allowNull: true }, // links to Role

      status: { type: "STRING", allowNull: false, default: "Active" },
      point: { type: "INTEGER", allowNull: false, default: 0 },
    },
    relations: [
      {
        type: "belongsTo",
        model: "Role",
        options: { foreignKey: "role_id", as: "role" },
      },
      { type: "hasMany", model: "Booking", options: { foreignKey: "user_id" } },

      {
        type: "hasMany",
        model: "Notification",
        options: { foreignKey: "user_id" },
      },
      {
        type: "hasOne",
        model: "ClientProfile",
        options: { foreignKey: "user_id", as: "clientProfile" },
      },
      {
        type: "hasOne",
        model: "ProfessionalProfile",
        options: { foreignKey: "user_id", as: "professionalProfile" },
      },
    ],
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },

  Role: {
    fields: {
      name: { type: "STRING", allowNull: false, unique: true },
      description: { type: "STRING", allowNull: true },
    },
    relations: [
      { type: "hasMany", model: "User", options: { foreignKey: "role_id" } },
    ],
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },

  ProfessionalProfile: {
    fields: {
      user_id: { type: "UUID", allowNull: false },
      profession: { type: "STRING", allowNull: false },
      license_file_id: { type: "UUID", allowNull: true },
      degree_file_id: { type: "UUID", allowNull: true },
      bio: { type: "STRING", allowNull: true },
      verification_status: {
        type: "ENUM",
        values: ["Pending", "Verified", "Rejected"],
        allowNull: false,
        default: "Pending",
      },
    },
    relations: [
      { type: "belongsTo", model: "User", options: { foreignKey: "user_id" } },
      {
        type: "belongsTo",
        model: "File",
        options: { foreignKey: "license_file_id", as: "licenseFile" },
      },
      {
        type: "belongsTo",
        model: "File",
        options: { foreignKey: "degree_file_id", as: "degreeFile" },
      },
    ],
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },

  ClientProfile: {
    fields: {
      user_id: { type: "UUID", allowNull: false },
      age: { type: "INTEGER", allowNull: true },
      client_type_id: { type: "UUID", allowNull: true },
      sex: { type: "STRING", allowNull: true },
      marital_status: { type: "STRING", allowNull: true },
      residency: { type: "STRING", allowNull: true },
      academic_level: { type: "STRING", allowNull: true },
      work_status: { type: "STRING", allowNull: true },
      financial_problem: { type: "BOOLEAN", allowNull: true },
      substance_use: { type: "JSON", allowNull: true }, // array of strings
      problem_description: { type: "STRING", allowNull: true },
      client_level_id: { type: "UUID", allowNull: true },
    },
    relations: [
      { type: "belongsTo", model: "User", options: { foreignKey: "user_id" } },
      {
        type: "belongsTo",
        model: "ClientTypes",
        options: { foreignKey: "client_type_id" },
      },
      {
        type: "hasMany",
        model: "Booking",
        options: { foreignKey: "client_id" },
      },
      {
        type: "belongsTo",
        model: "ClientLevel",
        options: { foreignKey: "client_level_id" },
      },
    ],
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },

  Service: {
    fields: {
      name: { type: "STRING", allowNull: false },
      description: { type: "STRING", allowNull: true },
      price: { type: "STRING", allowNull: false },
      duration: { type: "STRING", allowNull: false },
      category_id: { type: "UUID", allowNull: true },
      file_id: { type: "UUID", allowNull: true },
      type_id: { type: "UUID", allowNull: true },
    },
    relations: [
      {
        type: "hasMany",
        model: "Booking",
        options: { foreignKey: "service_id" },
      },
      {
        type: "belongsTo",
        model: "ServiceCategory",
        options: { foreignKey: "category_id", as: "category" },
      },
      {
        type: "belongsTo",
        model: "ServiceType",
        options: { foreignKey: "type_id", as: "type" },
      },
      {
        type: "belongsTo",
        model: "File",
        options: { foreignKey: "file_id", as: "file" },
      },
    ],
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },
  ClientTypes: {
    fields: {
      name: { type: "STRING", allowNull: false },
      description: { type: "STRING", allowNull: false },
    },
    routes: ["create", "read", "update", "delete"],
  },
  ClientLevel: {
    fields: {
      name: { type: "STRING", allowNull: false },
      description: { type: "STRING", allowNull: false },
    },
    routes: ["create", "read", "update", "delete"],
  },
  ServiceCategory: {
    fields: {
      name: { type: "STRING", allowNull: false },
      description: { type: "STRING", allowNull: false },
    },
    routes: ["create", "read", "update", "delete"],
  },
  ServiceType: {
    fields: {
      name: { type: "STRING", allowNull: false },
      description: { type: "STRING", allowNull: false },
    },
    routes: ["create", "read", "update", "delete"],
  },
  Booking: {
    fields: {
      client_id: { type: "UUID", allowNull: false },
      user_id: { type: "UUID", allowNull: true },
      professional_id: { type: "UUID", allowNull: false },
      service_id: { type: "UUID", allowNull: false },
      date: { type: "STRING", allowNull: false },
      time: { type: "STRING", allowNull: false },
      status: {
        type: "ENUM",
        values: ["Pending", "Confirmed", "Completed", "Cancelled"],
        allowNull: false,
        default: "Pending",
      },
      notes: { type: "STRING", allowNull: true },
      is_checked_in: { type: "BOOLEAN", allowNull: false, default: false },
      payment_status: {
        type: "ENUM",
        values: ["Paid", "Unpaid", "Pending", "Failed"],
        allowNull: false,
        default: "Unpaid",
      },
    },
    relations: [
      {
        type: "belongsTo",
        model: "ClientProfile",
        options: { foreignKey: "client_id" },
      },
      {
        type: "belongsTo",
        model: "ProfessionalProfile",
        options: { foreignKey: "professional_id" },
      },
      {
        type: "belongsTo",
        model: "Service",
        options: { foreignKey: "service_id" },
      },
    ],
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },

  PaymentMethod: {
    fields: {
      name: { type: "STRING", allowNull: false },
      description: { type: "STRING", allowNull: true },
      icon_url: { type: "STRING", allowNull: true },
      is_active: { type: "BOOLEAN", allowNull: false, default: true },
    },
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },

  File: {
    fields: {
      url: { type: "STRING", allowNull: true },
      description: { type: "STRING", allowNull: true },
      type: { type: "STRING", allowNull: true }, // e.g., "License", "ProfilePic", "Video"
    },
    relations: [
      {
        type: "hasMany",
        model: "ProfessionalProfile",
        options: { foreignKey: "license_file_id" },
      },
      {
        type: "hasMany",
        model: "ProfessionalProfile",
        options: { foreignKey: "degree_file_id" },
      },
      {
        type: "hasMany",
        model: "Service",
        options: { foreignKey: "file_id" },
      },
    ],
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },

  Notification: {
    fields: {
      title: { type: "STRING", allowNull: false },
      message: { type: "STRING", allowNull: false },
      read: { type: "BOOLEAN", allowNull: false, default: false },
    },
    relations: [
      { type: "belongsTo", model: "User", options: { foreignKey: "user_id" } },
    ],
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },
  Points: {
    fields: {
      point: { type: "INTEGER", allowNull: false, default: 0 },
      description: { type: "STRING", allowNull: true },
    },
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },
  PointTransaction: {
    fields: {
      user_id: { type: "UUID", allowNull: false },
      amount: { type: "INTEGER", allowNull: false },
      type: {
        type: "ENUM",
        values: ["Reward", "Redeem"],
        allowNull: false,
      },
      description: { type: "STRING", allowNull: true },
    },
    relations: [
      { type: "belongsTo", model: "User", options: { foreignKey: "user_id" } },
    ],
    routes: ["create", "read", "update", "delete"],
    auth: { create: true, read: true, update: true, delete: true },
  },
};
