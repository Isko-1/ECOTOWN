import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          50: "#f0f9f0",
          100: "#dcf0dd",
          200: "#b8e0bb",
          300: "#8ccb92",
          400: "#5cb166",
          500: "#3c9646",
          600: "#2c7936",
          700: "#25602d",
          800: "#204c27",
          900: "#1c3f22",
          950: "#132d18",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      // keyframes и animation нужны для анимации sidebar/drawer
      keyframes: {
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-out-to-bottom": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-from-right 0.3s cubic-bezier(0.16,1,0.3,1)",
        "slide-out-right": "slide-out-to-right 0.25s ease-in",
        "slide-in-bottom": "slide-in-from-bottom 0.35s cubic-bezier(0.16,1,0.3,1)",
        "slide-out-bottom": "slide-out-to-bottom 0.25s ease-in",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-in",
      },
    },
  },
  plugins: [animate],
};

export default config;
