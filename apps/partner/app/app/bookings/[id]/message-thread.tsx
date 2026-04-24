"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "../actions";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/utils";

type Msg = {
  id: string;
  sender: string;
  author: string;
  body: string;
  createdAt: Date | string;
};

export function MessageThread({
  bookingId,
  messages,
  partnerName,
}: {
  bookingId: string;
  messages: Msg[];
  partnerName: string;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await sendMessage(bookingId, body.trim());
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        toast.error("Could not send", { description: res.error });
      }
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {messages.length === 0 ? (
          <li className="rounded-xl border border-dashed border-ink-200 bg-parchment/40 px-4 py-6 text-center text-[12.5px] text-ink-500">
            No messages yet. Start the conversation with your customer.
          </li>
        ) : messages.map((m) => {
          const mine = m.sender === "PARTNER";
          const system = m.sender === "SYSTEM";
          if (system) {
            return (
              <li key={m.id} className="flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-ink-100 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600">
                  <span>{m.body}</span>
                  <span className="text-ink-400">· {relativeTime(new Date(m.createdAt))}</span>
                </div>
              </li>
            );
          }
          return (
            <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[78%] rounded-2xl px-4 py-3 text-[13.5px] leading-[1.55]",
                mine ? "bg-plum-600 text-white" : "bg-ink-50 text-ink-900 border border-ink-200",
              )}>
                <div className={cn("mb-1 flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.18em]", mine ? "text-plum-200" : "text-ink-500")}>
                  <span>{m.author}</span>
                  <span>·</span>
                  <span>{relativeTime(new Date(m.createdAt))}</span>
                </div>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={onSubmit} className="rounded-2xl border border-ink-200 bg-white p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Reply as ${partnerName}…`}
          rows={2}
          disabled={pending}
          className="w-full resize-y rounded-xl bg-transparent px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between border-t border-ink-100 pt-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Visible to the customer inside their Glimmora plan.
          </p>
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-plum-600 px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-plum-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send</>}
          </button>
        </div>
      </form>
    </div>
  );
}
