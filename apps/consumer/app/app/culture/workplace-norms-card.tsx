"use client";

/**
 * Interactive Workplace Norms card.
 *
 * Each norm is a clickable accordion row that expands in place to
 * reveal the full value plus a heuristic "intensity" dot strip
 * derived from the wording. A master toggle expands or collapses
 * everything at once. Hover lifts each row.
 */

import * as React from "react";
import {
  Compass,
  Users,
  CalendarDays,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import type { CultureDetail } from "@/lib/backend/types";
import { SectionLabel } from "./visual-cards";

interface NormRow {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}

// Heuristic intensity 1–5 based on keyword cues in the value text.
// Lets us draw a 5-dot strip without inventing data the backend didn't send.
function intensityFor(value: string): number {
  const v = value.toLowerCase();
  if (/(extremely|very strong|highly|strict|formal|hierarchical|punctual|direct|explicit|always)/.test(v)) return 5;
  if (/(strong|generally|expected|typical|important|prefer)/.test(v)) return 4;
  if (/(moderate|some|mostly|often|usually)/.test(v)) return 3;
  if (/(loose|informal|casual|flexible|relaxed|sometimes|occasional)/.test(v)) return 2;
  if (/(rare|minimal|low|none|no )/.test(v)) return 1;
  return 3;
}

function intensityLabel(n: number): string {
  return ["Loose", "Loose", "Moderate", "Strong", "Very strong", "Very strong"][n] ?? "Moderate";
}

export function WorkplaceNormsCard({
  norms,
}: {
  norms: CultureDetail["workplace_norms"];
}) {
  const rows = React.useMemo<NormRow[]>(() => {
    const r: NormRow[] = [];
    if (norms.communication_style)
      r.push({ key: "communication", label: "Communication style", value: norms.communication_style, icon: <Compass className="h-4 w-4" /> });
    if (norms.hierarchy_note)
      r.push({ key: "hierarchy", label: "Hierarchy", value: norms.hierarchy_note, icon: <Users className="h-4 w-4" /> });
    if (norms.meeting_etiquette)
      r.push({ key: "meeting", label: "Meeting etiquette", value: norms.meeting_etiquette, icon: <CalendarDays className="h-4 w-4" /> });
    if (norms.dress_code)
      r.push({ key: "dress", label: "Dress code", value: norms.dress_code, icon: <Sparkles className="h-4 w-4" /> });
    if (norms.punctuality)
      r.push({ key: "punctuality", label: "Punctuality", value: norms.punctuality, icon: <CalendarDays className="h-4 w-4" /> });
    if (norms.feedback_culture)
      r.push({ key: "feedback", label: "Feedback culture", value: norms.feedback_culture, icon: <Sparkles className="h-4 w-4" /> });
    return r;
  }, [norms]);

  const [open, setOpen] = React.useState<Set<string>>(() => new Set(rows[0] ? [rows[0].key] : []));

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (open.size === rows.length) setOpen(new Set());
    else setOpen(new Set(rows.map((r) => r.key)));
  }

  const allOpen = open.size === rows.length;

  return (
    <section data-workplace-norms>
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionLabel>Workplace norms · click any dimension to dig in</SectionLabel>
        <button
          type="button"
          onClick={toggleAll}
          data-norms-toggle-all
          className="rounded-full border border-ink-200 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
        >
          {allOpen ? "Collapse all ↑" : "Expand all ↓"}
        </button>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => {
          const isOpen = open.has(r.key);
          const intensity = intensityFor(r.value);
          return (
            <li
              key={r.key}
              data-norm={r.key}
              data-norm-open={isOpen ? "true" : "false"}
              className={
                "rounded-2xl border bg-white transition-all " +
                (isOpen ? "border-lagoon-300 shadow-sm" : "border-ink-200 hover:border-ink-400")
              }
            >
              <button
                type="button"
                onClick={() => toggle(r.key)}
                aria-expanded={isOpen}
                data-norm-toggle={r.key}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span
                  aria-hidden="true"
                  className={
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors " +
                    (isOpen ? "bg-lagoon-100 text-lagoon-700" : "bg-parchment text-ink-700")
                  }
                >
                  {r.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                    {r.label}
                  </p>
                  <p
                    className={
                      "mt-0.5 text-[13px] font-medium text-ink-900 " +
                      (isOpen ? "" : "line-clamp-1")
                    }
                  >
                    {r.value}
                  </p>
                </div>
                {/* Intensity dot strip */}
                <div className="hidden items-center gap-1 sm:flex" aria-label={`Intensity: ${intensityLabel(intensity)}`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      data-intensity-dot={n}
                      className={
                        "h-1.5 rounded-full transition-all " +
                        (n <= intensity
                          ? "w-3 bg-lagoon-500"
                          : "w-1.5 bg-ink-100")
                      }
                    />
                  ))}
                </div>
                <ChevronDown
                  aria-hidden="true"
                  className={
                    "h-4 w-4 text-ink-500 transition-transform " +
                    (isOpen ? "rotate-180" : "")
                  }
                />
              </button>

              {isOpen ? (
                <div
                  data-norm-detail={r.key}
                  className="border-t border-lagoon-100 bg-lagoon-50/30 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-lagoon-700">
                      Intensity
                    </span>
                    <span className="rounded-full bg-lagoon-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-lagoon-800">
                      {intensityLabel(intensity)}
                    </span>
                    <span className="ml-auto font-mono text-[9.5px] tabular-nums text-ink-500">
                      {intensity}/5
                    </span>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="bg-gradient-to-r from-lagoon-300 to-lagoon-500 transition-all"
                      style={{ width: `${(intensity / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
