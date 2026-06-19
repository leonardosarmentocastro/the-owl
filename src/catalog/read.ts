import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog, Endpoint } from "../types";
import { endpointKey } from "../keys";

/**
 * Catalog step (pipeline phase 3): read every drain fragment in `dir` and merge
 * them into one in-memory Catalog — the source of truth a Renderer consumes. This
 * domain WRITES NOTHING; the same Endpoint documented across multiple test files
 * becomes one Endpoint (Examples deduped by name). EC7.
 */
export const readCatalog = (dir: string): Catalog => {
  const byKey = new Map<string, Endpoint>();
  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
      const endpoint = JSON.parse(readFileSync(join(dir, file), "utf8")) as Endpoint;
      const key = endpointKey(endpoint.method, endpoint.route);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, endpoint);
        continue;
      }
      const seen = new Set(existing.examples.map((e) => e.name));
      for (const example of endpoint.examples) {
        if (!seen.has(example.name)) existing.examples.push(example);
      }
    }
  }
  return { generatedAt: new Date().toISOString(), endpoints: [...byKey.values()] };
};
