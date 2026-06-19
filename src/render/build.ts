import { readCatalog } from "../catalog/read";
import { emitHtml } from "./html";
import type { BuildOptions } from "./types";

/** Build the docs site: read + merge the Catalog, then render it. Used by the CLI. */
export const runBuild = ({ owlDir, outDir, webBundleDir }: BuildOptions): void => {
  const catalog = readCatalog(owlDir);
  emitHtml(catalog, outDir, webBundleDir);
};
