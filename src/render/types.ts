/** Options for `runBuild()` — where to read drain fragments and the full
 * directory to emit the static site into. */
export interface BuildOptions {
  owlDir: string;
  siteDir: string;
  webBundleDir?: string;
}

/** Options for the live `docs()` Express router. */
export interface DocsOptions {
  /** Path to catalog.json from `the-owl build`. Default:
   * `<THE_OWL_SITE_OUTPUT_DIR>/catalog.json` (i.e. `./docs/site/catalog.json`). */
  catalog?: string;
  /** Path to the pre-built React bundle. Default: the bundle shipped in the package. */
  bundleDir?: string;
}
