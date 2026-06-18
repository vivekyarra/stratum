import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        night: "#0A0E1A",
        panel: "#1E2433",
        violet: "#7C3AED",
        safety: "#EF4444",
        vibe: "#10B981",
        infrastructure: "#3B82F6",
        opportunity: "#F59E0B"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["var(--font-space)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 45px rgba(124, 58, 237, 0.32)"
      }
    }
  },
  plugins: []
};

export default config;
