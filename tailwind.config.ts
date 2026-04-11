import type { Config } from "tailwindcss";

/**
 * Friends Who Run design system.
 *
 * Aesthetic: editorial brutalism — think Bandit Running, Renegade Run
 * Club, Heartbreak Hill, Nike Running. Monochrome foundation (ink
 * black + warm off-white newsprint), one signature accent (flash
 * orange) used sparingly as punctuation, bold tight typography, and
 * near-square corners. Numerics always tabular-mono.
 *
 * Naming:
 *   ink       — the near-black we use for primary text + surfaces
 *   bone      — warm off-white background (like newsprint)
 *   surface   — pure white cards
 *   flash     — the accent orange (race-tape / finish-line color)
 *   siren     — intensity red for race / intervals
 *   graphite  — neutral gray scale
 */
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
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // ── Brand atoms ──────────────────────────────────────────────
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#1A1A1A",
          muted: "#6B6B6B",
        },
        bone: {
          DEFAULT: "#F5F1EA",
          soft: "#EDE8DF",
          deep: "#E5DFD2",
        },
        flash: {
          DEFAULT: "#FF5A1F",
          dark: "#E04A10",
          light: "#FFE4D6",
        },
        siren: "#DC2626",
        graphite: {
          50: "#FAFAF9",
          100: "#F3F2EF",
          200: "#E7E5E1",
          300: "#D4D2CC",
          400: "#9A968E",
          500: "#6B6B6B",
          600: "#4A4A4A",
          700: "#2E2E2E",
          800: "#1A1A1A",
          900: "#0A0A0A",
        },

        // ── Semantic aliases (so existing components still work) ──
        primary: {
          DEFAULT: "#0A0A0A",
          dark: "#000000",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FF5A1F",
          foreground: "#0A0A0A",
        },
        accent: {
          DEFAULT: "#FF5A1F",
          foreground: "#0A0A0A",
        },
        background: "#F5F1EA",
        surface: "#FFFFFF",
        foreground: "#0A0A0A",
        muted: {
          DEFAULT: "#EDE8DF",
          foreground: "#6B6B6B",
        },
        border: "#D4D2CC",
        input: "#D4D2CC",
        ring: "#0A0A0A",
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },

        // ── Workout type palette ──
        workout: {
          easy: "#16A34A",
          long: "#2563EB",
          intervals: "#DC2626",
          tempo: "#EA580C",
          recovery: "#7C3AED",
          hills: "#B91C1C",
          rest: "#9A968E",
          race: "#FF5A1F",
          cross: "#0D9488",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "var(--font-sans)",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "1.2" }],
        xs: ["11px", { lineHeight: "1.4" }],
        sm: ["13px", { lineHeight: "1.5" }],
        base: ["15px", { lineHeight: "1.5" }],
        lg: ["17px", { lineHeight: "1.35" }],
        xl: ["20px", { lineHeight: "1.2" }],
        "2xl": ["26px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "3xl": ["34px", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "4xl": ["44px", { lineHeight: "1.0", letterSpacing: "-0.035em" }],
        "5xl": ["56px", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
        bib: "0.18em",
      },
      borderRadius: {
        none: "0",
        xs: "2px",
        sm: "3px",
        DEFAULT: "4px",
        md: "4px",
        lg: "6px",
        xl: "8px",
        "2xl": "12px",
      },
      boxShadow: {
        flat: "0 1px 0 0 rgba(10, 10, 10, 0.06)",
        bib: "0 0 0 1px rgba(10, 10, 10, 0.08)",
        raise: "0 2px 0 0 rgba(10, 10, 10, 0.04)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
