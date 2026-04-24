import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password too long")
      .regex(/[A-Za-z]/, "Must contain at least one letter")
      .regex(/\d/, "Must contain at least one number"),
    confirmPassword: z.string(),
    mode: z.enum(["INDIVIDUAL", "FAMILY", "STUDENT"]).default("INDIVIDUAL"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms to continue" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(80).optional().nullable(),
  headline: z.string().max(120).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  currentCountry: z.string().length(2).optional().nullable(),
  currentCity: z.string().max(80).optional().nullable(),
  nationality: z.string().length(2).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
});

export const preferencesUpdateSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  shareWithPartners: z.boolean().optional(),
  allowFamilyView: z.boolean().optional(),
  twinShareWithCoach: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  density: z.enum(["comfortable", "compact"]).optional(),
  reduceMotion: z.boolean().optional(),
});

export const twinUpdateSchema = z.object({
  targetCountries: z.array(z.string().length(2)).max(10).optional(),
  timelineMonths: z.number().int().min(1).max(120).optional().nullable(),
  budgetUSD: z.number().int().min(0).max(10_000_000).optional().nullable(),
  profession: z.string().max(80).optional().nullable(),
  yearsExperience: z.number().int().min(0).max(60).optional().nullable(),
  seniorityLevel: z.string().max(40).optional().nullable(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PreferencesUpdateInput = z.infer<typeof preferencesUpdateSchema>;
export type TwinUpdateInput = z.infer<typeof twinUpdateSchema>;
