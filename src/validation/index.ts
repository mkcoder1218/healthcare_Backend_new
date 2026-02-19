// src/validation/validation.ts
import Joi from "joi";
import { GLOBAL_STATUS } from "../types/global";

export const validationSchemas: Record<string, Joi.ObjectSchema> = {
  User: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    phone_number: Joi.string().optional().allow(null),
    password: Joi.string().min(4).required(),
    role_id: Joi.string().uuid().required(),
    status: Joi.string().valid("Active", "Inactive").required(),
  }),

  Role: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().optional().allow(null),
  }),
  ClientLevel: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().optional().allow(null),
  }),
  ServiceCategory: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().optional().allow(null),
  }),
  ServiceType: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().optional().allow(null),
  }),
  ClientTypes: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().optional().allow(null),
  }),

  ProfessionalProfile: Joi.object({
    user_id: Joi.string().uuid().required(),
    profession: Joi.string().required(),
    license_file_id: Joi.string().uuid().optional().allow(null),
    degree_file_id: Joi.string().uuid().optional().allow(null),
    bio: Joi.string().optional().allow(null),
    verification_status: Joi.string()
      .valid("Pending", "Verified", "Rejected")
      .optional()
      .default("Pending"),
  }),

  ClientProfile: Joi.object({
    user_id: Joi.string().uuid().required(),
    age: Joi.number().integer().min(0).optional(),
    sex: Joi.string().valid("Male", "Female", "Other").optional(),
    marital_status: Joi.string().optional().allow(null),
    client_type_id: Joi.string().uuid().optional().allow(null),
    client_level_id: Joi.string().uuid().optional().allow(null),
    residency: Joi.string().optional().allow(null),
    academic_level: Joi.string().optional().allow(null),
    work_status: Joi.string().optional().allow(null),
    financial_problem: Joi.boolean().optional(),
    substance_use: Joi.array().items(Joi.string()).optional(),
    problem_description: Joi.string().optional().allow(null),
    service_preference: Joi.string().valid("Online", "Face-to-face").optional(),
  }),

  Service: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().optional().allow(null),
    price: Joi.number().min(0).required(),
    duration: Joi.string().required(),
    category_id: Joi.string().uuid().optional().allow(null),
    file_id: Joi.string().uuid().optional().allow(null),
    type_id: Joi.string().uuid().optional().allow(null),
  }),

  Booking: Joi.object({
    client_id: Joi.string().uuid().required(),
    professional_id: Joi.string().uuid().required(),
    service_id: Joi.string().uuid().required(),
    date: Joi.date().required(),
    time: Joi.string().required(),
    status: Joi.string()
      .valid("Pending", "Confirmed", "Completed", "Cancelled")
      .required(),
    notes: Joi.string().optional().allow(null),
    payment_status: Joi.string().valid("Paid", "Unpaid").required(),
  }),

  File: Joi.object({
    url: Joi.string().required(),
    description: Joi.string().optional().allow(null),
    type: Joi.string()
      .valid("License", "Degree", "ProfilePic", "Video")
      .optional(),
  }),

  Notification: Joi.object({
    title: Joi.string().required(),
    message: Joi.string().required(),
    read: Joi.boolean().optional().default(false),
  }),
};

export const validationUpdateSchemas: Record<string, Joi.ObjectSchema> = {
  User: validationSchemas.User.fork(
    Object.keys(validationSchemas.User.describe().keys),
    (schema) => schema.optional(),
  ),
  Role: validationSchemas.Role.fork(
    Object.keys(validationSchemas.Role.describe().keys),
    (schema) => schema.optional(),
  ),
  ProfessionalProfile: validationSchemas.ProfessionalProfile.fork(
    Object.keys(validationSchemas.ProfessionalProfile.describe().keys),
    (schema) => schema.optional(),
  ),
  ClientProfile: validationSchemas.ClientProfile.fork(
    Object.keys(validationSchemas.ClientProfile.describe().keys),
    (schema) => schema.optional(),
  ),
  Service: validationSchemas.Service.fork(
    Object.keys(validationSchemas.Service.describe().keys),
    (schema) => schema.optional(),
  ),
  Booking: validationSchemas.Booking.fork(
    Object.keys(validationSchemas.Booking.describe().keys),
    (schema) => schema.optional(),
  ),
  File: validationSchemas.File.fork(
    Object.keys(validationSchemas.File.describe().keys),
    (schema) => schema.optional(),
  ),
  Notification: validationSchemas.Notification.fork(
    Object.keys(validationSchemas.Notification.describe().keys),
    (schema) => schema.optional(),
  ),
};
