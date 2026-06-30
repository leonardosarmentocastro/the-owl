import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./web/src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "web/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./web/src/test-setup.ts"],
  },
});
