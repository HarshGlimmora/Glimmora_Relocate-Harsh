import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensureBackendSession } from "@/lib/backend/session";
import { getIntent } from "@/lib/intent";
import { OnboardingShell } from "../_step-shell";
import { ResumeUploadCard } from "./resume-upload-card";

export const metadata: Metadata = { title: "Upload resume" };
export const dynamic = "force-dynamic";

export default async function ResumeUploadPage() {
  await ensureBackendSession();
  const intent = await getIntent();
  if (!intent) redirect("/app/onboarding/goal");

  return (
    <OnboardingShell
      active="resume"
      title="Turn your resume into a starting profile."
      description="Drop a PDF or DOCX. We pull name, role, seniority, years, skills, certifications, languages, and current employer — and flag what we couldn't, so the next step asks only what's missing."
    >
      <p className="mb-3 text-[12.5px] text-ink-500">
        Goal: <span className="text-ink-700">{intent.label.toLowerCase()}</span>
      </p>
      <ResumeUploadCard />
    </OnboardingShell>
  );
}
