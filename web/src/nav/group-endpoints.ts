import type { Endpoint } from "../api";

/** A render-time grouping of Endpoints that share a resource. */
export interface ResourceGroup {
  name: string;
  endpoints: Endpoint[];
}

const ROOT_GROUP = "Root";

const segments = (route: string): string[] => route.split("/").filter((s) => s.length > 0);

const titleCase = (s: string): string => (s.length === 0 ? s : s[0].toUpperCase() + s.slice(1));

/** Compile the grouping regex source, or null when it is absent or invalid
 * (an invalid regex is a build-time misconfiguration; we warn and fall back to
 * no stripping rather than break the whole sidebar). */
const compileGrouping = (source?: string): RegExp | null => {
  if (!source) return null;
  try {
    return new RegExp(source);
  } catch {
    console.warn(`the-owl: ignoring invalid THE_OWL_GROUPING_REGEX: ${source}`);
    return null;
  }
};

/**
 * How many leading segments to strip from a route before grouping. Without a
 * grouping regex nothing is stripped. With one, we test the cumulative path
 * prefix at each segment boundary (`/api`, `/api/v1`, …) and strip the LONGEST
 * prefix the regex fully matches — but never a route's last segment, so every
 * route keeps a segment to group by.
 */
const stripLength = (segs: string[], regex: RegExp | null): number => {
  if (!regex) return 0;
  let strip = 0;
  for (let k = 1; k < segs.length; k++) {
    if (regex.test("/" + segs.slice(0, k).join("/"))) strip = k;
  }
  return strip;
};

/**
 * Group Endpoints by resource for the sidebar. By default each Endpoint is
 * grouped by its FIRST path segment, title-cased (`/users/:id` and
 * `/users/:id/orders` both → Users). When `grouping` is set — the
 * `THE_OWL_GROUPING_REGEX` source, baked onto the Catalog at build time — the
 * longest leading path prefix it matches is stripped first, so grouping falls
 * on the first segment AFTER the prefix. For example `^/api$` strips `/api`, so
 * `/api/v1/users` groups under `V1`; `^/api/v[1-9]\d*$` strips the version too,
 * so `/api/v1/users` groups under `Users`. Group and within-group order follow
 * first appearance in the catalog.
 */
export const groupEndpoints = (endpoints: Endpoint[], grouping?: string): ResourceGroup[] => {
  const regex = compileGrouping(grouping);
  const order: string[] = [];
  const byName = new Map<string, Endpoint[]>();
  endpoints.forEach((endpoint) => {
    const segs = segments(endpoint.route);
    const rest = segs.slice(stripLength(segs, regex));
    const name = rest.length > 0 ? titleCase(rest[0]) : ROOT_GROUP;
    if (!byName.has(name)) {
      byName.set(name, []);
      order.push(name);
    }
    byName.get(name)!.push(endpoint);
  });
  return order.map((name) => ({ name, endpoints: byName.get(name)! }));
};
