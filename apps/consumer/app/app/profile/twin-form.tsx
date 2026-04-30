"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateTwin } from "./actions";

type Mode = "INDIVIDUAL" | "FAMILY" | "STUDENT";

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

export function TwinForm({ mode, initial }: { mode: Mode; initial: Initial }) {
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [hasChildren, setHasChildren] = React.useState(initial.hasChildren);

  const isStudent = mode === "STUDENT";
  const isFamily = mode === "FAMILY";

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
          <Label htmlFor="profession">{isStudent ? "Field of study" : "Profession"}</Label>
          <Input
            id="profession"
            name="profession"
            defaultValue={initial.profession}
            placeholder={isStudent ? "e.g. Computer Science" : "e.g. Software Engineer"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seniorityLevel">{isStudent ? "Degree level" : "Seniority"}</Label>
          <Input
            id="seniorityLevel"
            name="seniorityLevel"
            defaultValue={initial.seniorityLevel}
            placeholder={isStudent ? "BSc / MSc / PhD" : "Mid / Senior / Staff"}
          />
        </div>
        {!isStudent ? (
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
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="timelineMonths">
            {isStudent ? "Months until semester" : "Timeline (months)"}
          </Label>
          <Input
            id="timelineMonths"
            name="timelineMonths"
            type="number"
            min={1}
            max={120}
            defaultValue={initial.timelineMonths ?? ""}
            placeholder={isStudent ? "4" : "9"}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budgetUSD">
          {isStudent ? "Annual study budget (USD)" : "Budget (USD)"}
        </Label>
        <Input
          id="budgetUSD"
          name="budgetUSD"
          type="number"
          min={0}
          defaultValue={initial.budgetUSD ?? ""}
          placeholder={isStudent ? "12000" : "20000"}
        />
        <p className="text-[11px] text-ink-500">
          {isStudent
            ? "Tuition + living. Helps the Copilot suggest scholarships and part-time options."
            : "What you can put toward the move (deposits, flights, settling-in)."}
        </p>
      </div>

      {/* Hidden inputs preserve existing values for fields not shown in this mode.
          Avoids zeroing out data when a different mode previously saved them. */}
      {isStudent ? (
        <input type="hidden" name="yearsExperience" value={initial.yearsExperience ?? ""} />
      ) : null}
      <input
        type="hidden"
        name="targetCountries"
        value={initial.targetCountries.join(", ")}
      />

      {/* Family size + children fields ONLY shown for INDIVIDUAL mode (where it's
          context the Copilot can use). For FAMILY mode the source-of-truth is
          /app/family workspace — duplicating here causes drift. For STUDENT mode
          family fields are not relevant. */}
      {!isFamily && !isStudent ? (
        <>
          <div className="hairline" />
          <div>
            <p className="mono-label mb-3">Household</p>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="familySize">Household size</Label>
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
        </>
      ) : (
        <>
          <input type="hidden" name="familySize" value={initial.familySize} />
          <input type="hidden" name="childrenCount" value={initial.childrenCount} />
          {initial.hasChildren ? <input type="hidden" name="hasChildren" value="on" /> : null}
        </>
      )}

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
