export interface ErrorResponse {
  success: false;
  message: string;
}

export interface AppError extends Error {
  message:string
  statusCode: number;
  // isOperational: boolean;
}