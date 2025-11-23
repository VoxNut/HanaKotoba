/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        // Softer coral-red for CTAs
        coral: {
          50: "#fff5f5",
          100: "#ffe3e3",
          200: "#ffc9c9",
          300: "#ffa8a8",
          400: "#ff8787",
          500: "#ff6b6b",
          600: "#fa5252",
          700: "#f03e3e",
          800: "#e03131",
          900: "#c92a2a",
        },
        // Sakura pink for highlights
        sakura: {
          50: "#fff5f7",
          100: "#ffe3eb",
          200: "#ffc9d9",
          300: "#ffb7c5",
          400: "#ff9eb7",
          500: "#ff85a8",
          600: "#fa6d9a",
          700: "#f0558c",
          800: "#e03e7e",
          900: "#c92a6d",
        },
        // Warm gold for achievements
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#f4c430",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 8s ease-in-out infinite 2s",
        "float-slow": "float 10s ease-in-out infinite 4s",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
      },
    },
  },
  plugins: [],
};