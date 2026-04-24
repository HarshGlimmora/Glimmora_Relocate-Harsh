import type { Metadata } from "next";
import { Sparkles, Send, Paperclip, Plus, Zap, Check } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  const first = user?.name?.split(" ")[0] ?? user?.email.split("@")[0] ?? "there";
  const initials = (user?.name ?? user?.email ?? "").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-10 md:py-14">
      <header className="mb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Messages</p>
        <h1 className="mt-3 font-sans text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          The Copilot is here.
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Thread list */}
        <aside className="space-y-3">
          <button
            type="button"
            disabled
            title="Copilot streaming arrives with W2."
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-[13.5px] font-medium text-ink-500 cursor-not-allowed"
          >
            <Plus className="h-4 w-4" /> New conversation
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-600">W2</span>
          </button>
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Active</p>
          <div className="rounded-xl border border-ink-900 bg-ink-900 p-3 text-parchment">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gilt-400 text-ink-900">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">Welcome conversation</p>
                <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.22em] text-gilt-300">Just now</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-ink-300 bg-parchment/60 p-4">
            <p className="text-[12.5px] leading-relaxed text-ink-500">Partner chats appear here once you book a service.</p>
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
                <p className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-lagoon-700 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-lagoon-500" /> Online · grounded in your Twin
                </p>
              </div>
            </div>
            <span className="rounded-full border border-gilt-200 bg-gilt-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gilt-800">
              Beta
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
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Copilot · Just now</p>
                  <div className="rounded-2xl rounded-tl-sm bg-ink-50 border border-ink-100 px-4 py-3 text-[14px] leading-relaxed text-ink-800">
                    Welcome, {first}. I've got your Twin draft ready. A few questions will get us to a first plan — or ask me anything first.
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "What countries fit my profile?",
                      "Simulate Bangalore → Berlin salary",
                      "Help me with my CV",
                      "Walk me through documents",
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled
                        title="Copilot streaming arrives with W2."
                        className="rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[12.5px] text-ink-500 cursor-not-allowed"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample completion */}
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gilt-100 text-gilt-700">
                  <Zap className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <div className="max-w-2xl">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">Suggestion</p>
                  <div className="rounded-2xl rounded-tl-sm border border-gilt-200 bg-gilt-50 px-4 py-3 text-[14px] leading-relaxed text-ink-900">
                    I can draft your Berlin relocation plan now — it'll take me about 40 seconds.
                    <div className="mt-3 space-y-1.5">
                      {[
                        "Pull visa-eligible roles (top 10)",
                        "Run financial simulation",
                        "Sketch document checklist",
                        "Draft 9-month timeline",
                      ].map((x) => (
                        <div key={x} className="flex items-center gap-2 rounded-lg bg-white border border-gilt-200/60 px-3 py-1.5 text-[12.5px] text-ink-800">
                          <Check className="h-3 w-3 text-lagoon-600" strokeWidth={2.5} />
                          {x}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        disabled
                        title="Copilot plan generation arrives with W2."
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-medium text-ink-500 cursor-not-allowed"
                      >
                        Generate plan
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-600">W2</span>
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Copilot plan generation arrives with W2."
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 text-[12.5px] font-medium text-ink-500 cursor-not-allowed"
                      >
                        Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty separator */}
              <div className="flex items-center gap-3 py-2">
                <div className="hairline flex-1" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400 font-medium">{first}</span>
                <div className="hairline flex-1" />
              </div>

              {/* Empty user turn */}
              <div className="flex items-start justify-end gap-3">
                <div className="max-w-md">
                  <p className="mb-1.5 text-right font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 font-medium">
                    Your message
                  </p>
                  <div className="rounded-2xl rounded-tr-sm border border-dashed border-ink-300 bg-parchment px-4 py-3 text-[13px] italic text-ink-400">
                    Type below to start…
                  </div>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-parchment">
                  {initials}
                </span>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-ink-100 bg-parchment/40 px-4 py-3">
            <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-2 py-1 opacity-70">
              <button
                type="button"
                disabled
                title="Attachments arrive with W2."
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 cursor-not-allowed"
                aria-label="Attach"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                disabled
                className="flex-1 bg-transparent px-2 py-2 text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none cursor-not-allowed"
                placeholder="Copilot streaming arrives with W2…"
              />
              <button
                type="button"
                disabled
                title="Copilot streaming arrives with W2."
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink-200 text-ink-500 cursor-not-allowed"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-400 font-medium">
              Copilot streaming wires to Anthropic in W2 · UI ready now
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
