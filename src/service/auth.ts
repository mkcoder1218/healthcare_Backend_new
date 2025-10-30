import bcrypt from "bcryptjs"; // Use bcryptjs for easier installation
import jwt, { JwtPayload } from "jsonwebtoken";
import { createdModels } from "../model/db";
import { Model } from "sequelize";
import { Request } from "express";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Define the User fields interface
interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  role_id: string;
}

type UserModel = Model<UserAttributes> & UserAttributes;
interface RegisterPayload {
  name: string;
  phone_number: string;
  password: string;
  role_id: string;
  status:string;
  email:string
}

interface LoginPayload {
  email: string;
  password: string;
}
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
export const authService = {
async getUserFromToken(req: Request): Promise<UserAttributes> {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      throw new AuthError('Authorization header missing');
    }

    const token = authHeader.split(' ')[1]; // Expecting 'Bearer <token>'
    if (!token) {
      throw new Error('Token missing');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
      throw new AuthError('Invalid or expired token');
    }

    const userInstance = await createdModels.User.findOne({ where: { id: decoded.id } });
    if (!userInstance) {
      throw new AuthError('User not found');
    }

    return userInstance.get({ plain: true }) as UserAttributes;
  },
  async register(payload: RegisterPayload) {
    const { name, phone_number, password, role_id,email,status } = payload;

    // Check if email already exists
    const existingUser = await createdModels.User.findOne({
      where: { phone_number },
      raw: true, // Return plain object
    });
    if (existingUser) throw new Error("Phone number already exists");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await createdModels.User.create({
      name,
      phone_number,
      password: hashedPassword,
      role_id,
      email,
      status
    });

    return user.get({ plain: true }) as UserAttributes; // Return plain object
  },

  async login(payload: LoginPayload) {
    const { email, password } = payload;

    // Get user as plain object
    const userInstance = await createdModels.User.findOne({
      where: { email },
      include:[{model:createdModels.Role ,as:'role'}]
    });

    if (!userInstance) throw new Error("Invalid credentials");

    const user = userInstance.get({ plain: true }) as UserAttributes;


    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user, token };
  },
};
