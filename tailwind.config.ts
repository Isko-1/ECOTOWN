import type { Config } from "tailwindcss";

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
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};

export default config;
