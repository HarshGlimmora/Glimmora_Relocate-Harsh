import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // ---------- PRIMARY · Midnight ----------
        midnight: {
          50:  "#EEF0F8",
          100: "#D7DDED",
          200: "#B1BBDB",
          300: "#8A98C8",
          400: "#6476B6",
          500: "#3D54A3",
          600: "#2F4082",
          700: "#242F62",
          800: "#171F41",
          900: "#0F1428",
          950: "#070914",
        },
        // ---------- SECONDARY · Gilt ----------
        gilt: {
          50:  "#FDF9EE",
          100: "#FAF0D1",
          200: "#F5DF9B",
          300: "#EFCD65",
          400: "#E4B538",
          500: "#CF9B1E",
          600: "#A87B17",
          700: "#825E12",
          800: "#5C420D",
          900: "#3D2B08",
          950: "#1F1504",
        },
        // ---------- TERTIARY · Lagoon ----------
        lagoon: {
          50:  "#EAF7F5",
          100: "#CDEBE6",
          200: "#9BD7CE",
          300: "#68C2B4",
          400: "#39A896",
          500: "#248C7C",
          600: "#1C7063",
          700: "#15554B",
          800: "#0E3A33",
          900: "#071E1A",
          950: "#030E0C",
        },
        // ---------- NEUTRAL · Ink (warm brown re-skin, matches relocation theme) ----------
        // Lightness ramp matches the prior blue-grey scale so contrast holds
        // across every existing `ink-*` reference site-wide. Hue 30°.
        ink: {
          50:  "#FBF5E8",
          100: "#F2E5C9",
          200: "#DEC79A",
          300: "#C2A36F",
          400: "#967948",
          500: "#6F5530",
          600: "#523B1F",
          700: "#3A2812",
          800: "#26190A",
          900: "#180F05",
          950: "#0A0602",
        },
        // ---------- BRAND · Caramel (the deep saddle-brown primary accent) ----------
        caramel: {
          50:  "#FBEFDB",
          100: "#F5DBB1",
          200: "#E8B97B",
          300: "#D69552",
          400: "#B97432",
          500: "#995C20",
          600: "#7B4719",
          700: "#5E3613",
          800: "#42260D",
          900: "#281706",
        },
        // ---------- SEMANTIC · Emerald ----------
        success: {
          50:  "#ECFDF4",
          100: "#D1FAE3",
          200: "#A6F3C8",
          300: "#6FE6A5",
          400: "#34D281",
          500: "#10B27E",
          600: "#0A8F64",
          700: "#086F50",
          800: "#06513B",
          900: "#043226",
        },
        // ---------- SEMANTIC · Saffron ----------
        warning: {
          50:  "#FEF6E8",
          100: "#FCE8C1",
          200: "#F9D189",
          300: "#F5B552",
          400: "#F19A2C",
          500: "#EF8A17",
          600: "#C66B0B",
          700: "#9A5109",
          800: "#6E3907",
          900: "#422104",
        },
        // ---------- SEMANTIC · Ruby ----------
        danger: {
          50:  "#FEECEC",
          100: "#FBD0D3",
          200: "#F7A1A8",
          300: "#F06F7B",
          400: "#E54456",
          500: "#DC2A3F",
          600: "#B71D30",
          700: "#8F1224",
          800: "#660A18",
          900: "#3E050E",
        },
        // ---------- BASE ----------
        pure:      "#FFFFFF",
        parchment: "#FAF7F2",   // clean creamy white — page background
        sand:      "#F1ECE4",   // subtly darker cream — sidebar background
        obsidian:  "#000000",
        soot:      "#0A0602",

        // ---------- SEMANTIC TOKENS (for components via CSS vars) ----------
        paper: "hsl(var(--paper))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 6vw, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.5rem, 4.5vw, 3.5rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(2rem, 3vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-sm": ["1.75rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
      },
      borderRadius: {
        xl: "14px",
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      boxShadow: {
        "glow-gilt":     "0 0 40px -8px rgba(228, 181, 56, 0.45)",
        "glow-midnight": "0 0 60px -12px rgba(40, 25, 12, 0.5)",
        "glow-lagoon":   "0 0 40px -10px rgba(57, 168, 150, 0.4)",
        "glow-caramel":  "0 0 40px -8px rgba(123, 71, 25, 0.4)",
        // Warm-brown-tinted elevations so every soft-card shadow on the
        // platform reads as part of the same warm palette.
        "elev-sm": "0 1px 2px rgba(40, 25, 12, 0.05), 0 1px 3px rgba(40, 25, 12, 0.07)",
        "elev-md": "0 4px 8px -2px rgba(40, 25, 12, 0.07), 0 2px 4px -2px rgba(40, 25, 12, 0.05)",
        "elev-lg": "0 12px 24px -8px rgba(40, 25, 12, 0.12), 0 4px 10px -4px rgba(40, 25, 12, 0.07)",
        "elev-xl": "0 24px 48px -12px rgba(40, 25, 12, 0.18), 0 8px 16px -6px rgba(40, 25, 12, 0.08)",
        "inset-line": "inset 0 0 0 1px rgba(40, 25, 12, 0.10)",
      },
      backgroundImage: {
        "grad-aurora":  "linear-gradient(135deg, #180F05 0%, #5E3613 45%, #B97432 100%)",
        "grad-glimmer": "linear-gradient(135deg, #5C420D 0%, #CF9B1E 40%, #F5DF9B 100%)",
        "grad-horizon": "linear-gradient(180deg, #180F05 0%, #5E3613 40%, #CF9B1E 100%)",
        "grad-dawn":    "linear-gradient(135deg, #26190A 0%, #7B4719 40%, #E4B538 100%)",
        "grad-tide":    "linear-gradient(135deg, #0E3A33 0%, #248C7C 50%, #9BD7CE 100%)",
        "grad-paper":   "linear-gradient(180deg, #FBF3E1 0%, #F2E2C2 100%)",
        "grad-veil":    "linear-gradient(180deg, rgba(24,15,5,0) 0%, rgba(24,15,5,0.6) 100%)",
        // Warm-mesh: subtle caramel + gilt orbs, matches the relocation theme.
        "mesh":         "radial-gradient(1200px 600px at 10% 0%, rgba(228,181,56,0.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(185,116,50,0.14), transparent 60%), radial-gradient(800px 600px at 50% 100%, rgba(123,71,25,0.10), transparent 60%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
};

export default config;
