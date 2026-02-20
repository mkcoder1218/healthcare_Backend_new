import bcrypt from "bcryptjs"; // Use bcryptjs for easier installation
import jwt, { JwtPayload } from "jsonwebtoken";
import { createdModels } from "../model/db";
import { Model } from "sequelize";
import { Request } from "express";
import sequelize from "../model/db";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Define the User fields interface
interface UserAttributes {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  password: string;
  role_id: string;
  status: string;
  role?: any;
  clientProfile?: any;
  professionalProfile?: any;
}

type UserModel = Model<UserAttributes> & UserAttributes;
interface RegisterPayload {
  name: string;
  phone_number: string;
  password: string;
  role_id: string;
  status: string;
  email: string;
  professionalProfile: any;
  clientProfile: any;
}

interface LoginPayload {
  phone_number: string;
  password: string;
}
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Normalizes Ethiopian phone numbers to a standard 9-digit format (e.g., 911223344)
 */
const normalizePhone = (phone: string): string => {
  if (!phone) return phone;
  let cleaned = phone.replace(/\D/g, ""); // Remove all non-numeric characters
  if (cleaned.startsWith("251")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};
export const authService = {
  async getUserFromToken(req: Request): Promise<UserAttributes> {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      throw new AuthError("Authorization header missing");
    }

    const token = authHeader.split(" ")[1]; // Expecting 'Bearer <token>'
    if (!token) {
      throw new Error("Token missing");
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
      throw new AuthError("Invalid or expired token");
    }

    const userInstance = await createdModels.User.findOne({
      where: { id: decoded.id },
      include: [
        { model: createdModels.Role, as: "role" },
        { model: createdModels.ClientProfile, as: "clientProfile" },
        { model: createdModels.ProfessionalProfile, as: "professionalProfile" },
      ],
    });
    if (!userInstance) {
      throw new AuthError("User not found");
    }

    return userInstance.get({ plain: true }) as UserAttributes;
  },
  async register(payload: RegisterPayload) {
    const {
      name,
      phone_number,
      password,
      role_id,
      professionalProfile,
      clientProfile,
    } = payload;

    const normalized_phone = normalizePhone(phone_number);

    const existingUser = await createdModels.User.findOne({
      where: { phone_number: normalized_phone },
      raw: true,
    });

    if (existingUser) throw new Error("Phone number already exists");

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Use a transaction to ensure user + profile consistency
    const transaction = await sequelize.transaction();

    try {
      // 1. Validate role
      const role = await createdModels.Role.findOne({
        where: { id: role_id },
        raw: true,
      });

      if (!role) throw new Error("Invalid role selected");

      // 2. Create user
      const user = await createdModels.User.create(
        {
          name,
          phone_number: normalized_phone,
          password: hashedPassword,
          role_id,
          status: "Active",
        },
        { transaction },
      );

      const userPlain = user.get({ plain: true });

      // 3. Create profile dynamically
      let profile = null;

      if ((role as any).name.toLowerCase() === "professional") {
        if (!professionalProfile)
          throw new Error("Professional profile data is required");

        profile = await createdModels.ProfessionalProfile.create(
          {
            user_id: userPlain.id,
            profession: professionalProfile.profession,
            license_file_id: professionalProfile.license_file_id,
            degree_file_id: professionalProfile.degree_file_id,
            bio: professionalProfile.bio || null,
          },
          { transaction },
        );
      }

      if ((role as any).name.toLowerCase() === "client") {
        if (!clientProfile) throw new Error("Client profile data is required");

        profile = await createdModels.ClientProfile.create(
          {
            user_id: userPlain.id,
            age: clientProfile.age,
            client_type_id: clientProfile.client_type_id,
            sex: clientProfile.sex,
            marital_status: clientProfile.marital_status,
            residency: clientProfile.residency,
            academic_level: clientProfile.academic_level,
            work_status: clientProfile.work_status,
            financial_problem: clientProfile.financial_problem,
            substance_use: clientProfile.substance_use,
            problem_description: clientProfile.problem_description,
            client_level_id: clientProfile.client_level_id,
          },
          { transaction },
        );
      }

      await transaction.commit();

      return {
        user: userPlain,
        profile: profile ? profile.get({ plain: true }) : null,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async login(payload: LoginPayload) {
    const { phone_number, password } = payload;
    const normalized_phone = normalizePhone(phone_number);

    // Get user as plain object
    const userInstance = await createdModels.User.findOne({
      where: { phone_number: normalized_phone },
      include: [
        { model: createdModels.Role, as: "role" },
        { model: createdModels.ClientProfile, as: "clientProfile" },
        { model: createdModels.ProfessionalProfile, as: "professionalProfile" },
      ],
    });

    if (!userInstance) throw new Error("Invalid credentials");

    const user = userInstance.get({ plain: true }) as UserAttributes;

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, phone_number: user.phone_number, role_id: user.role_id },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return { user, token };
  },
};
