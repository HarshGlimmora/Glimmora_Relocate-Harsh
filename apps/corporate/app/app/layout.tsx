import { requireCorporateSession } from "@/lib/session";
import { AppShell } from "./_shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organization } = await requireCorporateSession();
  return (
    <AppShell
      user={{ name: user.name, email: user.email, title: user.title }}
      organization={{ id: organization.id, name: organization.name, slug: organization.slug, contractTier: organization.contractTier }}
    >
      {children}
    </AppShell>
  );
}
