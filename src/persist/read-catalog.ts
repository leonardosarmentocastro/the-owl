import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog, Endpoint } from "../model";
import { endpointKey } from "../model";

// EC7: merge Examples from every drain file by endpoint key, so the same endpoint documented
// across multiple test files becomes one Endpoint (Examples deduped by name).
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
