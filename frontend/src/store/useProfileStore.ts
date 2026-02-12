import { create } from "zustand";
import { getProfile, getProfileById } from "@/lib/api/auth.api";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  bio?: string;
  profile_image_url?: string;
  city_id?: string;
  city_name?: string;
  interests?: string;
  tags?: string;
  joined_date?: string;
}

interface ProfileState {
  profile: Profile | null;
  publicProfile: Profile | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  fetchProfileByUsername: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  publicProfile: null,
  loading: false,

  fetchProfile: async (userId) => {
    set({ loading: true });
    try {
      const res = await getProfile();
      set({
        profile: res.data.data,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      console.error("Fetch profile failed", error);
    }
  },

  fetchProfileByUsername: async (userId) => {
    set({ loading: true, publicProfile: null });
    try {
      const res = await getProfileById(userId);
      set({
        publicProfile: res.data.data,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      console.error("Fetch public profile failed", error);
      throw error;
    }
  },

  updateProfile: async (data) => {
    set({ loading: true });
    try {
      // await editProfile(data);
      const currentProfile = get().profile;
      if (currentProfile) {
        set({
          profile: { ...currentProfile, ...data },
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
