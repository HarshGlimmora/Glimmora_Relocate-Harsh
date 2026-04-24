"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateProfile } from "./actions";

interface Initial {
  displayName: string;
  headline: string;
  bio: string;
  currentCountry: string;
  currentCity: string;
  nationality: string;
  phone: string;
}

export function ProfileForm({ initial }: { initial: Initial }) {
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
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
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={initial.displayName}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={initial.phone}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={initial.headline}
          placeholder="e.g. Senior Backend Engineer"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={initial.bio}
          rows={3}
          placeholder="A short paragraph about you and where you're heading."
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="currentCountry">Current country (ISO-2)</Label>
          <Input
            id="currentCountry"
            name="currentCountry"
            defaultValue={initial.currentCountry}
            placeholder="IN"
            maxLength={2}
            className="uppercase"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentCity">Current city</Label>
          <Input
            id="currentCity"
            name="currentCity"
            defaultValue={initial.currentCity}
            placeholder="Bangalore"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nationality">Nationality (ISO-2)</Label>
          <Input
            id="nationality"
            name="nationality"
            defaultValue={initial.nationality}
            placeholder="IN"
            maxLength={2}
            className="uppercase"
          />
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
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
