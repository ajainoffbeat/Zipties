export class AppError extends Error {
  public statusCode: number;
  public code: number | null;
  public success: boolean;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    options?: {
      code?: number;
      success?: boolean;
    }
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = options?.code ?? null;
    this.success = options?.success ?? false;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
