import { api } from "./client";
import { AuthFormValues } from "@/lib/validators/auth.schema";

export const login = (data: AuthFormValues) => {
  return api.post("/login", data);
};

export const signup = (data: AuthFormValues) => {
  return api.post("/signup", data);
};

export const verifyResetToken = (token: string) =>
  api.get(`/verify-reset-token?token=${token}`);

export const forgotPassword = (data: { email: string }) =>
  api.post("/forgot-password", data);

export const resetPassword = (data: { token: string; password: string }) =>
  api.post("/reset-password", data);

export const getProfile = (userId: string) =>
  api.get(`/user/profile/${userId}`);

export const editProfile = (data: any) =>
  api.post("/user/editprofile", data);

export const getCitiesList = (search?: string) =>
  api.get(`/user/cities${search ?`?q=${search}` : ""}`);
