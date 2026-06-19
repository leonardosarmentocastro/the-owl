import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog } from "../types";

/**
 * Render step (pipeline phase 4): write the Catalog as a static site under
 * `<outDir>/site` — the React bundle plus the `catalog.json` the app fetches.
 */
export const emitHtml = (catalog: Catalog, outDir: string, webBundleDir?: string): void => {
  const siteDir = join(outDir, "site");
  mkdirSync(siteDir, { recursive: true });
  if (webBundleDir && existsSync(webBundleDir)) {
    cpSync(webBundleDir, siteDir, { recursive: true });
  }
  writeFileSync(join(siteDir, "catalog.json"), JSON.stringify(catalog, null, 2));
};
