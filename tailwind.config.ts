import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1877F2",
          dark: "#166FE5",
          darker: "#0F5FCC",
          light: "#0F2A4D",
        },
        surface: "#000000",
        card: "#1C1C1E",
        border: "#38383A",
        ink: {
          DEFAULT: "#F5F5F7",
          soft: "#98989D",
          faint: "#636366",
        },
        success: {
          DEFAULT: "#32D74B",
          light: "#0F2E17",
        },
        danger: {
          DEFAULT: "#FF453A",
          light: "#3A1013",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 2px 10px rgba(0,0,0,0.4)",
        cardHover: "0 0 0 1px rgba(255,255,255,0.06) inset, 0 8px 28px rgba(0,0,0,0.55)",
        modal: "0 0 0 1px rgba(255,255,255,0.06) inset, 0 20px 60px rgba(0,0,0,0.7)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
export default config;
