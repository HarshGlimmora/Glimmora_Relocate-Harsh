/** @type {import('next').NextConfig} */

// Bare module names that should always live under /app/*. If anyone (a
// stray bookmark, a browser history entry left over from a refactor, an
// external referrer, an old QA tab) hits one of these at the root, send
// them to the canonical /app/<slug> route instead of 404-ing.
const APP_MODULE_SLUGS = [
  "country",
  "jobs",
  "visa",
  "finance",
  "documents",
  "family",
  "culture",
  "workflow",
  "timeline",
  "synthesis",
  "profile",
  "settings",
  "billing",
  "discover",
  "career",
  "plan",
  "life",
  "marketplace",
  "messages",
  "onboarding",
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async redirects() {
    return APP_MODULE_SLUGS.map((slug) => ({
      source: `/${slug}/:path*`,
      destination: `/app/${slug}/:path*`,
      permanent: false, // 307 — preserve method, easy to revert without browser cache stickiness
    }));
  },
};

export default nextConfig;
