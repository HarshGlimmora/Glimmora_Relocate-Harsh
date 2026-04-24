"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteAccount } from "./actions";

export function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(formData);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!confirming) {
    return (
      <div className="space-y-4">
        <p className="text-[14px] leading-relaxed text-danger-800/90">
          Deleting your account is permanent. Your Digital Twin, documents, bookings, and
          messages will be removed. This cannot be undone.
        </p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setConfirming(true)}
        >
          <AlertTriangle className="h-4 w-4" />
          Delete my account
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-[14px] leading-relaxed text-danger-800">
        To confirm, type <span className="rounded bg-danger-100 px-1.5 py-0.5 font-mono text-[12px] text-danger-800">DELETE</span> below.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Type DELETE to confirm</Label>
        <Input id="confirm" name="confirm" required autoComplete="off" placeholder="DELETE" />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting…
            </>
          ) : (
            "Confirm delete"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
