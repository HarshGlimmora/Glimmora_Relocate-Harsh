"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/validations";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You are not signed in." };
  }

  const raw = {
    displayName: (formData.get("displayName") as string | null)?.trim() || null,
    headline: (formData.get("headline") as string | null)?.trim() || null,
    bio: (formData.get("bio") as string | null)?.trim() || null,
    currentCountry: ((formData.get("currentCountry") as string | null) ?? "").toUpperCase() || null,
    currentCity: (formData.get("currentCity") as string | null)?.trim() || null,
    nationality: ((formData.get("nationality") as string | null) ?? "").toUpperCase() || null,
    phone: (formData.get("phone") as string | null)?.trim() || null,
  };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the fields below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...parsed.data,
    },
    update: parsed.data,
  });

  // Keep user.name in sync with displayName
  if (parsed.data.displayName) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.displayName },
    });
  }

  revalidatePath("/app/profile");
  revalidatePath("/app");

  return { ok: true, message: "Profile updated." };
}

export async function updateTwin(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You are not signed in." };
  }

  const targetCountriesRaw = (formData.get("targetCountries") as string | null) || "";
  const targetCountries = targetCountriesRaw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length === 2);

  const timelineMonthsRaw = formData.get("timelineMonths");
  const budgetRaw = formData.get("budgetUSD");
  const yearsRaw = formData.get("yearsExperience");

  const data = {
    targetCountries: JSON.stringify(targetCountries),
    profession: ((formData.get("profession") as string | null) ?? "").trim() || null,
    seniorityLevel: ((formData.get("seniorityLevel") as string | null) ?? "").trim() || null,
    timelineMonths: timelineMonthsRaw ? Number(timelineMonthsRaw) : null,
    budgetUSD: budgetRaw ? Number(budgetRaw) : null,
    yearsExperience: yearsRaw ? Number(yearsRaw) : null,
    familySize: Number(formData.get("familySize") ?? 1),
    hasChildren: formData.get("hasChildren") === "on",
    childrenCount: Number(formData.get("childrenCount") ?? 0),
  };

  await prisma.twin.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  // Recalculate readiness — simple heuristic
  const twin = await prisma.twin.findUnique({ where: { userId: session.user.id } });
  if (twin) {
    let score = 0;
    if (twin.profession) score += 15;
    if (twin.yearsExperience) score += 10;
    if (twin.timelineMonths) score += 10;
    if (twin.budgetUSD) score += 10;
    if (twin.targetCountries && twin.targetCountries.length > 2) score += 15;
    if (twin.familySize > 0) score += 5;
    if (twin.seniorityLevel) score += 10;

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    if (profile?.currentCountry) score += 10;
    if (profile?.nationality) score += 10;
    if (profile?.headline) score += 5;

    await prisma.twin.update({
      where: { userId: session.user.id },
      data: { readinessScore: Math.min(100, score) },
    });
  }

  revalidatePath("/app/profile");
  revalidatePath("/app");

  return { ok: true, message: "Your Twin has been updated." };
}
