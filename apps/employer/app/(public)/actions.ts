"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { signInSchema, signUpSchema } from "@/lib/validations";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: ((formData.get("email") as string | null) ?? "").toLowerCase().trim(),
    password: (formData.get("password") as string | null) ?? "",
  };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Check your email and password.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirect: false });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") return { ok: false, error: "Email or password is incorrect." };
      return { ok: false, error: "Could not sign you in right now. Please try again." };
    }
    throw error;
  }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "company";
}

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: ((formData.get("name") as string | null) ?? "").trim(),
    title: ((formData.get("title") as string | null) ?? "").trim() || null,
    companyName: ((formData.get("companyName") as string | null) ?? "").trim(),
    email: ((formData.get("email") as string | null) ?? "").toLowerCase().trim(),
    password: (formData.get("password") as string | null) ?? "",
    confirmPassword: (formData.get("confirmPassword") as string | null) ?? "",
    acceptTerms: formData.get("acceptTerms") === "on",
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { ok: false, error: "An account with this email already exists.", fieldErrors: { email: ["Account already exists"] } };
  }

  const hash = await bcrypt.hash(parsed.data.password, 10);

  // Find unique slug
  let baseSlug = slugify(parsed.data.companyName);
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++attempt}`;
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: hash,
      name: parsed.data.name,
      title: parsed.data.title,
    },
  });

  await prisma.company.create({
    data: {
      name: parsed.data.companyName,
      slug,
      sponsorship: { create: {} },
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirect: false });
  } catch { /* user can sign in manually if this fails */ }

  return { ok: true };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
