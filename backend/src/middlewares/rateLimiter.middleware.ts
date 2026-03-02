import type { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../services/rateLimit.service.js";
import { AppError } from "../utils/response/appError.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";
import { decodeToken, extractBearerToken } from "../utils/jwt.util.js";

export const rateLimiter =
  (limit: number, windowSeconds: number) =>
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        let decoded;
        if(req.headers.authorization){
          const token = extractBearerToken(req.headers.authorization);
          decoded = decodeToken(token);
        }

        const requestData = JSON.stringify({
          params: req.params,
          query: req.query,
          body: { ...req.body, password: undefined },
        });
        const allowed = await checkRateLimit(
          req.ip,
          req.url,
          limit,
          windowSeconds,
          requestData,
          decoded?.userId || null
        );


        if (!allowed) {
          // res.status(429).tson({
          //   status: 429,
          //   error: "Too many requests"
          // });
          throw new AppError(200, "Too many requests sent", {
            code: RESPONSE_CODES.TOO_MANY_REQUESTS,
            success: false
          })
        }

        next();
      } catch (err) {
        next(err);
      }
    };
