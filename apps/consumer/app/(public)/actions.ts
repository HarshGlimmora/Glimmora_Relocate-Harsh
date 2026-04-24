"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { randomBytes } from "crypto";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { signInSchema, signUpSchema, forgotPasswordSchema } from "@/lib/validations";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: (formData.get("email") as string | null)?.toLowerCase().trim() ?? "",
    password: (formData.get("password") as string | null) ?? "",
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check your email and password.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { ok: false, error: "Email or password is incorrect." };
      }
      return { ok: false, error: "Could not sign you in right now. Please try again." };
    }
    throw error;
  }
}

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: ((formData.get("name") as string | null) ?? "").trim(),
    email: ((formData.get("email") as string | null) ?? "").toLowerCase().trim(),
    password: (formData.get("password") as string | null) ?? "",
    confirmPassword: (formData.get("confirmPassword") as string | null) ?? "",
    mode: ((formData.get("mode") as string | null) ?? "INDIVIDUAL") as
      | "INDIVIDUAL"
      | "FAMILY"
      | "STUDENT",
    acceptTerms: formData.get("acceptTerms") === "on",
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, mode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error: "An account with this email already exists. Try signing in instead.",
      fieldErrors: { email: ["Account already exists"] },
    };
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      name,
      mode,
      profile: {
        create: {
          displayName: name,
        },
      },
      twin: {
        create: {
          stage: "exploring",
        },
      },
      preferences: { create: {} },
      subscription: { create: { tier: "FREE" } },
    },
  });

  // Auto sign-in after signup
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    // if auto-login fails, user can still sign in manually
  }

  return { ok: true, message: "Welcome to Glimmora." };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: ((formData.get("email") as string | null) ?? "").toLowerCase().trim(),
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Enter a valid email address.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email } = parsed.data;

  // Always return success to avoid leaking whether an email exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    });

    // In production, send email with link like /reset-password?token=...
    // For local dev, we log the link
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[password reset] ${email} → http://localhost:3000/reset-password?token=${token}`,
      );
    }
  }

  return {
    ok: true,
    message: "If that email is registered, we've sent reset instructions.",
  };
}
