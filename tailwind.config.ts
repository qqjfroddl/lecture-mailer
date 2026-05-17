// Tailwind 설정 — 한국어 본문 가독성 우선
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Pretendard",
          "Noto Sans KR",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          DEFAULT: "#2E3142",
          accent: "#3C6D71",
          accentLight: "#4A8A8F",
          surface: "#F2F1EF",
        },
      },
    },
  },
  plugins: [],
};

export default config;
