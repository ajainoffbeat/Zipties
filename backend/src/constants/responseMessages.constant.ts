import { RESPONSE_CODES } from "./responseCode.constant.js";  

export const RESPONSE_MESSAGES = {  
  [RESPONSE_CODES.SUCCESS]: "Success",
  [RESPONSE_CODES.INTERNAL_SERVER_ERROR]: "Internal server error",
  [RESPONSE_CODES.INVALID_CREDS]: "Invalid credentials",
  [RESPONSE_CODES.USER_NOT_FOUND]: "User not found",
  [RESPONSE_CODES.USER_ALREADY_EXISTS]: "User already exist with this email",
  [RESPONSE_CODES.BAD_REQUEST]: "Bad request",
  [RESPONSE_CODES.TOO_MANY_REQUESTS]: "Too many requests sent",
  [RESPONSE_CODES.UNAUTHORIZED]: "User is unauthorized",
} as const;
