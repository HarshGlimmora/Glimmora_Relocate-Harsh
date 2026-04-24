import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
    title: z.string().max(80).optional().nullable(),
    companyName: z.string().min(2, "Company name is required").max(80),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Must contain at least one letter")
      .regex(/\d/, "Must contain at least one number"),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms to continue" }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const jobSchema = z.object({
  title: z.string().min(2, "Title is required").max(120),
  department: z.string().max(80).optional().nullable(),
  location: z.string().max(80).optional().nullable(),
  remote: z.enum(["on-site", "hybrid", "remote"]).optional().nullable(),
  seniority: z.enum(["junior", "mid", "senior", "staff", "principal"]).optional().nullable(),
  employmentType: z.enum(["full_time", "part_time", "contract"]).optional().nullable(),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  currency: z.string().length(3).default("EUR"),
  description: z.string().max(5000).optional().nullable(),
  requirements: z.string().max(5000).optional().nullable(),
  visaSponsorship: z.boolean().default(true),
  eligiblePassports: z.array(z.string().length(2)).max(50).default([]),
  visaTier: z.string().max(80).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).default("DRAFT"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type JobInput = z.infer<typeof jobSchema>;
