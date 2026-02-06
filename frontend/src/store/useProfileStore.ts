import { create } from "zustand";
import { getProfile, updateProfile } from "@/lib/api/auth.api";

interface Profile {
  id: string;
  name: string;
  username: string;
  email: string;
  website: string;
  location: string;
  bio: string;
  joined_date: string;
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

    const res = await getProfile(userId)

    set({
      profile: res.data.data,
      loading: false,
    });
  },

  updateProfile: async (data) => {
    set({ loading: true });
    const currentProfile = get().profile;
    
    if (!currentProfile) {
      set({ loading: false });
      return;
    }

    try {
      const res = await updateProfile(currentProfile.id, data);
      set({
        profile: { ...currentProfile, ...data },
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
