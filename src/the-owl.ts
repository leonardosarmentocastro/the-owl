import { join } from "node:path";
import type { Express } from "express";
import { createCollector } from "./collector";
import { makeCaptureMiddleware } from "./capture";
import { drainToDisk } from "./persist/drain-to-disk";
import { TEST_NAME_HEADER } from "./headers";
import { DEFAULT_SANITIZE, normalizeKey, type SanitizeOptions } from "./sanitize";

const collector = createCollector();

export const buildHeaders = (testName: string): Record<string, string> => ({
  [TEST_NAME_HEADER]: testName,
});

export interface ConnectOptions {
  /** Override redaction / body-safety defaults (EC2/EC3). */
  redactHeaders?: Iterable<string>;
  redactKeys?: Iterable<string>;
  maxBodyBytes?: number;
}

export const connect = (app: Express, options: ConnectOptions = {}): void => {
  const sanitize: SanitizeOptions = {
    redactHeaders: options.redactHeaders ? new Set([...options.redactHeaders].map((h) => h.toLowerCase())) : DEFAULT_SANITIZE.redactHeaders,
    redactKeys: options.redactKeys ? new Set([...options.redactKeys].map(normalizeKey)) : DEFAULT_SANITIZE.redactKeys,
    maxBodyBytes: options.maxBodyBytes ?? DEFAULT_SANITIZE.maxBodyBytes,
  };
  app.use(makeCaptureMiddleware(collector, sanitize));
};

/** Drain this process's captured Examples to `.owl/*.json`. Render later with `the-owl build`. */
export const save = (): void => {
  if (!process.env.CREATE_DOCS) return;
  drainToDisk(collector, join(process.cwd(), ".owl"));
};

/** @deprecated renamed to save(); kept for v1 compatibility. */
export const createDocs = save;

import { docs } from "./serve";

export { docs };

export default { buildHeaders, connect, save, createDocs, docs };
