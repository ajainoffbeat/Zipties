import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().max(50).min(1, "First name is required"),
  lastName: z.string().max(50).min(1, "Last name is required"),
  username: z.string().optional(),
  bio: z.string().max(160).optional(),
  profileImageUrl: z
    .string()
    // .url("Invalid image URL")
    .optional()
    .or(z.literal("")),
  interests: z.string().optional(),
  tags: z.string().optional(),
  cityId: z.string().optional(),
  cityName: z.string(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
