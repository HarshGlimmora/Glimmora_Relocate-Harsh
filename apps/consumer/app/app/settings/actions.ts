"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { preferencesUpdateSchema } from "@/lib/validations";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updatePreferences(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };

  const raw: Record<string, unknown> = {
    emailNotifications: formData.get("emailNotifications") === "on",
    pushNotifications: formData.get("pushNotifications") === "on",
    weeklyDigest: formData.get("weeklyDigest") === "on",
    productUpdates: formData.get("productUpdates") === "on",
    marketingEmails: formData.get("marketingEmails") === "on",
    shareWithPartners: formData.get("shareWithPartners") === "on",
    allowFamilyView: formData.get("allowFamilyView") === "on",
    twinShareWithCoach: formData.get("twinShareWithCoach") === "on",
    reduceMotion: formData.get("reduceMotion") === "on",
  };
  const theme = formData.get("theme");
  if (theme) raw.theme = theme;
  const density = formData.get("density");
  if (density) raw.density = density;

  const parsed = preferencesUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some values are invalid.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await prisma.preferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/app/settings");
  return { ok: true, message: "Preferences saved." };
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Za-z]/, "Must contain a letter")
      .regex(/\d/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, error: "User not found." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return {
      ok: false,
      error: "Current password is incorrect.",
      fieldErrors: { currentPassword: ["Incorrect password"] },
    };
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hash },
  });

  return { ok: true, message: "Password updated successfully." };
}

export async function deleteAccount(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };

  const confirm = (formData.get("confirm") as string | null)?.trim();
  if (confirm !== "DELETE") {
    return {
      ok: false,
      error: "Type DELETE in the box to confirm.",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { status: "DELETED", email: `deleted-${session.user.id}@glimmora.local` },
  });

  await signOut({ redirect: false });
  return { ok: true, message: "Your account has been deleted. Signing you out…" };
}
