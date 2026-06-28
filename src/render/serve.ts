import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type RequestHandler } from "express";
import type { DocsOptions } from "./types";

const LIVE_FLAG = "<script>window.__OWL_LIVE__ = true</script>";

/** Inject the live-mode marker so the docs UI enables "Try it out". */
export const injectLiveFlag = (html: string): string =>
  html.includes("</head>") ? html.replace("</head>", `${LIVE_FLAG}</head>`) : `${LIVE_FLAG}${html}`;

/** Live-route Renderer: serve the catalog + React bundle from a running app.
 * The served HTML carries the live-mode flag so "Try it out" fires same-origin. */
export const docs = (options: DocsOptions = {}): RequestHandler => {
  const here = dirname(fileURLToPath(import.meta.url));
  const bundleDir = options.bundleDir ?? join(here, "web");
  const catalogPath = options.catalog ?? join(process.cwd(), "docs", "site", "catalog.json");
  const indexPath = join(bundleDir, "index.html");

  const router = express.Router();
  router.get("/catalog.json", (_req, res) => {
    if (!existsSync(catalogPath)) {
      res.status(404).json({ error: "catalog.json not found — run `the-owl build`" });
      return;
    }
    res.type("application/json").send(readFileSync(catalogPath, "utf8"));
  });
  router.get(["/", "/index.html"], (_req, res, next) => {
    if (!existsSync(indexPath)) return next();
    res.type("html").send(injectLiveFlag(readFileSync(indexPath, "utf8")));
  });
  router.use(express.static(bundleDir));
  return router;
};
