import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  updateProfile: (data: any) => Promise<void>;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
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

      updateProfile: async (data: any) => {
        set({ loading: true });
        try {
          // Map camelCase from form to snake_case for API
          const mappedData = {
            first_name: data.firstName,
            last_name: data.lastName,
            username: data.username,
            bio: data.bio,
            profile_image_url: data.profileImageUrl,
            city_id: data.cityId,
            city_name: data.cityName,
            interests: data.interests,
            tags: data.tags,
          };

          // Remove undefined values
          Object.keys(mappedData).forEach(
            (key) =>
              (mappedData as any)[key] === undefined &&
              delete (mappedData as any)[key]
          );

          await editProfile(mappedData);

          const currentProfile = get().profile;
          if (currentProfile) {
            // Update local state with the same snake_case format
            set({
              profile: { ...currentProfile, ...mappedData },
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
    }),
    {
      name: "profile-storage",
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
