import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { DiscoverDestination } from "./discover-destination";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      mode: true,
      relocation: { select: { destCity: true, destCountry: true } },
    },
  });

  // Defensive: app/layout.tsx redirects no-relocation users to /onboarding,
  // but if anyone reaches this page without one, send them there too.
  if (!user?.relocation) {
    redirect("/onboarding");
  }

  const mode = (user.mode as "INDIVIDUAL" | "FAMILY" | "STUDENT" | undefined) ?? "INDIVIDUAL";

  return (
    <DiscoverDestination
      destCity={user.relocation.destCity}
      destCountry={user.relocation.destCountry}
      mode={mode}
    />
  );
}
