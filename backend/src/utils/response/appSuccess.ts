import type { Response } from "express";

export const sendSuccess = (
  res: Response,
  payload: {
    status: number;
    message: string;
    data?: any;
    [key: string]: any; // 👈 allow custom fields (token, pagination, etc.)
  }
) => {
  const { status, message, ...rest } = payload;

  return res.status(200).json({
    success: true,
    message,
    ...rest,
  });
};
