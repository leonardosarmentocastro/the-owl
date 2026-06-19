import { readCatalog } from "./persist/read-catalog";
import { emitHtml } from "./renderers/html";

export interface BuildOptions {
  owlDir: string;
  outDir: string;
  webBundleDir?: string;
}

export const runBuild = ({ owlDir, outDir, webBundleDir }: BuildOptions): void => {
  const catalog = readCatalog(owlDir);
  emitHtml(catalog, outDir, webBundleDir);
};
