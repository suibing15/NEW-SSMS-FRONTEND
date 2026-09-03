import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F1B33",
        indigo: {
          DEFAULT: "#0B3B74",
          light: "#154A8C",
          dark: "#082A54",
        },
        gold: {
          DEFAULT: "#C79A3D",
          light: "#DDBB6E",
          dark: "#9B7526",
        },
        parchment: {
          DEFAULT: "#F8F5EC",
          dim: "#EFEADB",
        },
        sage: "#4E7A64",
        clay: "#A8432F",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-plex-sans)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,27,51,0.06), 0 8px 24px -8px rgba(15,27,51,0.12)",
        lift: "0 4px 8px rgba(15,27,51,0.08), 0 16px 32px -12px rgba(15,27,51,0.18)",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
