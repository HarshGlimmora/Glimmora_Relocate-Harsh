import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
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
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FDFCF9" }],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-parchment text-ink-900 antialiased">{children}</body>
    </html>
  );
}
