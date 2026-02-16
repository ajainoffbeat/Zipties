import { create } from "zustand";
import { editProfile, getProfileById } from "@/lib/api/user.api";

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
  isblocked?: boolean;
}

interface ProfileState {
  profile: Profile | null;
  publicProfile: Profile | null;
  loading: boolean;
  fetchProfileById: (id: string) => Promise<void>;
  fetchMyProfile: (id: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  publicProfile: null,
  loading: false,

  resetProfile: () => set({ profile: null, publicProfile: null, loading: false }),

  fetchProfileById: async (id) => {
    set({ loading: true, publicProfile: null });
    try {
      const res = await getProfileById(id);
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

  fetchMyProfile: async (id) => {
    set({ loading: true });
    try {
      const res = await getProfileById(id);
      set({
        profile: res.data.data,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      console.error("Fetch my profile failed", error);
      throw error;
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
