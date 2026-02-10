import { create } from "zustand";
import { getProfile, editProfile } from "@/lib/api/auth.api";

interface Profile {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  username: string;
  email: string;
  // website?: string;
  location?: string;
  bio?: string;
  joined_date?: string;
  profileImageUrl?: string;
  interests?: string;
  tags?: string;
  city_id?: number | string;
  city_name?: string;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,

  fetchProfile: async (userId) => {
    set({ loading: true });
    try {
      const res = await getProfile(userId);
      set({
        profile: res.data.data,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      console.error("Fetch profile failed", error);
    }
  },

  updateProfile: async (data) => {
    set({ loading: true });
    try {
      await editProfile(data);
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
