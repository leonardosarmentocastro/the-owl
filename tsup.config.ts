import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", vitest: "src/capture/vitest.ts", "bin/cli": "src/bin/cli.ts" },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["express", "vitest", "react", "react-dom"],
});
