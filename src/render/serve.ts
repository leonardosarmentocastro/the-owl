import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type RequestHandler } from "express";
import type { DocsOptions } from "./types";

/** Live-route Renderer: serve the catalog + React bundle from a running app. */
export const docs = (options: DocsOptions = {}): RequestHandler => {
  const here = dirname(fileURLToPath(import.meta.url));
  const bundleDir = options.bundleDir ?? join(here, "web");
  const catalogPath = options.catalog ?? join(process.cwd(), "docs", "site", "catalog.json");

  const router = express.Router();
  router.get("/catalog.json", (_req, res) => {
    if (!existsSync(catalogPath)) {
      res.status(404).json({ error: "catalog.json not found — run `the-owl build`" });
      return;
    }
    res.type("application/json").send(readFileSync(catalogPath, "utf8"));
  });
  router.use(express.static(bundleDir));
  return router;
};
