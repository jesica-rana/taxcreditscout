import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0F",
        paper: "#FAFAF7",
        accent: "#FF5733",
        money: "#0F7B3F",
        warning: "#D63838",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Tiempos", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
