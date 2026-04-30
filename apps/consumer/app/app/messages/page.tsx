import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles, Send, Paperclip, Plus, Zap, Check } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, mode: true, relocation: { select: { destCity: true, employerName: true } } },
  });
  if (!user) {
    redirect("/sign-in");
  }
  if (!user.relocation) {
    redirect("/onboarding");
  }

  const first = user.name?.split(" ")[0] ?? user.email.split("@")[0] ?? "there";
  const initials = (user.name ?? user.email).split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const isStudent = user.mode === "STUDENT";
  const isFamily = user.mode === "FAMILY";
  const cityName = user.relocation.destCity;
  const orgName = user.relocation.employerName;

  // Mode-aware suggestion seeds — user sees prompts that match their journey
  const suggestions = isStudent
    ? [
        `Walk me through ${cityName ?? "my"} student visa documents`,
        "How do I open a blocked account?",
        "Find student housing options",
        `What does enrolment at ${orgName ?? "my university"} involve?`,
      ]
    : isFamily
    ? [
        "How do spouse permits work in my route?",
        `International schools near ${cityName ?? "my destination"}`,
        "Apostille for marriage and birth certificates",
        "Family-sized housing search",
      ]
    : [
        `Walk me through ${cityName ?? "my"} visa documents`,
        `Open a bank account in ${cityName ?? "my destination"}`,
        "Apartment search — where to start?",
        `What does my first month in ${cityName ?? "the city"} look like?`,
      ];

  const planPreviewItems = isStudent
    ? [
        "Pull student visa requirements for your route",
        "Sketch blocked account / proof-of-funds steps",
        "Document checklist tuned for the consulate",
        "Pre-arrival timeline to semester start",
      ]
    : isFamily
    ? [
        "Spouse permit + family reunion sequence",
        "School enrolment timeline",
        "Document checklist for the whole household",
        "Family-sized housing leads",
      ]
    : [
        "Pull visa-eligible roles for your passport",
        "Run financial simulation for the corridor",
        "Sketch document checklist",
        "Draft pre-arrival timeline",
      ];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Messages</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          The Copilot is here.
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-600">
          Live chat, plan generation, and document AI arrive soon — what you see below is a preview.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Thread list */}
        <aside className="space-y-3">
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Live conversation arrives with the Copilot launch."
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-200 bg-white/60 text-[13.5px] font-medium text-ink-500 cursor-not-allowed"
          >
            <Plus className="h-4 w-4" /> New conversation
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-500 font-medium">
              Coming soon
            </span>
          </button>
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Preview</p>
          <div className="rounded-xl border border-ink-900 bg-ink-900 p-3 text-parchment">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">Welcome conversation</p>
                <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.22em] text-gilt-300">Preview</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-ink-300 bg-parchment/60 p-4">
            <p className="text-[12.5px] leading-relaxed text-ink-500">
              Partner chats appear here once you book a service.
            </p>
          </div>
        </aside>

        {/* Chat */}
        <section className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-100 bg-parchment/40 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-parchment">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-sans text-[15px] font-semibold text-ink-900">Glimmora Copilot</p>
                <p className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                  Preview · live chat coming soon
                </p>
              </div>
            </div>
            <span className="rounded-full border border-gilt-200 bg-gilt-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800">
              Preview
            </span>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">
            <div className="space-y-6">
              {/* Copilot greeting */}
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-parchment">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="max-w-2xl">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Copilot · Preview</p>
                  <div className="rounded-2xl rounded-tl-sm bg-ink-50 border border-ink-100 px-4 py-3 text-[14px] leading-relaxed text-ink-800">
                    Welcome, {first}. When the Copilot ships, it will know your move at{" "}
                    <strong className="font-semibold text-ink-900">{orgName ?? "your destination"}</strong>
                    {cityName ? <> in <strong className="font-semibold text-ink-900">{cityName}</strong></> : null}{" "}
                    and answer questions grounded in your plan, documents, and timeline.
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled
                        aria-disabled="true"
                        title="Live conversation arrives with the Copilot launch."
                        className="rounded-full border border-dashed border-ink-200 bg-white/60 px-3.5 py-1.5 text-[12.5px] text-ink-500 cursor-not-allowed"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample completion preview */}
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gilt-100 text-gilt-700">
                  <Zap className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <div className="max-w-2xl">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Sample · Preview</p>
                  <div className="rounded-2xl rounded-tl-sm border border-gilt-200 bg-gilt-50 px-4 py-3 text-[14px] leading-relaxed text-ink-900">
                    On launch, the Copilot can draft personalised plans like:
                    <div className="mt-3 space-y-1.5">
                      {planPreviewItems.map((x) => (
                        <div
                          key={x}
                          className="flex items-center gap-2 rounded-lg bg-white border border-gilt-200/60 px-3 py-1.5 text-[12.5px] text-ink-800"
                        >
                          <Check className="h-3 w-3 text-lagoon-600" strokeWidth={2.5} />
                          {x}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Composer (disabled preview) */}
          <div className="border-t border-ink-100 bg-parchment/40 px-4 py-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/60 px-2 py-1">
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Attachments arrive with the Copilot launch."
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 cursor-not-allowed"
                aria-label="Attach"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                disabled
                className="flex-1 bg-transparent px-2 py-2 text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none cursor-not-allowed"
                placeholder="Coming soon — live conversation"
              />
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Live conversation arrives with the Copilot launch."
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink-200 text-ink-500 cursor-not-allowed"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-400 font-medium">
              Live conversation coming soon · this is a preview of what will be here
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
