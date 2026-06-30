import type { Endpoint } from "../api";

/** A render-time grouping of Endpoints that share a resource. */
export interface ResourceGroup {
  name: string;
  endpoints: Endpoint[];
}

const ROOT_GROUP = "Root";

const segments = (route: string): string[] => route.split("/").filter((s) => s.length > 0);

const titleCase = (s: string): string => (s.length === 0 ? s : s[0].toUpperCase() + s.slice(1));

/**
 * The number of leading path segments shared by EVERY route, capped so each
 * route keeps at least its last segment. A segment common to all routes cannot
 * distinguish one resource from another, so it is stripped before grouping.
 */
const sharedPrefixLength = (routes: string[][]): number => {
  if (routes.length === 0) return 0;
  const cap = Math.min(...routes.map((r) => Math.max(r.length - 1, 0)));
  let i = 0;
  for (; i < cap; i++) {
    const seg = routes[0][i];
    if (!routes.every((r) => r[i] === seg)) break;
  }
  return i;
};

/**
 * Group Endpoints by resource for the sidebar. The resource is the first path
 * segment that DISTINGUISHES routes: the prefix common to all routes is stripped
 * first (so `/api/users` and `/api/health` group as Users / Health, not all
 * under "Api"), then endpoints are grouped by their first remaining segment,
 * title-cased. Group and within-group order follow first appearance.
 *
 * Documented consequence: when a catalog mixes API versions
 * (`/api/v1/...`, `/api/v2/...`), the only shared segment is `api`, so the first
 * distinguishing segment is the version — endpoints group by version (V1, V2),
 * not by resource. This is intentional: two versions are separate surfaces.
 */
export const groupEndpoints = (endpoints: Endpoint[]): ResourceGroup[] => {
  const routes = endpoints.map((e) => segments(e.route));
  const prefix = sharedPrefixLength(routes);
  const order: string[] = [];
  const byName = new Map<string, Endpoint[]>();
  endpoints.forEach((endpoint, i) => {
    const rest = routes[i].slice(prefix);
    const name = rest.length > 0 ? titleCase(rest[0]) : ROOT_GROUP;
    if (!byName.has(name)) {
      byName.set(name, []);
      order.push(name);
    }
    byName.get(name)!.push(endpoint);
  });
  return order.map((name) => ({ name, endpoints: byName.get(name)! }));
};
