"use client";

/**
 * Interactive Daily-life grid.
 *
 * Adds:
 *   • Category filter chips derived from the inferred icon category
 *     for each topic.
 *   • A search input that matches against topic + note text.
 *   • A "Saved" star toggle per item (local UI state).
 *   • A "Surprise me" pill that randomly highlights one card —
 *     useful when there are many.
 */

import * as React from "react";
import {
  Coffee,
  Bus,
  ShoppingCart,
  Users,
  Hospital,
  Home,
  CalendarDays,
  Banknote,
  Smartphone,
  Sparkles,
  Search,
  Shuffle,
  Star,
} from "lucide-react";
import type { CultureDetail } from "@/lib/backend/types";
import { SectionLabel } from "./visual-cards";

type CategoryId =
  | "food"
  | "transport"
  | "shopping"
  | "social"
  | "health"
  | "home"
  | "calendar"
  | "money"
  | "telecom"
  | "other";

const CATEGORIES: Record<CategoryId, { label: string; icon: React.ReactNode }> = {
  food: { label: "Food", icon: <Coffee className="h-3.5 w-3.5" /> },
  transport: { label: "Transport", icon: <Bus className="h-3.5 w-3.5" /> },
  shopping: { label: "Shopping", icon: <ShoppingCart className="h-3.5 w-3.5" /> },
  social: { label: "Social", icon: <Users className="h-3.5 w-3.5" /> },
  health: { label: "Health", icon: <Hospital className="h-3.5 w-3.5" /> },
  home: { label: "Home", icon: <Home className="h-3.5 w-3.5" /> },
  calendar: { label: "Calendar", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  money: { label: "Money", icon: <Banknote className="h-3.5 w-3.5" /> },
  telecom: { label: "Telecom", icon: <Smartphone className="h-3.5 w-3.5" /> },
  other: { label: "Other", icon: <Sparkles className="h-3.5 w-3.5" /> },
};

function categorize(topic: string): CategoryId {
  const t = (topic ?? "").toLowerCase();
  if (/(food|eat|cuisine|coffee|cafe|restaurant|breakfast|lunch|dinner|drink)/.test(t)) return "food";
  if (/(transport|commute|metro|train|bus|car|driving|cycle|bike)/.test(t)) return "transport";
  if (/(shop|grocer|market|store)/.test(t)) return "shopping";
  if (/(social|network|friend|community|neighbour|local)/.test(t)) return "social";
  if (/(health|hospital|clinic|doctor|medical|pharma|insurance)/.test(t)) return "health";
  if (/(home|housing|apartment|rent|landlord|utilities)/.test(t)) return "home";
  if (/(holiday|public|calendar|event|weekend|festival)/.test(t)) return "calendar";
  if (/(money|tax|bank|currency|payment|cash|card)/.test(t)) return "money";
  if (/(phone|sim|internet|mobile|app|telecom|wifi)/.test(t)) return "telecom";
  return "other";
}

const CATEGORY_TONE: Record<CategoryId, { iconWrap: string; iconColor: string; chip: string }> = {
  food:      { iconWrap: "bg-gilt-100",    iconColor: "text-gilt-700",    chip: "bg-gilt-100 text-gilt-800" },
  transport: { iconWrap: "bg-lagoon-100",  iconColor: "text-lagoon-700",  chip: "bg-lagoon-100 text-lagoon-800" },
  shopping:  { iconWrap: "bg-success-100", iconColor: "text-success-700", chip: "bg-success-100 text-success-800" },
  social:    { iconWrap: "bg-lagoon-100",  iconColor: "text-lagoon-700",  chip: "bg-lagoon-100 text-lagoon-800" },
  health:    { iconWrap: "bg-danger-100",  iconColor: "text-danger-700",  chip: "bg-danger-100 text-danger-800" },
  home:      { iconWrap: "bg-parchment",   iconColor: "text-ink-700",     chip: "bg-ink-100 text-ink-700" },
  calendar:  { iconWrap: "bg-gilt-100",    iconColor: "text-gilt-700",    chip: "bg-gilt-100 text-gilt-800" },
  money:     { iconWrap: "bg-success-100", iconColor: "text-success-700", chip: "bg-success-100 text-success-800" },
  telecom:   { iconWrap: "bg-lagoon-100",  iconColor: "text-lagoon-700",  chip: "bg-lagoon-100 text-lagoon-800" },
  other:     { iconWrap: "bg-ink-100",     iconColor: "text-ink-700",     chip: "bg-ink-100 text-ink-700" },
};

export function DailyLifeGrid({
  items,
}: {
  items: CultureDetail["daily_life"];
}) {
  const [activeCat, setActiveCat] = React.useState<CategoryId | null>(null);
  const [query, setQuery] = React.useState("");
  const [saved, setSaved] = React.useState<Set<number>>(() => new Set());
  const [highlightedIdx, setHighlightedIdx] = React.useState<number | null>(null);

  const categorized = React.useMemo(
    () => (items ?? []).map((d, i) => ({ d, i, cat: categorize(d.topic) })),
    [items],
  );

  const counts = React.useMemo(() => {
    const c: Partial<Record<CategoryId, number>> = {};
    for (const { cat } of categorized) c[cat] = (c[cat] ?? 0) + 1;
    return c;
  }, [categorized]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return categorized.filter(({ d, cat }) => {
      if (activeCat && cat !== activeCat) return false;
      if (!q) return true;
      return (
        d.topic.toLowerCase().includes(q) || d.note.toLowerCase().includes(q)
      );
    });
  }, [categorized, activeCat, query]);

  if (!items?.length) return null;

  function toggleSave(i: number) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function surprise() {
    if (visible.length === 0) return;
    const pick = visible[Math.floor(Math.random() * visible.length)].i;
    setHighlightedIdx(pick);
    // Briefly flash the highlight, then clear so a second click can re-trigger.
    window.setTimeout(() => setHighlightedIdx((cur) => (cur === pick ? null : cur)), 1800);
  }

  // Categories present in the data, ordered consistently
  const presentCategories = (Object.keys(CATEGORIES) as CategoryId[]).filter((c) => counts[c]);

  return (
    <section data-daily-life>
      <SectionLabel>Daily life · the small things that surprise newcomers</SectionLabel>

      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        {/* ============ Search + category filter chips + surprise ============ */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex-1 min-w-[180px]">
            <span className="sr-only">Search daily-life topics</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, notes…"
              data-daily-search
              className="h-8 w-full rounded-full border border-ink-200 bg-white pl-8 pr-3 text-[12.5px] text-ink-800 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={surprise}
            data-daily-surprise
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 hover:border-ink-400"
          >
            <Shuffle className="h-3 w-3" />
            Surprise me
          </button>
        </div>

        {/* Category chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
            Filter
          </span>
          <CategoryChip
            active={activeCat === null}
            onClick={() => setActiveCat(null)}
            label={`All (${items.length})`}
          />
          {presentCategories.map((cat) => {
            const meta = CATEGORIES[cat];
            const tone = CATEGORY_TONE[cat];
            const active = activeCat === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(active ? null : cat)}
                data-category={cat}
                data-category-active={active ? "true" : "false"}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors " +
                  (active
                    ? "border-ink-900 bg-ink-900 text-parchment"
                    : "border-ink-200 bg-white text-ink-700 hover:border-ink-400")
                }
              >
                {meta.icon}
                {meta.label}
                <span className={"rounded-full px-1.5 py-0 font-mono text-[9.5px] tabular-nums " + (active ? "bg-white/15 text-parchment" : tone.chip)}>
                  {counts[cat]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ============ Cards ============ */}
        {visible.length === 0 ? (
          <p
            data-daily-life-empty
            className="mt-4 rounded-xl border border-dashed border-ink-200 p-3 text-[12.5px] text-ink-500"
          >
            No topics match this filter. Try clearing the search or picking a different category.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ d, i, cat }) => {
              const tone = CATEGORY_TONE[cat];
              const meta = CATEGORIES[cat];
              const isSaved = saved.has(i);
              const isHighlighted = highlightedIdx === i;
              return (
                <li
                  key={i}
                  data-daily-life={d.topic}
                  data-category={cat}
                  data-saved={isSaved ? "true" : "false"}
                  className={
                    "group relative flex items-start gap-3 rounded-2xl border p-3 transition-all " +
                    (isHighlighted
                      ? "scale-[1.02] border-gilt-400 bg-gilt-50/60 shadow-md"
                      : isSaved
                      ? "border-gilt-200 bg-gilt-50/40"
                      : "border-ink-200 bg-white hover:-translate-y-0.5 hover:shadow-sm")
                  }
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.iconWrap} ${tone.iconColor}`}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1 pr-7">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                      {d.topic}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-[1.5] text-ink-800">{d.note}</p>
                  </div>
                  {/* Save star */}
                  <button
                    type="button"
                    onClick={() => toggleSave(i)}
                    aria-pressed={isSaved}
                    aria-label={`${isSaved ? "Unsave" : "Save"} ${d.topic}`}
                    data-daily-save={i}
                    className={
                      "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition-all " +
                      (isSaved
                        ? "bg-gilt-500 text-white shadow-sm hover:bg-gilt-600"
                        : "text-ink-300 hover:bg-ink-50 hover:text-gilt-600")
                    }
                  >
                    <Star
                      className={"h-3 w-3 " + (isSaved ? "fill-current" : "")}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Saved counter strip */}
        {saved.size > 0 ? (
          <div className="mt-3 flex items-center gap-2 rounded-full bg-gilt-50/60 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-gilt-800">
            <Star className="h-3 w-3 fill-current" />
            {saved.size} saved · these stay highlighted as you browse
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-filter-active={active ? "true" : "false"}
      className={
        "rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors " +
        (active
          ? "border-ink-900 bg-ink-900 text-parchment"
          : "border-ink-200 bg-white text-ink-700 hover:border-ink-400")
      }
    >
      {label}
    </button>
  );
}
