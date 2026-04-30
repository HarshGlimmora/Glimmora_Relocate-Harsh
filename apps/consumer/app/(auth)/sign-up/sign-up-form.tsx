"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, User, Users, GraduationCap, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { signUpAction } from "@/app/(public)/actions";

const modes = [
  { value: "INDIVIDUAL", label: "Individual", icon: User,           hint: "On my own" },
  { value: "FAMILY",     label: "Family",     icon: Users,          hint: "Partner or kids" },
  { value: "STUDENT",    label: "Student",    icon: GraduationCap,  hint: "University" },
] as const;

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [mode, setMode] = React.useState<"INDIVIDUAL" | "FAMILY" | "STUDENT">("INDIVIDUAL");
  const [accepted, setAccepted] = React.useState(false);
  const [password, setPassword] = React.useState("");

  const pwdChecks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "Contains a letter",      pass: /[A-Za-z]/.test(password) },
    { label: "Contains a number",      pass: /\d/.test(password) },
  ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("mode", mode);
    if (accepted) formData.set("acceptTerms", "on");
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await signUpAction(formData);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      router.push("/app/onboarding/intent");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Error banner */}
      {error ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-[13px] text-danger-700">
          {error}
        </div>
      ) : null}

      {/* Mode selector — pill group */}
      <div>
        <label className="mono-label mb-2 block">Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                disabled={isPending}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all",
                  active
                    ? "border-ink-900 bg-ink-900 text-parchment shadow-sm"
                    : "border-ink-200 bg-white text-ink-700 hover:border-ink-400"
                )}
                aria-pressed={active}
              >
                <Icon
                  className={cn("h-4 w-4 transition-colors", active ? "text-parchment" : "text-ink-500")}
                  strokeWidth={1.75}
                />
                <span className="text-[13px] font-semibold tracking-tight">{m.label}</span>
                <span className={cn("text-[10px]", active ? "text-parchment/60" : "text-ink-500")}>
                  {m.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name */}
      <Field label="Your name" id="name" error={fieldErrors.name?.[0]}>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="e.g. Priya Menon"
          disabled={isPending}
          className={inputCls(!!fieldErrors.name)}
        />
      </Field>

      {/* Email */}
      <Field label="Email" id="email" error={fieldErrors.email?.[0]}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isPending}
          className={inputCls(!!fieldErrors.email)}
        />
      </Field>

      {/* Password */}
      <Field label="Password" id="password" error={fieldErrors.password?.[0]}>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            disabled={isPending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(inputCls(!!fieldErrors.password), "pr-10")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Strength checklist */}
        {password.length > 0 ? (
          <ul className="mt-2.5 space-y-1">
            {pwdChecks.map((c) => (
              <li
                key={c.label}
                className={cn(
                  "flex items-center gap-2 text-[11.5px]",
                  c.pass ? "text-lagoon-700" : "text-ink-500"
                )}
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 items-center justify-center rounded-full border",
                    c.pass ? "border-lagoon-500 bg-lagoon-500 text-white" : "border-ink-300 bg-white"
                  )}
                >
                  {c.pass ? <Check className="h-2 w-2" strokeWidth={4} /> : null}
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        ) : null}
      </Field>

      {/* Confirm */}
      <Field label="Confirm password" id="confirmPassword" error={fieldErrors.confirmPassword?.[0]}>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          placeholder="Repeat your password"
          disabled={isPending}
          className={inputCls(!!fieldErrors.confirmPassword)}
        />
      </Field>

      {/* Terms */}
      <label className="flex items-start gap-3 pt-1 cursor-pointer">
        <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            disabled={isPending}
            className="peer sr-only"
          />
          <span className="h-4 w-4 rounded-[4px] border border-ink-300 bg-white peer-checked:border-ink-900 peer-checked:bg-ink-900 transition-colors" />
          {accepted ? (
            <Check className="pointer-events-none absolute h-3 w-3 text-parchment" strokeWidth={3.5} />
          ) : null}
        </span>
        <span className="text-[13px] leading-relaxed text-ink-700">
          I agree to Glimmora's{" "}
          <span title="Terms of Service ship with W5." className="font-medium underline underline-offset-2 cursor-not-allowed">Terms of Service</span>{" "}
          and{" "}
          <span title="Privacy Policy ships with W5." className="font-medium underline underline-offset-2 cursor-not-allowed">Privacy Policy</span>.
        </span>
      </label>
      {fieldErrors.acceptTerms ? (
        <p className="-mt-3 text-[11.5px] text-danger-600">{fieldErrors.acceptTerms[0]}</p>
      ) : null}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating your account…
          </>
        ) : (
          <>
            Create my account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}

function inputCls(invalid: boolean) {
  return cn(
    "w-full rounded-xl border bg-white px-4 py-3 text-[14.5px] text-ink-900 placeholder:text-ink-400 shadow-sm transition-all",
    "focus:outline-none focus:ring-4",
    invalid
      ? "border-danger-400 focus:border-danger-500 focus:ring-danger-500/15"
      : "border-ink-200 focus:border-ink-900 focus:ring-ink-900/10",
    "disabled:cursor-not-allowed disabled:opacity-50"
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mono-label mb-1.5 block">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-[11.5px] text-danger-600">{error}</p> : null}
    </div>
  );
}
