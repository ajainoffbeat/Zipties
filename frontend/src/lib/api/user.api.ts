import { ProfileFormValues } from "../validators/profile.schema";
import { api } from "./client";

export const getProfileById = (id: string) => api.get(`/user/profile/${id}`);
export const getProfile = () => api.get(`/user/profile`);
export const searchUsers = (query: string) => api.get(`/user/search?q=${query}`);
export const getCitiesList = (search?: string) => api.get(`/user/cities${search ? `?q=${search}` : ""}`);
export const uploadAvatar = (formData: FormData) =>
    api.post("/user/upload-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const editProfile = (data: ProfileFormValues) => api.post("/user/editprofile", data);
export const blockUser = async (payload: {
  user_blocked: string;
  is_blocking: boolean;
}) => {
  const res = await api.post("/block/user", payload);
  return res.data;
};
