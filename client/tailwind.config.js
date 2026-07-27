/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7f2",
          100: "#e8ede0",
          200: "#cdd8bc",
          300: "#aebd94",
          400: "#93a877",
          500: "#7f9467",
          600: "#65784f",
          700: "#4f5f3d",
          800: "#3f4c31",
          900: "#333e29",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 16px -4px rgb(0 0 0 / 0.08)",
        "soft-md": "0 2px 4px 0 rgb(0 0 0 / 0.04), 0 8px 24px -6px rgb(0 0 0 / 0.10)",
      },
    },
  },
  plugins: [],
};
