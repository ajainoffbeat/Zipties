import { Request } from "express";

export interface TypedRequest<T = unknown> extends Request {
  body: T;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}