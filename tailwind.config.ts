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
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: "#FF6B35",
          dark: "#E55A2B",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2D6A4F",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#FFD166",
          foreground: "#1A1A1A",
        },
        background: "#FAFAF8",
        surface: "#FFFFFF",
        foreground: "#1A1A1A",
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6B7280",
        },
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#FF6B35",
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        // Workout types
        workout: {
          easy: "#4ADE80",
          long: "#3B82F6",
          intervals: "#EF4444",
          tempo: "#F59E0B",
          recovery: "#A78BFA",
          hills: "#DC2626",
          rest: "#D1D5DB",
          race: "#FF6B35",
          cross: "#14B8A6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "6px",
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
