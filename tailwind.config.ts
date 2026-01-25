import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          black: "#0a0a0a",
          dark: "#111111",
          gray: "#1a1a1a",
          border: "#2a2a2a",
          muted: "#666666",
          light: "#999999",
          white: "#f5f5f5",
          accent: "#ff3333",
          gold: "#d4af37",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
