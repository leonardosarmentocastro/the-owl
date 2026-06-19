import type { Endpoint } from "../types";
import { endpointKey } from "../keys";
import type { Collector, RecordInput } from "./types";

/**
 * Create a Collector: the in-memory accumulator the capture middleware writes to
 * during one test process. `record` dedupes by testName+method+route (first write
 * wins) so a res.json→res.end double-fire keeps the real body; `drain` groups the
 * Examples into serialized Endpoints for the drain domain to persist.
 */
export const createCollector = (): Collector => {
  // EC1: keyed by testName+method+route, so one test can document several endpoints
  // while res.json→res.end double-fires and repeated calls to the same endpoint dedupe.
  const byExample = new Map<string, RecordInput>();
  const exampleKey = (r: RecordInput) => `${r.testName}\u0000${endpointKey(r.method, r.route)}`;

  return {
    record(input) {
      const key = exampleKey(input);
      if (byExample.has(key)) return; // first write wins
      byExample.set(key, input);
    },

    drain() {
      const byEndpoint = new Map<string, Endpoint>();
      for (const r of byExample.values()) {
        const key = endpointKey(r.method, r.route);
        let endpoint = byEndpoint.get(key);
        if (!endpoint) {
          endpoint = { method: r.method.toUpperCase(), route: r.route, examples: [] };
          byEndpoint.set(key, endpoint);
        }
        endpoint.examples.push({ name: r.testName, request: r.request, response: r.response });
      }
      return [...byEndpoint.values()];
    },
  };
};
