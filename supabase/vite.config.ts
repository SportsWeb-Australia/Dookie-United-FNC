import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SportsWeb One club template — standard Vite + React setup.
// An inline (empty) PostCSS config is provided on purpose: it stops Vite from
// searching for a postcss.config.js on disk. This app uses hand-written CSS
// (no Tailwind / PostCSS plugins), so this prevents any stray postcss.config.js
// left in the repo from breaking the build.
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: { plugins: [] },
  },
});
