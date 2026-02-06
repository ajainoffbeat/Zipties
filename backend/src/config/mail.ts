import nodemailer from "nodemailer";
import { env } from "./env.js"; 

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
    console.log("Mail server is ready");
  } catch (error) {
    console.error("Mail server connection failed", error);
  }
};