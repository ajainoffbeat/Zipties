import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
 import { env } from "../config/env.js";
 import { AppError } from "../utils/response/appError.js";
import type { AuthPayload } from "../@types/auth.js";
 
const JWT_SECRET: Secret = env.JWT_SECRET as Secret;
const JWT_EXPIRES_IN: SignOptions["expiresIn"] = env.JWT_EXPIRES_IN as SignOptions["expiresIn"] || '1d';
 
interface JwtPayload {
  userId: string;
  email: string;
  [key: string]: any; // optional extra fields
}
 
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
 
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
};
 
export const decodeToken = (token: string): AuthPayload => {
  try {
    const decoded = jwt.decode(token) as AuthPayload | null;

    if (!decoded || !decoded.userId) {
      throw new AppError(401, "Invalid token payload");
    }

    return decoded;
  } catch (err) {
    throw new AppError(401, "Invalid or expired token");
  }
};

export const extractBearerToken = (
  authorization?: string
): string => {
  if (!authorization) {
    throw new AppError(401, "Authorization header missing");
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    throw new AppError(401, "Invalid authorization format");
  }

  return token;
};
