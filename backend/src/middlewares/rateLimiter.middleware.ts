import type { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../services/rateLimit.service.js";
import { AppError } from "../utils/response/appError.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";

export const rateLimiter =
  (limit:number, windowSeconds:number ) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
    
      const requestData = JSON.stringify({
        params: req.params,
        query: req.query,
        body: { ...req.body, password: undefined },
      });
      
      // console.log("api rate",req)
      const allowed = await checkRateLimit(
        req.ip,
        req.url,
        limit,
        windowSeconds,
        requestData

      );


      if (!allowed) {
        // res.status(429).tson({
        //   status: 429,
        //   error: "Too many requests"
        // });
        throw new AppError(200,"Too many requests sent",{
          code:RESPONSE_CODES.TOO_MANY_REQUESTS,
          success:false
        })
      }

      next();
    } catch (err) {
      next(err);
    }
  };
