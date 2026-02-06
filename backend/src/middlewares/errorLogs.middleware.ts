import type { Request, Response, NextFunction } from "express";
import { logErrorToDB } from "../services/errorLogger.service.js";
import { decodeToken, extractBearerToken } from "../utils/jwt.util.js";

export const errorLogs = async (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (err instanceof Error) {
      const action = `${req.method} ${req.originalUrl}`;
        const token = extractBearerToken(req.headers.authorization);
    const {userId} = decodeToken(token);

      const requestData = JSON.stringify({
        params: req.params,
        query: req.query,
        body: { ...req.body, password: undefined },
      });
      // await EmailService.sendExceptionEmail(err.message, action,err.stack?? "N\A");
      await logErrorToDB({
        action,
        requestData,
        stackTrace: err.stack ?? null,
        errorMessage: err.message,
        createdBy: userId ?? null,
      });
    }
  } catch (e) {
    console.error("ErrorLogs middleware failed:", e);
  }

  next(err);
};
