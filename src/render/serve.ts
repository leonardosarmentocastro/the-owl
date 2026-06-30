import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type RequestHandler } from "express";
import type { DocsOptions } from "./types";

const LIVE_FLAG = "<script>window.__THE_OWL_LIVE__ = true</script>";

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
  router.get(["/", "/index.html"], (req, res, next) => {
    if (!existsSync(indexPath)) return next();
    // The bundle uses relative asset URLs (./assets/*), which only resolve when
    // the index is served from a trailing-slash path. Redirect the bare mount
    // path (e.g. /docs) to its slashed form (/docs/) so assets aren't requested
    // against the parent app.
    if (req.path === "/" && !req.originalUrl.split("?")[0].endsWith("/")) {
      const query = req.originalUrl.slice(req.originalUrl.indexOf("?") + 1);
      res.redirect(`${req.baseUrl}/${req.originalUrl.includes("?") ? `?${query}` : ""}`);
      return;
    }
    res.type("html").send(injectLiveFlag(readFileSync(indexPath, "utf8")));
  });
  router.use(express.static(bundleDir));
  return router;
};
