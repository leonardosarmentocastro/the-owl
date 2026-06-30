import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./", // relative asset URLs so it works under any mount path (e.g. /docs)
  resolve: {
    // `@` → web/src, the import alias shadcn/ui generates (see web/components.json).
    // Mirrored in tsconfig.json (typecheck) and vitest.config.ts (tests).
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: { outDir: "../dist/web", emptyOutDir: true },
});
