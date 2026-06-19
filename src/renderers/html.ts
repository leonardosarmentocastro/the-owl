import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog } from "../types";

export const emitHtml = (catalog: Catalog, outDir: string, webBundleDir?: string): void => {
  const siteDir = join(outDir, "site");
  mkdirSync(siteDir, { recursive: true });
  if (webBundleDir && existsSync(webBundleDir)) {
    cpSync(webBundleDir, siteDir, { recursive: true });
  }
  writeFileSync(join(siteDir, "catalog.json"), JSON.stringify(catalog, null, 2));
};
