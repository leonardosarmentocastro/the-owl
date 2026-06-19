/**
 * The in-memory identity of an Endpoint: `METHOD route` (e.g. `GET /users/:id`).
 *
 * This single string keys two pipeline operations:
 *  - the Collector dedupes captured Examples by it (capture domain), and
 *  - the catalog reader merges Examples of the same Endpoint across drain files
 *    (catalog domain).
 *
 * It is the in-memory counterpart to `drain/slug.ts`'s on-disk identity (the
 * filename slug). Keep both in sync conceptually: same Endpoint, two encodings.
 */
export const endpointKey = (method: string, route: string): string =>
  `${method.toUpperCase()} ${route}`;
