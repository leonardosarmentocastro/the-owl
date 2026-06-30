import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "web/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
