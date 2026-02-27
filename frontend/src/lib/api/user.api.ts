import { ProfileFormValues } from "../validators/profile.schema";
import { api } from "./client";

export const getProfileById = (id: string) => api.get(`/user/profile/${id}`);
export const searchUsers = (query: string) => api.get(`/user/search?q=${query}`);
export const getCitiesList = (search?: string) => api.get(`/user/cities`, {
  params: search ? { q: search } : {},
});
export const uploadAvatar = (formData: FormData) =>
  api.post("/user/upload-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const editProfile = (data: any) => api.post("/user/editprofile", data);
export const blockUser = async (payload: {
  user_blocked: string;
  is_blocking: boolean;
}) => {
  const res = await api.post("/user/block", payload);
  return res.data;
};

export const followUser = async (userId: string) => {
  const res = await api.post(`/user/follow/${userId}`);
  return res.data;
};

export const unfollowUser = async (userId: string) => {
  const res = await api.post(`/user/unfollow/${userId}`);
  return res.data;
};

export const getFollowerCount = async (userId: string) => {
  const res = await api.get(`/user/followers/${userId}`);
  return res.data;
};

export const getFollowingCount = async (userId: string) => {
  const res = await api.get(`/user/following/${userId}`);
  return res.data;
};

export const getFollowCounts = async (userId: string) => {
  const res = await api.get(`/user/follow-counts/${userId}`);
  return res.data;
};
