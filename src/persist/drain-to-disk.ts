import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Collector } from "../collector";
import { endpointSlug } from "./slug";

// EC7: test runners fork a process per file and run them concurrently. Each drain writes a
// UNIQUE file (<slug>.<uuid>.json) so concurrent processes never clobber each other; the merge
// happens later in readCatalog().
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
