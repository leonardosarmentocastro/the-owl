import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", vitest: "src/capture/vitest.ts", "bin/cli": "src/bin/cli.ts" },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  // Inject an `import.meta.url` / `__dirname` shim into the CJS output so
  // `fileURLToPath(import.meta.url)` resolves correctly for `require()`
  // consumers (it is empty in CJS without this).
  shims: true,
  external: ["express", "vitest", "react", "react-dom"],
});
