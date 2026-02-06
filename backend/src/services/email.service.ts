import { mailer } from "../config/mail.js";
import {
  exceptionEmailTemplate,
  resetPasswordEmailTemplate,
} from "../templates/email.template.js";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  return mailer.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

export const EmailService = {
//   sendOtpEmail(email: string, otp: string) {
//     const template = otpEmailTemplate(otp);
//     return sendEmail({
//       to: email,
//       subject: template.subject,
//       html: template.html,
//     });
//   },

  sendExceptionEmail(error_message: string, action: string,stack:string) {
    const template = exceptionEmailTemplate(error_message, action,stack);
    return sendEmail({
      to: process.env.ERROR_EMAIL_TO || process.env.EMAIL_USER!,
      subject: template.subject,
      html: template.html,
    });
  },

  sendResetPasswordEmail(email: string, resetLink: string) {
    const template = resetPasswordEmailTemplate(resetLink);
    return sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });
  },
};
