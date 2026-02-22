import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f1117',
          800: '#1a1d27',
          700: '#242837',
          600: '#2e3347',
        },
        accent: {
          blue: '#3b82f6',
          green: '#22c55e',
          orange: '#f59e0b',
          red: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
export default config;
