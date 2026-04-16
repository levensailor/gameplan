import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0f172a",
        card: "#1e293b",
        accent: "#38bdf8"
      }
    }
  },
  plugins: []
};

export default config;
