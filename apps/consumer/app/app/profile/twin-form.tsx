"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateTwin } from "./actions";

interface Initial {
  profession: string;
  seniorityLevel: string;
  yearsExperience: number | null;
  timelineMonths: number | null;
  budgetUSD: number | null;
  targetCountries: string[];
  familySize: number;
  hasChildren: boolean;
  childrenCount: number;
}

export function TwinForm({ initial }: { initial: Initial }) {
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [hasChildren, setHasChildren] = React.useState(initial.hasChildren);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (hasChildren) formData.set("hasChildren", "on");
    else formData.delete("hasChildren");
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateTwin(formData);
      if (result.ok) setMessage(result.message ?? "Saved.");
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profession">Profession</Label>
          <Input
            id="profession"
            name="profession"
            defaultValue={initial.profession}
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seniorityLevel">Seniority</Label>
          <Input
            id="seniorityLevel"
            name="seniorityLevel"
            defaultValue={initial.seniorityLevel}
            placeholder="Mid / Senior / Staff"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yearsExperience">Years of experience</Label>
          <Input
            id="yearsExperience"
            name="yearsExperience"
            type="number"
            min={0}
            max={60}
            defaultValue={initial.yearsExperience ?? ""}
            placeholder="8"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timelineMonths">Timeline (months)</Label>
          <Input
            id="timelineMonths"
            name="timelineMonths"
            type="number"
            min={1}
            max={120}
            defaultValue={initial.timelineMonths ?? ""}
            placeholder="9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="targetCountries">Target countries (ISO-2, comma separated)</Label>
        <Input
          id="targetCountries"
          name="targetCountries"
          defaultValue={initial.targetCountries.join(", ")}
          placeholder="DE, NL, PT"
          className="uppercase"
        />
        <p className="text-[11px] text-ink-500">
          Up to 10 country codes. The Copilot will rank them by fit.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budgetUSD">Budget (USD)</Label>
        <Input
          id="budgetUSD"
          name="budgetUSD"
          type="number"
          min={0}
          defaultValue={initial.budgetUSD ?? ""}
          placeholder="20000"
        />
      </div>

      <div className="hairline" />

      <div>
        <p className="mono-label mb-3">Family</p>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="familySize">Family size</Label>
            <Input
              id="familySize"
              name="familySize"
              type="number"
              min={1}
              max={20}
              defaultValue={initial.familySize}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-ink-200 bg-parchment/60 px-4 py-3">
            <Label htmlFor="hasChildren" className="text-[12.5px] normal-case tracking-normal text-ink-900">
              Children with you?
            </Label>
            <Switch id="hasChildren" checked={hasChildren} onCheckedChange={setHasChildren} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="childrenCount">Children count</Label>
            <Input
              id="childrenCount"
              name="childrenCount"
              type="number"
              min={0}
              max={12}
              defaultValue={initial.childrenCount}
              disabled={!hasChildren}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Twin"
          )}
        </Button>
      </div>
    </form>
  );
}
