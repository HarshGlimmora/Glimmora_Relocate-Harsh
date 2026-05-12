"use client";

/**
 * Glimmora Relocation Assistant — floating AI chatbot widget.
 *
 * Renders a small launcher pill in the bottom-right corner of the app.
 * Clicking it opens a soft-shadow chat panel that talks to
 * `POST /api/chatbot/query`. Responses are grounded in the user's real
 * backend analyses (profile, synthesis, visa, finance…) so every reply
 * is personalised, never hard-coded.
 *
 * Visual language follows the project tokens — parchment surface,
 * caramel-700 primary, ink-900 text, ink-200 borders, gilt sparkle
 * accent, warm elev shadows.
 */

import * as React from "react";
import { Mic, MicOff, Minus, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  ts: number;
}

const SUGGESTIONS = [
  "Explain my relocation score",
  "Tell me about my visa options",
  "Cost of living details",
  "What should I do next?",
] as const;

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I'm your relocation assistant. I can walk you through your relocation insights, country fit, visa direction, cost of living, and the next best steps in your journey. What would you like to explore?",
  ts: 0,
};

function nextId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Custom Glimmora chat-compass icon.
 *
 * Speech-bubble silhouette housing a compass needle with a star/sparkle —
 * symbolises AI guidance for cross-border moves. Pure inline SVG so we
 * don't ship raster assets.
 */
function AssistantIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Bubble */}
      <path d="M6.5 7.5h19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H13.5l-5 4.2v-4.2H6.5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z" />
      {/* Compass ring */}
      <circle cx="16" cy="15" r="4.6" />
      {/* Compass needle (N/S) */}
      <path d="M16 11.4 L17.4 15 L16 18.6 L14.6 15 Z" fill="currentColor" stroke="none" />
      {/* Sparkle / N marker */}
      <path d="M22.5 8.2 v1.8 M22.5 12.0 v1.8 M20.6 11.1 h1.8 M23.4 11.1 h1.8" strokeWidth="1.4" />
    </svg>
  );
}

// ---- Speech recognition (Web Speech API) --------------------------------
//
// Wrapped in a hook so the SpeechRecognition instance is created lazily
// (only after the user clicks the mic), keeping the chatbot tree tree-shakeable
// and the API surface contained. Gracefully degrades when unsupported.

type SpeechState = "idle" | "starting" | "listening" | "denied" | "error";

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseSpeechRecognitionOpts {
  onFinalTranscript: (text: string) => void;
  onInterimTranscript: (text: string) => void;
}

function useSpeechRecognition({
  onFinalTranscript,
  onInterimTranscript,
}: UseSpeechRecognitionOpts) {
  const [supported, setSupported] = React.useState(false);
  const [state, setState] = React.useState<SpeechState>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const recRef = React.useRef<SpeechRecognitionLike | null>(null);
  // Latest callbacks so the long-lived recogniser always sees fresh closures.
  const finalCb = React.useRef(onFinalTranscript);
  const interimCb = React.useRef(onInterimTranscript);
  React.useEffect(() => {
    finalCb.current = onFinalTranscript;
    interimCb.current = onInterimTranscript;
  }, [onFinalTranscript, onInterimTranscript]);

  React.useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  const stop = React.useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      /* ignore — stop is best-effort */
    }
  }, []);

  const start = React.useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setState("error");
      setErrorMsg("Voice input isn't supported in this browser.");
      return;
    }
    // Surfacing a secure-context hint early helps users who try voice on
    // plain http://* — Chrome silently refuses to start the recogniser there.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setState("error");
      setErrorMsg(
        "Voice input requires a secure (HTTPS) connection. localhost works in dev.",
      );
      return;
    }
    // If an existing instance is already running, stop it first.
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    }
    setErrorMsg(null);
    // Flip to "starting" synchronously so the listening overlay appears
    // the instant the user clicks — before the browser fires `onstart`.
    setState("starting");
    const rec = new Ctor();
    rec.lang =
      typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => setState("listening");
    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      const results = e.results;
      for (let i = 0; i < results.length; i += 1) {
        const r = results[i] as ArrayLike<{ transcript: string }> & { isFinal?: boolean };
        const transcript = r[0]?.transcript ?? "";
        if (r.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) finalCb.current(final.trim());
      else if (interim) interimCb.current(interim);
    };
    rec.onerror = (e) => {
      const code = e?.error || "error";
      if (process.env.NODE_ENV !== "production") {
        console.warn("[chatbot/voice] recognition error:", code);
      }
      if (code === "not-allowed" || code === "service-not-allowed") {
        setState("denied");
        setErrorMsg(
          "Microphone access was blocked. Allow mic permission in your browser settings and try again.",
        );
      } else if (code === "no-speech") {
        setState("idle");
        setErrorMsg("Didn't catch that — try again.");
      } else if (code === "aborted") {
        setState("idle");
      } else if (code === "audio-capture") {
        setState("error");
        setErrorMsg("No microphone detected. Plug one in and retry.");
      } else if (code === "network") {
        setState("error");
        setErrorMsg("Voice service isn't reachable. Check your connection.");
      } else {
        setState("error");
        setErrorMsg("Voice input ran into an issue. Please try again.");
      }
    };
    rec.onend = () => {
      // If we never reached "listening", treat it as a silent failure and
      // surface a hint so the user isn't left wondering.
      setState((s) => {
        if (s === "starting") {
          setErrorMsg((prev) =>
            prev ??
            "Couldn't start the microphone. Check that mic permission is allowed for this site.",
          );
          return "idle";
        }
        return s === "listening" ? "idle" : s;
      });
      recRef.current = null;
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[chatbot/voice] start() threw:", err);
      }
      setState("error");
      setErrorMsg("Couldn't start the microphone. Please try again.");
      recRef.current = null;
    }
  }, []);

  // Cleanup on unmount.
  React.useEffect(
    () => () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    },
    [],
  );

  return { supported, state, errorMsg, start, stop, clearError: () => setErrorMsg(null) };
}

export function RelocationAssistant() {
  const [open, setOpen] = React.useState(false);
  // `minimized` decouples "panel hidden" from "conversation closed".
  // When true, the launcher shows a subtle "active" indicator so the user
  // knows their chat is parked, not discarded. The X button clears it.
  const [minimized, setMinimized] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = React.useState("");
  // Live (non-final) speech transcript shown in the listening overlay.
  const [interim, setInterim] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const speech = useSpeechRecognition({
    onFinalTranscript: (text) => {
      setInput((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${text}` : text;
      });
      setInterim("");
    },
    onInterimTranscript: (text) => setInterim(text),
  });
  // Show the listening overlay the moment we kick off recognition (state
  // "starting"), not just after `onstart` — eliminates the dead-click feel
  // while the browser is still negotiating mic permission.
  const listening = speech.state === "starting" || speech.state === "listening";
  // Keep a stable ref to `stop` so the auto-cancel effect below doesn't
  // re-run on every render (which previously could cancel a fresh start).
  const speechStopRef = React.useRef(speech.stop);
  speechStopRef.current = speech.stop;

  // Stop voice capture whenever the panel becomes invisible (closed or minimized).
  React.useEffect(() => {
    if (!open && listening) {
      speechStopRef.current();
      setInterim("");
    }
  }, [open, listening]);

  function openPanel() {
    setOpen(true);
    setMinimized(false);
  }

  function minimisePanel() {
    if (listening) {
      speech.stop();
      setInterim("");
    }
    setOpen(false);
    setMinimized(true);
  }

  function closePanel() {
    if (listening) {
      speech.stop();
      setInterim("");
    }
    setOpen(false);
    setMinimized(false);
  }

  function toggleVoice() {
    if (listening) {
      speech.stop();
      setInterim("");
      return;
    }
    speech.clearError();
    speech.start();
  }

  // Auto-scroll to bottom on new messages / loading state.
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Focus the input when the panel opens.
  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ESC to minimize (preserves chat history; launcher shows it's parked).
  // While listening, the first ESC just cancels voice capture.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (listening) {
        speech.stop();
        setInterim("");
        return;
      }
      minimisePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listening]);

  // Abort any in-flight request on unmount.
  React.useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || sending) return;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: value,
      ts: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chatbot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
        signal: controller.signal,
      });

      if (!res.ok) {
        // Surface a graceful fallback to the user rather than a raw error.
        let detail = "I couldn't reach the assistant just now.";
        try {
          const j = (await res.json()) as { error?: string };
          if (j?.error) detail = j.error;
        } catch {
          /* keep default */
        }
        throw new Error(detail);
      }

      const data = (await res.json()) as { reply?: string };
      const reply =
        typeof data.reply === "string" && data.reply.trim().length > 0
          ? data.reply
          : "Sorry, I couldn't process your request right now. Please try again.";

      setMessages((m) => [
        ...m,
        { id: nextId(), role: "assistant", content: reply, ts: Date.now() },
      ]);
    } catch (err) {
      if (controller.signal.aborted) return;
      const detail =
        err instanceof Error
          ? err.message
          : "Sorry, I couldn't process your request right now. Please try again.";
      setError(detail);
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "assistant",
          content:
            "Sorry, I couldn't process your request right now. Please try again in a moment.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <>
      <ChatbotAnimations />
      {/* Launcher — bottom-right floating pill. Hidden when panel is open
          so it doesn't compete with the close button. When the panel was
          minimized, the launcher swaps to "Continue chat" with a success-
          green active dot to signal the conversation is parked. */}
      <button
        type="button"
        aria-label={
          open
            ? "Close relocation assistant"
            : minimized
              ? "Resume relocation assistant"
              : "Open relocation assistant"
        }
        aria-expanded={open}
        onClick={openPanel}
        className={cn(
          "fixed bottom-5 right-5 z-40 group inline-flex items-center gap-2.5 rounded-full pl-3 pr-4 py-2.5",
          "bg-caramel-700 text-parchment shadow-elev-lg ring-1 ring-caramel-800/30",
          "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-caramel-600 hover:shadow-glow-caramel",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-400 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment",
          open && "pointer-events-none opacity-0 scale-90",
        )}
      >
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-parchment/15">
          <AssistantIcon className="h-4 w-4 text-parchment" />
          <span
            className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center"
            aria-hidden="true"
          >
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-pulse-soft rounded-full opacity-80",
                minimized ? "bg-success-400" : "bg-gilt-400",
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                minimized ? "bg-success-300" : "bg-gilt-300",
              )}
            />
          </span>
        </span>
        <span className="text-[13px] font-semibold tracking-tight">
          {minimized ? "Continue chat" : "Ask assistant"}
        </span>
      </button>

      {/* Backdrop (mobile only) — tap to minimize. */}
      <div
        aria-hidden="true"
        onClick={minimisePanel}
        className={cn(
          "fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-[2px] transition-opacity duration-200 sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Relocation Assistant"
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden border border-ink-200 bg-parchment shadow-elev-xl",
          // Mobile: full-width bottom sheet. Desktop: floating panel bottom-right.
          "inset-x-3 bottom-3 h-[78vh] max-h-[640px] rounded-2xl",
          "sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[640px] sm:max-h-[calc(100vh-7rem)] sm:w-[400px]",
          "origin-bottom-right transition-all duration-300 ease-out",
          open
            ? "opacity-100 translate-y-0 scale-100"
            : "pointer-events-none opacity-0 translate-y-3 scale-95",
        )}
      >
        {/* Header */}
        <div className="relative shrink-0 border-b border-ink-200/70 bg-grad-aurora px-4 py-3.5 text-parchment">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-parchment/15 ring-1 ring-parchment/20">
              <AssistantIcon className="h-5 w-5 text-parchment" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-semibold leading-tight">
                Relocation Assistant
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-parchment/75">
                <Sparkles className="h-3 w-3 text-gilt-300" />
                Your AI relocation guide
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Minimize"
                title="Minimize"
                onClick={minimisePanel}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-parchment/85 transition-colors hover:bg-parchment/10 hover:text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-parchment/40"
              >
                <Minus className="h-4 w-4" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                aria-label="Close"
                title="Close"
                onClick={closePanel}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-parchment/85 transition-colors hover:bg-parchment/10 hover:text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-parchment/40"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable conversation */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {sending ? <TypingBubble /> : null}
          </div>

          {/* Quick suggestion chips — only show when conversation is fresh. */}
          {messages.length <= 1 && !sending ? (
            <div className="mt-5">
              <p className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500">
                Try asking
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-800 transition-all hover:-translate-y-0.5 hover:border-caramel-300 hover:text-caramel-700 hover:shadow-elev-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-400"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="shrink-0 border-t border-danger-100 bg-danger-50/70 px-4 py-2 text-[11.5px] text-danger-700">
            {error}
          </div>
        ) : null}

        {speech.errorMsg && !listening ? (
          <div className="shrink-0 border-t border-warning-100 bg-warning-50/70 px-4 py-2 text-[11.5px] text-warning-700">
            {speech.errorMsg}
          </div>
        ) : null}

        {/* Composer */}
        <div className="relative shrink-0 border-t border-ink-200/70 bg-white/70 px-3 py-3 backdrop-blur-sm">
          {/* Listening overlay — covers the composer with pulsing rings,
              interim transcript, and a cancel button. Pure CSS, no extra
              JS bundle cost. */}
          {listening ? (
            <ListeningOverlay
              interim={interim}
              starting={speech.state === "starting"}
              onStop={toggleVoice}
            />
          ) : null}

          <div className="flex items-end gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 transition-colors focus-within:border-caramel-400 focus-within:ring-2 focus-within:ring-caramel-400/20">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={1000}
              placeholder="Ask about visa, finance, your verdict…"
              disabled={sending}
              className="max-h-[120px] min-h-[24px] flex-1 resize-none border-0 bg-transparent p-0 font-sans text-[14px] leading-snug text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
            {speech.supported ? (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={sending}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                aria-pressed={listening}
                title={listening ? "Stop listening" : "Speak your message"}
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-400 focus-visible:ring-offset-1",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  listening
                    ? "bg-danger-500 text-white hover:bg-danger-600"
                    : "bg-ink-100 text-ink-700 hover:bg-ink-200 hover:text-ink-900",
                )}
              >
                {listening ? (
                  <MicOff className="h-3.5 w-3.5" strokeWidth={2.2} />
                ) : (
                  <Mic className="h-3.5 w-3.5" strokeWidth={2.2} />
                )}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || input.trim().length === 0}
              aria-label="Send message"
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                "bg-caramel-700 text-parchment hover:bg-caramel-600",
                "disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-400 focus-visible:ring-offset-1",
              )}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </div>
          <p className="mt-1.5 px-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-400">
            {speech.supported
              ? "Enter to send · Shift+Enter for newline · Mic to speak"
              : "Enter to send · Shift+Enter for newline"}
          </p>
        </div>
      </div>
    </>
  );
}

/**
 * Listening overlay — appears on top of the composer while the Web Speech
 * API is active. Three concentric pulsing rings around a mic icon, the
 * live interim transcript, and a clear stop button. Tap-to-cancel via the
 * red button OR the X.
 */
function ListeningOverlay({
  interim,
  starting,
  onStop,
}: {
  interim: string;
  starting: boolean;
  onStop: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-10 flex items-center gap-3 rounded-t-none border-t border-ink-200/70 bg-parchment/95 px-4 py-3 backdrop-blur-sm animate-fade-in"
    >
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center">
        <span
          className="absolute inline-flex h-full w-full rounded-full bg-danger-500/30 animate-ping"
          style={{ animationDuration: "1.4s" }}
          aria-hidden="true"
        />
        <span
          className="absolute inline-flex h-7 w-7 rounded-full bg-danger-500/40"
          aria-hidden="true"
        />
        <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-danger-500 text-white shadow-elev-sm">
          <Mic className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-900">
          {starting ? "Connecting" : "Listening"}
          <span className="inline-flex gap-0.5">
            <SoundBar delay={0} />
            <SoundBar delay={120} />
            <SoundBar delay={240} />
          </span>
        </p>
        <p className="mt-0.5 truncate text-[12px] italic text-ink-600">
          {starting
            ? "Tap Allow if your browser asks for the microphone…"
            : interim.trim().length > 0
              ? interim
              : "Speak your question…"}
        </p>
      </div>
      <button
        type="button"
        onClick={onStop}
        aria-label="Stop listening"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 text-[12px] font-medium text-ink-800 transition-colors hover:border-danger-300 hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-400"
      >
        <X className="h-3 w-3" strokeWidth={2.4} />
        Stop
      </button>
    </div>
  );
}

function SoundBar({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-3 w-[3px] origin-bottom rounded-full bg-danger-500"
      style={{
        animation: "glmSoundBar 0.9s ease-in-out infinite",
        animationDelay: `${delay}ms`,
        transformOrigin: "50% 100%",
      }}
    />
  );
}

/**
 * One-off keyframe for the listening overlay sound bars. Defined inline
 * (mounted once on first chatbot render) so we don't bloat the global
 * stylesheet for a feature only the chatbot uses.
 */
function ChatbotAnimations() {
  return (
    <style>{`
      @keyframes glmSoundBar {
        0%, 100% { transform: scaleY(0.35); opacity: 0.7; }
        50%      { transform: scaleY(1);    opacity: 1;   }
      }
    `}</style>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex w-full animate-fade-in gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-parchment">
          <AssistantIcon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <div
        className={cn(
          "max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-elev-sm",
          isUser
            ? "rounded-tr-md bg-caramel-700 text-parchment"
            : "rounded-tl-md border border-ink-200 bg-white text-ink-900",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex w-full animate-fade-in gap-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-parchment">
        <AssistantIcon className="h-3.5 w-3.5" />
      </span>
      <div className="rounded-2xl rounded-tl-md border border-ink-200 bg-white px-3.5 py-3 shadow-elev-sm">
        <div className="flex items-center gap-1.5">
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse-soft"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
