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
          500: "#7f9467",
          600: "#65784f",
          700: "#4f5f3d",
        },
      },
    },
  },
  plugins: [],
};
