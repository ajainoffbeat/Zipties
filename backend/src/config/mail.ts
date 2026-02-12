import nodemailer from "nodemailer";
import { env } from "./env.js";
import { logger } from "../utils/logger.js"; 

export const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_SERVICE_PASSWORD,
  },
   tls: {
    rejectUnauthorized: false, // ⚠️ ONLY FOR DEV
  },
});

export const verifyMailConnection = async () => {
  try {
    await mailer.verify();
    logger.info("Mail server is ready");
  } catch (error) {
    logger.error("Mail server connection failed", { error });
  }
};