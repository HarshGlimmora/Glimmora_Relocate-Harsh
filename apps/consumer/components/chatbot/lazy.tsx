"use client";

/**
 * Code-split entrypoint for the floating Relocation Assistant.
 *
 * The chatbot is a non-critical surface so we defer its JS until the rest
 * of the app shell is hydrated. `ssr: false` keeps the chatbot's client
 * bundle off the server-render path.
 */

import dynamic from "next/dynamic";

export const RelocationAssistantLazy = dynamic(
  () =>
    import("./relocation-assistant").then((m) => ({
      default: m.RelocationAssistant,
    })),
  { ssr: false },
);
