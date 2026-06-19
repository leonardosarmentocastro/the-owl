import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Collector } from "../capture/types";
import { endpointSlug } from "./slug";

/**
 * Drain step (pipeline phase 2): empty a Collector to `.owl/*.json`. Each Endpoint
 * is written to its own `<slug>.<uuid>.json` file. The uuid makes every write
 * unique so the concurrently-forked test processes never clobber one another; the
 * merge into a single Catalog happens later in the catalog domain (`readCatalog`).
 */
export const drainToDisk = (collector: Collector, dir: string): string[] => {
  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  for (const endpoint of collector.drain()) {
    const file = join(dir, `${endpointSlug(endpoint.method, endpoint.route)}.${randomUUID()}.json`);
    writeFileSync(file, JSON.stringify(endpoint, null, 2));
    written.push(file);
  }
  return written;
};
