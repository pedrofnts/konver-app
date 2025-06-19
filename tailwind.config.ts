import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Cor principal - Azul profissional e confiável
        primary: {
          50: "#F0F7FF",
          100: "#E0EFFF",
          200: "#B8DFFF",
          300: "#8CCCFF",
          400: "#59B3FF",
          500: "#3399FF", // Cor principal
          600: "#2272CC",
          700: "#1A569B",
          800: "#123B6B",
          900: "#0B2444",
        },
        // Cor secundária - Tom mais acolhedor
        secondary: {
          50: "#FFF5F2",
          100: "#FFE6DF",
          200: "#FFD5C7",
          300: "#FFB499",
          400: "#FF967A",
          500: "#FF774C", // Cor secundária
          600: "#CC5F3D",
          700: "#994731",
          800: "#662F21",
          900: "#331812",
        },
        // Tom neutro profissional
        neutral: {
          50: "#F7F9FC",
          100: "#EEF3F9",
          200: "#D8E2F0",
          300: "#B9C7DE",
          400: "#8FA3C7",
          500: "#6B82B0",
          600: "#4A5F8F",
          700: "#374873",
          800: "#243252",
          900: "#121B31",
        },
        // Tom de destaque para elementos importantes
        accent: {
          50: "#F2FBFF",
          100: "#E3F6FF",
          200: "#C7EDFF",
          300: "#85D9FF",
          400: "#42C5FF",
          500: "#00B1FF", // Cor de destaque
          600: "#008ECC",
          700: "#006B99",
          800: "#004866",
          900: "#002533",
        },
        // Tom de sucesso
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
        },
        // Tom de erro
        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        // Tom de aviso
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Satoshi", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
