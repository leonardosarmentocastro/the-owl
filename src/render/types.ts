/** Options for `runBuild()` — where to read drain fragments and where to emit the site. */
export interface BuildOptions {
  owlDir: string;
  outDir: string;
  webBundleDir?: string;
}

/** Options for the live `docs()` Express router. */
export interface DocsOptions {
  /** Path to catalog.json from `the-owl build`. Default: ./docs/site/catalog.json */
  catalog?: string;
  /** Path to the pre-built React bundle. Default: the bundle shipped in the package. */
  bundleDir?: string;
}
