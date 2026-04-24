import type { Config } from "tailwindcss";

// Corporate portal palette — teal/forest accent per spec (#2F7D66)
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
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // Corporate accent — forest teal
        moss:     { 50: "#EAF2EF", 100: "#CFE2DC", 200: "#A3C6BB", 300: "#73A899", 400: "#498B7A", 500: "#2F7D66", 600: "#246455", 700: "#1A4C40", 800: "#12342B", 900: "#0A1C17", 950: "#040C0A" },
        gilt:     { 50: "#FDF9EE", 100: "#FAF0D1", 200: "#F5DF9B", 300: "#EFCD65", 400: "#E4B538", 500: "#CF9B1E", 600: "#A87B17", 700: "#825E12", 800: "#5C420D", 900: "#3D2B08", 950: "#1F1504" },
        lagoon:   { 50: "#EAF7F5", 100: "#CDEBE6", 200: "#9BD7CE", 300: "#68C2B4", 400: "#39A896", 500: "#248C7C", 600: "#1C7063", 700: "#15554B", 800: "#0E3A33", 900: "#071E1A", 950: "#030E0C" },
        ink:      { 50: "#F7F7FA", 100: "#ECEDF2", 200: "#D5D7E0", 300: "#B0B3C1", 400: "#7D8193", 500: "#585C6E", 600: "#43465A", 700: "#2F3244", 800: "#1E2030", 900: "#11131E", 950: "#080910" },
        success:  { 50: "#ECFDF4", 100: "#D1FAE3", 200: "#A6F3C8", 300: "#6FE6A5", 400: "#34D281", 500: "#10B27E", 600: "#0A8F64", 700: "#086F50", 800: "#06513B", 900: "#043226" },
        warning:  { 50: "#FEF6E8", 100: "#FCE8C1", 200: "#F9D189", 300: "#F5B552", 400: "#F19A2C", 500: "#EF8A17", 600: "#C66B0B", 700: "#9A5109", 800: "#6E3907", 900: "#422104" },
        danger:   { 50: "#FEECEC", 100: "#FBD0D3", 200: "#F7A1A8", 300: "#F06F7B", 400: "#E54456", 500: "#DC2A3F", 600: "#B71D30", 700: "#8F1224", 800: "#660A18", 900: "#3E050E" },

        pure: "#FFFFFF",
        parchment: "#FDFCF9",
        obsidian: "#000000",

        paper: "hsl(var(--paper))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
      },
      fontFamily: {
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { xl: "14px", lg: "10px", md: "8px", sm: "6px" },
      boxShadow: {
        "elev-sm": "0 1px 2px rgba(15, 20, 40, 0.04)",
        "elev-md": "0 1px 2px rgba(15, 20, 40, 0.04), 0 8px 24px -8px rgba(15, 20, 40, 0.08)",
        "elev-lg": "0 12px 24px -8px rgba(15, 20, 40, 0.10)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
};

export default config;
