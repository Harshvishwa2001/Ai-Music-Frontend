import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0c0d0f",
        panel: "#15171a",
        line: "#26292e",
        amber: "#e8a33d",
        amberDim: "#8a6326",
        signal: "#5ee6c4",
        paper: "#eceae4",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        mono: ["JetBrains Mono", "monospace"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
