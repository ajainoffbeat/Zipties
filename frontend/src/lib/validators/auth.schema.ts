import { z } from "zod";

export const authSchema = z
  .object({
    mode: z.enum(["login", "signup"]),
    fullName: z.string().optional(),
    email: z.string().email("Enter a valid email"),
    password:  z
   .string()
   .min(8, "Password must be at least 8 characters")
   .regex(/[a-z]/, "Password must contain at least one lowercase letter")
   .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
   .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().optional(),
    
  })
  .superRefine((data, ctx) => {
    if (data.mode === "signup") {
      if (!data.fullName || data.fullName.trim().length < 2) {
        ctx.addIssue({
          path: ["fullName"],
          message: "Full name must be at least 2 characters",
          code: z.ZodIssueCode.custom,
        });
      }
         if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          path: ["confirmPassword"],
          message: "Passwords do not match",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

export type AuthFormValues = z.infer<typeof authSchema>;