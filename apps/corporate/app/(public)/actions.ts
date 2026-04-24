"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: ((formData.get("email") as string | null) ?? "").toLowerCase().trim(),
    password: (formData.get("password") as string | null) ?? "",
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Check your email and password." };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") return { ok: false, error: "Email or password is incorrect." };
      return { ok: false, error: "Could not sign you in right now." };
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
