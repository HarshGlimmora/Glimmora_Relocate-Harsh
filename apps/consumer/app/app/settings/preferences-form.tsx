"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { updatePreferences } from "./actions";

interface Initial {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
  marketingEmails: boolean;
  shareWithPartners: boolean;
  allowFamilyView: boolean;
  twinShareWithCoach: boolean;
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
}

function Row({
  title,
  description,
  name,
  defaultChecked,
}: {
  title: string;
  description: string;
  name: string;
  defaultChecked: boolean;
}) {
  const [on, setOn] = React.useState(defaultChecked);
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-ink-900">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{description}</p>
      </div>
      <div className="flex items-center">
        <input type="hidden" name={name} value={on ? "on" : ""} />
        <Switch checked={on} onCheckedChange={setOn} aria-label={title} />
      </div>
    </div>
  );
}

export function PreferencesForm({ initial }: { initial: Initial }) {
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState(initial.theme);
  const [density, setDensity] = React.useState(initial.density);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("theme", theme);
    formData.set("density", density);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updatePreferences(formData);
      if (result.ok) setMessage(result.message ?? "Saved.");
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {message ? (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section>
        <p className="mono-label mb-2">Notifications</p>
        <div className="divide-y divide-ink-200 rounded-lg border border-ink-200 bg-parchment/60 px-5">
          <Row
            title="Email notifications"
            description="Important updates about your plan, documents, and bookings."
            name="emailNotifications"
            defaultChecked={initial.emailNotifications}
          />
          <Row
            title="Push notifications"
            description="Real-time alerts on your phone when a task goes red."
            name="pushNotifications"
            defaultChecked={initial.pushNotifications}
          />
          <Row
            title="Weekly digest"
            description="A curated summary every Monday morning."
            name="weeklyDigest"
            defaultChecked={initial.weeklyDigest}
          />
          <Row
            title="Product updates"
            description="Tell me when a new feature ships."
            name="productUpdates"
            defaultChecked={initial.productUpdates}
          />
          <Row
            title="Marketing emails"
            description="Occasional stories from other Glimmora members."
            name="marketingEmails"
            defaultChecked={initial.marketingEmails}
          />
        </div>
      </section>

      <section>
        <p className="mono-label mb-2">Privacy</p>
        <div className="divide-y divide-ink-200 rounded-lg border border-ink-200 bg-parchment/60 px-5">
          <Row
            title="Share with partners"
            description="Let verified partners see the context they need to serve you (apartment match, school match, etc.)."
            name="shareWithPartners"
            defaultChecked={initial.shareWithPartners}
          />
          <Row
            title="Allow family view"
            description="Let linked family members see your shared plan."
            name="allowFamilyView"
            defaultChecked={initial.allowFamilyView}
          />
          <Row
            title="Share Twin with Verified Coaches"
            description="Only applies when you opt in to the premium Human Expert tier."
            name="twinShareWithCoach"
            defaultChecked={initial.twinShareWithCoach}
          />
        </div>
      </section>

      <section>
        <p className="mono-label mb-2">Appearance</p>
        <div className="rounded-lg border border-ink-200 bg-parchment/60 p-5 space-y-5">
          <div>
            <p className="mb-2 text-[14px] font-medium text-ink-900">Theme</p>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={cn(
                    "rounded-md border px-3.5 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                    theme === t
                      ? "border-midnight-500 bg-midnight-50 text-midnight-700"
                      : "border-ink-200 bg-white text-ink-700 hover:border-ink-300",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-500">Dark mode ships later — preference is saved.</p>
          </div>

          <div>
            <p className="mb-2 text-[14px] font-medium text-ink-900">Density</p>
            <div className="flex gap-2">
              {(["comfortable", "compact"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={cn(
                    "rounded-md border px-3.5 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                    density === d
                      ? "border-midnight-500 bg-midnight-50 text-midnight-700"
                      : "border-ink-200 bg-white text-ink-700 hover:border-ink-300",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <Row
            title="Reduce motion"
            description="Turn off non-essential animations."
            name="reduceMotion"
            defaultChecked={initial.reduceMotion}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save preferences"
          )}
        </Button>
      </div>
    </form>
  );
}
