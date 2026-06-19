import { join } from "node:path";
import type { Express } from "express";
import { createCollector } from "./capture/collector";
import { createCaptureMiddleware } from "./capture/middleware";
import { drainToDisk } from "./drain/to-disk";
import { normalizeKey } from "./capture/sanitize";
import { TEST_NAME_HEADER, DEFAULT_SANITIZE } from "./capture/constants";
import type { SanitizeOptions, ConnectOptions } from "./capture/types";
import { docs } from "./render/serve";

// The composition root: the ONLY module that wires capture + drain + render
// together and exposes the public API. A single process-wide Collector is filled
// by the capture middleware and emptied by save().
const collector = createCollector();

export const buildHeaders = (testName: string): Record<string, string> => ({
  [TEST_NAME_HEADER]: testName,
});

/** Mount the capture middleware on an Express app (pipeline phase 1). */
export const connect = (app: Express, options: ConnectOptions = {}): void => {
  const sanitize: SanitizeOptions = {
    redactHeaders: options.redactHeaders ? new Set([...options.redactHeaders].map((h) => h.toLowerCase())) : DEFAULT_SANITIZE.redactHeaders,
    redactKeys: options.redactKeys ? new Set([...options.redactKeys].map(normalizeKey)) : DEFAULT_SANITIZE.redactKeys,
    maxBodyBytes: options.maxBodyBytes ?? DEFAULT_SANITIZE.maxBodyBytes,
  };
  app.use(createCaptureMiddleware(collector, sanitize));
};

/** Drain this process's captured Examples to `.owl/*.json` (pipeline phase 2). Render later with `the-owl build`. */
export const save = (): void => {
  if (!process.env.CREATE_DOCS) return;
  drainToDisk(collector, join(process.cwd(), ".owl"));
};

/** @deprecated renamed to save(); kept for v1 compatibility. */
export const createDocs = save;

export { docs };

export default { buildHeaders, connect, save, createDocs, docs };
