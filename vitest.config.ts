import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // `@` → web/src so tests resolve shadcn/ui imports the same way the app build
    // does (web/vite.config.ts) and the typechecker does (tsconfig.json paths).
    alias: { "@": fileURLToPath(new URL("./web/src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "web/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./web/src/test-setup.ts"],
  },
});
