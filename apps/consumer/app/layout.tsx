import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

// Project typography (finalised: option 11 — Public Sans single-family).
// Headings and body share the same family; visual hierarchy comes from
// weight + size, not contrasting typefaces. `--font-display` and
// `--font-mono` are CSS-aliased to `--font-sans` in globals.css so every
// callsite (font-sans, font-display, font-mono) resolves to Public Sans.
const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Glimmora Relocate",
    template: "%s · Glimmora Relocate",
  },
  description:
    "The AI companion for moving your life across borders. One plan, one platform, from decision to stability.",
  applicationName: "Glimmora Relocate",
  keywords: ["relocation", "visa", "jobs", "move abroad", "AI", "expat"],
  authors: [{ name: "Glimmora" }],
  creator: "Glimmora",
  openGraph: {
    title: "Glimmora Relocate",
    description: "From decision to stability.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FBF3E1" }],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={publicSans.variable}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-parchment text-ink-900 antialiased">{children}</body>
    </html>
  );
}
