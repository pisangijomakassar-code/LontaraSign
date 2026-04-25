/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        bugis: ["Noto Sans Buginese", "Noto Sans", "serif"],
      },
      colors: {
        bg: "#F5F1EA",
        surface: "#FFFFFF",
        "surface-muted": "#FAF7F1",
        ink: "#1A1410",
        "ink-soft": "#3E342B",
        mute: "#7A6D5E",
        "mute-soft": "#A89B89",
        brand: { DEFAULT: "#1D4ED8", ink: "#1E3A8A", soft: "#EEF4FF" },
        bugis: { red: "#8B1F1F", gold: "#B8891E", "gold-soft": "#FBF4E3", teal: "#0E6B63", indigo: "#2A3A7A" },
        ai: { DEFAULT: "#5B21B6", soft: "#F5F3FF" },
      },
      boxShadow: {
        ls: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        "ls-md": "0 4px 12px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.04)",
        "ls-lg": "0 12px 32px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};
