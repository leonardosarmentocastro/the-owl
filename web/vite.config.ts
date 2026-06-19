import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // relative asset URLs so it works under any mount path (e.g. /docs)
  build: { outDir: "../dist/web", emptyOutDir: true },
});
