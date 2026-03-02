import type { Request, Response, NextFunction } from "express";
import { logErrorToDB } from "../services/errorLogger.service.js";
import { decodeToken, extractBearerToken } from "../utils/jwt.util.js";
import { logger } from "../utils/logger.js";
import { EmailService } from "../services/email.service.js";

export const errorLogs = async (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (err instanceof Error) {
      const action = `${req.method} ${req.originalUrl}`;
      const requestData = JSON.stringify({
        params: req.params,
        query: req.query,
        body: { ...req.body, password: undefined },
      });
      let userId = null;
      if (req.headers.authorization) {
        const token = extractBearerToken(req.headers.authorization);
        userId = decodeToken(token).userId;
      }
      await logErrorToDB({
        action,
        requestData,
        stackTrace: err.stack ?? null,
        errorMessage: err.message,
        createdBy: userId,
      });
      await EmailService.sendExceptionEmail(err.message, action, err.stack ?? "N/A");
    }
  } catch (e) {
    logger.error("ErrorLogs middleware failed", { error: e });
  }

  next(err);
};
