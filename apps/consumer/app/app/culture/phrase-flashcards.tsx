"use client";

/**
 * Interactive phrase flashcards.
 *
 * Beyond the basic flip behaviour, adds:
 *   • Practice mode toggle — flips the deck so the translation shows
 *     first and the user has to recall the target-language phrase.
 *   • "I know this" mark per card — with a learned-counter and a
 *     master "Reset learned" pill.
 *   • A learned-progress strip at the top.
 *   • Reveal-all / Hide-all toggle (carried over).
 *   • Navigator dot strip — shows active card; learned cards turn
 *     gold.
 *
 * Local UI state only. Nothing is sent to the backend.
 */

import * as React from "react";
import { Star, GraduationCap, RotateCcw } from "lucide-react";
import type { BasicPhrase } from "@/lib/backend/types";
import { SectionLabel } from "./visual-cards";

export function PhraseFlashcards({ phrases }: { phrases: BasicPhrase[] }) {
  const [flipped, setFlipped] = React.useState<Set<number>>(() => new Set());
  const [learned, setLearned] = React.useState<Set<number>>(() => new Set());
  const [practice, setPractice] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);

  if (!phrases.length) return null;

  function toggleFlip(i: number) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleLearned(i: number) {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function flipAll() {
    if (flipped.size === phrases.length) setFlipped(new Set());
    else setFlipped(new Set(phrases.map((_, i) => i)));
  }

  function togglePractice() {
    setPractice((p) => !p);
    setFlipped(new Set()); // start fresh when switching modes
  }

  function resetLearned() {
    setLearned(new Set());
  }

  const learnedPct = Math.round((learned.size / phrases.length) * 100);

  return (
    <section data-phrase-flashcards>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>Basic phrases · click to flip, mark what you know</SectionLabel>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={togglePractice}
            aria-pressed={practice}
            data-practice-mode={practice ? "true" : "false"}
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors " +
              (practice
                ? "border-gilt-300 bg-gilt-50 text-gilt-800"
                : "border-ink-200 text-ink-700 hover:border-ink-400")
            }
          >
            <GraduationCap className="h-3.5 w-3.5" />
            {practice ? "Practice mode · ON" : "Practice mode"}
          </button>
          <button
            type="button"
            onClick={flipAll}
            data-flashcard-flip-all
            className="rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
          >
            {flipped.size === phrases.length ? "Hide all ↑" : "Reveal all ↓"}
          </button>
        </div>
      </div>

      {/* ============ Learned-progress strip ============ */}
      <div
        data-learned-progress
        className="mb-3 flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3"
      >
        <span
          aria-hidden="true"
          className={
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors " +
            (learned.size > 0 ? "bg-gilt-100 text-gilt-700" : "bg-ink-100 text-ink-500")
          }
        >
          <Star className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Learned · {learned.size} of {phrases.length} marked
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className={
                "h-full transition-[width] duration-300 " +
                (learnedPct === 100 ? "bg-success-500" : "bg-gilt-500")
              }
              style={{ width: `${learnedPct}%` }}
            />
          </div>
        </div>
        {learned.size > 0 ? (
          <button
            type="button"
            onClick={resetLearned}
            data-flashcard-reset-learned
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        ) : null}
      </div>

      {/* ============ Card grid ============ */}
      <ul className="grid gap-3 md:grid-cols-2">
        {phrases.map((p, i) => {
          const isFlipped = flipped.has(i);
          const isLearned = learned.has(i);
          const isActive = activeIdx === i;

          // In practice mode, swap which side is "front" (translation up first).
          const showOriginalSide = practice ? isFlipped : !isFlipped;
          const headline = showOriginalSide ? p.phrase : p.translation;
          const sideLabel = showOriginalSide ? "Phrase" : "Translation";

          return (
            <li
              key={i}
              data-flashcard={i}
              data-flipped={isFlipped ? "true" : "false"}
              data-learned={isLearned ? "true" : "false"}
              className="relative"
            >
              <button
                type="button"
                onClick={() => {
                  toggleFlip(i);
                  setActiveIdx(i);
                }}
                aria-pressed={isFlipped}
                className={
                  "group relative flex w-full min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl border-2 p-4 pr-12 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm " +
                  (isLearned
                    ? "border-gilt-300 bg-gilt-50/40"
                    : isFlipped
                    ? "border-success-300 bg-success-50/40"
                    : "border-ink-300 bg-gradient-to-br from-parchment to-white") +
                  (isActive ? " ring-2 ring-ink-900/10" : "")
                }
              >
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-500">
                      {sideLabel}
                    </p>
                    {practice ? (
                      <span className="rounded-full bg-gilt-100 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gilt-800">
                        Recall
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={
                      "mt-1.5 font-sans text-[16px] font-semibold tracking-[-0.005em] " +
                      (isLearned
                        ? "text-gilt-900"
                        : isFlipped
                        ? "text-success-900"
                        : "text-ink-900")
                    }
                  >
                    {headline}
                  </p>
                </div>
                {isFlipped && p.usage ? (
                  <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700">
                    ✦ {p.usage}
                  </p>
                ) : !isFlipped ? (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                    Click to flip ↻
                  </p>
                ) : null}
              </button>

              {/* "I know this" star — sits absolute over the card so the
                  card's onClick still flips, but star is its own button. */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLearned(i);
                }}
                aria-label={`Mark phrase ${i + 1} as ${isLearned ? "not learned" : "learned"}`}
                aria-pressed={isLearned}
                data-flashcard-learn={i}
                className={
                  "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full transition-all " +
                  (isLearned
                    ? "bg-gilt-500 text-white shadow-sm hover:bg-gilt-600"
                    : "border border-ink-200 bg-white/70 text-ink-400 hover:border-gilt-300 hover:text-gilt-600")
                }
              >
                <Star
                  className={"h-3.5 w-3.5 " + (isLearned ? "fill-current" : "")}
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {/* ============ Navigator dot strip ============ */}
      <div className="mt-3 flex items-center justify-center gap-1">
        {phrases.map((_, i) => (
          <button
            key={i}
            type="button"
            data-flashcard-dot={i}
            onClick={() => setActiveIdx(i)}
            aria-label={`Jump to phrase ${i + 1}`}
            className={
              "h-1.5 rounded-full transition-all " +
              (i === activeIdx
                ? "w-5 bg-ink-900"
                : learned.has(i)
                ? "w-1.5 bg-gilt-500"
                : flipped.has(i)
                ? "w-1.5 bg-success-500"
                : "w-1.5 bg-ink-200")
            }
          />
        ))}
      </div>
    </section>
  );
}
