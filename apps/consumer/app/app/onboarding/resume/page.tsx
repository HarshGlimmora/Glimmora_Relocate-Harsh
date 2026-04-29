import type { Metadata } from "next";
import { ensureBackendSession } from "@/lib/backend/session";
import { ResumeUploadCard } from "./resume-upload-card";

export const metadata: Metadata = { title: "Upload resume" };

export const dynamic = "force-dynamic";

export default async function ResumeUploadPage() {
  // Ensures the user has a backend session + case.
  await ensureBackendSession();
  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      <header className="mb-6">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">Step 1 of 2</p>
        <h1 className="mt-3 font-sans text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em] text-ink-900">
          Upload your resume.
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-ink-600">
          PDF or DOCX. Glimmora extracts your role, seniority, years of
          experience, and skills, then asks you to confirm before running
          the analyses.
        </p>
      </header>

      <ResumeUploadCard />
    </div>
  );
}
