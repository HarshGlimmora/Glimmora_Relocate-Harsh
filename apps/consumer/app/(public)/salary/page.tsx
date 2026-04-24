import type { Metadata } from "next";
import { SalarySimulator } from "./simulator";

export const metadata: Metadata = {
  title: "Salary simulator",
  description: "See what a European salary actually means in your life. Tax, rent, cost of living, purchasing-power adjusted.",
};

export default function SalaryPage() {
  return (
    <main>
      <section className="mx-auto max-w-[1280px] px-6 pt-16 pb-10 md:px-10 md:pt-24 md:pb-14">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-500 font-medium">Salary simulator</p>
        <h1 className="mt-4 font-sans text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-900">
          What does €85k <br />actually mean?
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-[1.65] text-ink-700">
          Most offer letters look generous until you check the tax. We strip it back to take-home, and then to what your money actually buys where you're landing.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-24 md:px-10">
        <SalarySimulator />
      </section>
    </main>
  );
}
