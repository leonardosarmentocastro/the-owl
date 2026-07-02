import { resolve } from "node:path";

// Default static-site output, relative to cwd, when THE_OWL_SITE_OUTPUT_DIR is unset.
// Local: used privately by the one function below (allowed by the file-purity rule).
const DEFAULT_SITE_OUTPUT_DIR = "docs/site";

/** Resolve the built-docs output directory from THE_OWL_SITE_OUTPUT_DIR (full
 * path, default docs/site). Relative values are anchored at the current working
 * directory; absolute values are used as-is. Read by `the-owl build` and the live
 * `docs()` router. */
export const resolveSiteOutputDir = (): string =>
  resolve(process.cwd(), process.env.THE_OWL_SITE_OUTPUT_DIR ?? DEFAULT_SITE_OUTPUT_DIR);
