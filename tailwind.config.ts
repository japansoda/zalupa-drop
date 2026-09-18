import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090a10",
        surface: "#10121d",
        "surface-card": "rgba(18, 21, 34, 0.7)",
        "surface-glass": "rgba(255, 255, 255, 0.03)",
        border: "rgba(255, 255, 255, 0.08)",
        dropcoin: "#f5a623",
        "dropcoin-glow": "#ffbe3b",
        rarity: {
          consumer: "#b0c3d9",     // Ширпотреб (Gray)
          industrial: "#5e98d9",   // Промышленное (Light Blue)
          milspec: "#4b69ff",      // Армейское (Blue)
          restricted: "#8847ff",   // Запрещенное (Purple)
          classified: "#d32ce6",   // Засекреченное (Pink)
          covert: "#eb4b4b",       // Тайное (Red)
          special: "#ffd700",      // Экстраординарное (Gold / Knife)
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "neon-purple": "0 0 20px -3px rgba(136, 71, 255, 0.4)",
        "neon-gold": "0 0 20px -3px rgba(255, 215, 0, 0.4)",
        "neon-cyan": "0 0 20px -3px rgba(6, 182, 212, 0.4)",
        "neon-red": "0 0 20px -3px rgba(235, 75, 75, 0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 15px rgba(136, 71, 255, 0.6))" },
          "50%": { opacity: "0.7", filter: "drop-shadow(0 0 5px rgba(136, 71, 255, 0.2))" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
