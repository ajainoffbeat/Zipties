// profile.schema.ts
import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  bio: z.string().max(160).optional(),
  location: z.string().max(100).optional(),
  website: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal("")),
  profileImageUrl: z
    .string()
    .url("Invalid image URL")
    .optional()
    .or(z.literal("")),
  interests: z.string().optional(),
  tags: z.string().optional(),
  cityId: z.number().optional().or(z.string().optional()),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
