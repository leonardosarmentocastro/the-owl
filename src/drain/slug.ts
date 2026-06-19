import slugify from "slugify";

/**
 * The on-disk identity of an Endpoint — a filesystem-safe slug used as the prefix
 * of its drain file (`<slug>.<uuid>.json`). The in-memory counterpart is
 * `endpointKey()` in `src/keys.ts`.
 */
export const endpointSlug = (method: string, route: string): string =>
  slugify(`${method} ${route.replace(/[/:]+/g, " ")}`, { lower: true, strict: true, replacement: "-" });
