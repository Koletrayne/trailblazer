import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f1f6f1",
          100: "#dceadd",
          200: "#bcd5be",
          300: "#8eb792",
          400: "#5d9163",
          500: "#3f7345",
          600: "#2f5b35",
          700: "#26482b",
          800: "#1f3a23",
          900: "#162a1a"
        },
        bark: {
          50: "#f8f4ee",
          100: "#ece1cf",
          200: "#d8c2a1",
          300: "#bf9e72",
          400: "#a17e51",
          500: "#84653f",
          600: "#6a5034",
          700: "#523f2c",
          800: "#3d2f23",
          900: "#2a201a"
        },
        cream: "#f7f1e3",
        ember: "#e07a3c",
        ash: "#8b8378"
      },
      fontFamily: {
        display: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 6px 20px -8px rgba(31, 58, 35, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
