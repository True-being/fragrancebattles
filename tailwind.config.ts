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
          silver: "#a0a0a0",
          bronze: "#cd7f32",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],      // Bebas Neue - bold headlines
        elegant: ["var(--font-elegant)", "serif"],           // Playfair Display - fragrance names
        modern: ["var(--font-modern)", "sans-serif"],        // Space Grotesk - UI/body
        editorial: ["var(--font-editorial)", "serif"],       // Cormorant Garamond - quotes
        expressive: ["var(--font-expressive)", "sans-serif"], // Syne - accent words
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 51, 51, 0.3)",
        "glow-lg": "0 0 40px rgba(255, 51, 51, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
