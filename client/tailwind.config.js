/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // bonkAI.uk palette — see /root/.claude/skills/bonkai-brand
        canvas: "#F2EFE8",
        surface: "#E5E0D5",
        surface2: "#DAD4C6",
        line: "#CFC8B9",
        sage: "#B8C7B0",
        sageMid: "#8CA184",
        sageDeep: "#566B51",
        ink: "#2E322B",
        muted: "#6B6A62",
        signal: "#3F6F63",
        running: "#3F6F63",
        success: "#566B51",
        idle: "#6B6A62",
        warning: "#8A5E1E",
        failed: "#8E3B31",
      },
      fontFamily: {
        sans: ["Public Sans", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Bricolage Grotesque", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SF Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
