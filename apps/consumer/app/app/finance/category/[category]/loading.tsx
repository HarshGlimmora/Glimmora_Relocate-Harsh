export default function FinanceCategoryLoading() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="mb-3 h-3 w-32 animate-pulse rounded bg-ink-100" />
      <div className="mb-2 h-9 w-2/3 animate-pulse rounded bg-ink-100" />
      <div className="mb-8 h-4 w-3/4 animate-pulse rounded bg-ink-100" />

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[112px] animate-pulse rounded-2xl bg-white border border-ink-200" />
        ))}
      </div>

      <div className="mb-6 h-[300px] animate-pulse rounded-2xl bg-white border border-ink-200" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-[280px] animate-pulse rounded-2xl bg-white border border-ink-200" />
        <div className="h-[280px] animate-pulse rounded-2xl bg-white border border-ink-200" />
      </div>

      <p className="mt-6 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500">
        Generating your category deep-dive…
      </p>
    </div>
  );
}
