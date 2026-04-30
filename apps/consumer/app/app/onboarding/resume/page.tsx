import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensureBackendSession } from "@/lib/backend/session";
import { getIntent } from "@/lib/intent";
import { ResumeUploadCard } from "./resume-upload-card";

export const metadata: Metadata = { title: "Upload resume" };

export const dynamic = "force-dynamic";

export default async function ResumeUploadPage() {
  await ensureBackendSession();
  const intent = await getIntent();
  if (!intent) redirect("/app/onboarding/intent");

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      <header className="mb-6">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">
          Step 2 · Resume
        </p>
        <h1 className="mt-3 font-sans text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em] text-ink-900">
          Turn your resume into a starting profile.
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-ink-600">
          Drop a PDF or DOCX. We pull role, seniority, years, and skills, and
          flag what we couldn't infer — so the next step asks only for what's
          missing, not what's already on the page.
        </p>
        <p className="mt-2 text-[12.5px] text-ink-500">
          Goal: <span className="text-ink-700">{intent.label.toLowerCase()}</span>
        </p>
      </header>

      <ResumeUploadCard />
    </div>
  );
}
