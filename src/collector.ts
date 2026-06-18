import type { CapturedRequest, CapturedResponse, Endpoint } from "./model";
import { endpointKey } from "./model";

export interface RecordInput {
  testName: string;
  method: string;
  route: string;
  request: CapturedRequest;
  response: CapturedResponse;
}

export interface Collector {
  record(input: RecordInput): void;
  drain(): Endpoint[];
}

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
