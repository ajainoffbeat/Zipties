import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL:process.env.DATABASE_URL,
  NODE_ENV:process.env.NODE_ENV,
  GMAIL_USER:process.env.GMAIL_USER,
  GMAIL_SERVICE_PASSWORD:process.env.GMAIL_SERVICE_PASSWORD,
  ERROR_EMAIL_TO:process.env.ERROR_EMAIL_TO,
  RATE_LIMIT_TIME:process.env.RATE_LIMIT_TIME,
  RATE_LIMIT_REQ:process.env.RATE_LIMIT_REQ,
  FRONTEND_URL:process.env.FRONTEND_URL,
  JWT_SECRET:process.env.JWT_SECRET,
  JWT_EXPIRES_IN:process.env.JWT_EXPIRES_IN 
};
