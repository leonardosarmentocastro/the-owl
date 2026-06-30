import slugify from "slugify";

/**
 * The anchor identity of an Example in the docs UI: a lowercase, URL-safe slug
 * derived from its Endpoint's method + route and the Example name. It is the sole
 * producer of slugs shared by the sidebar link's `href="#…"` and the matching
 * accordion's DOM `id`, so a hash can never point at a missing target. Mirrors the
 * slugify options of `src/drain/slug.ts`.
 */
export const exampleSlug = (method: string, route: string, name: string): string =>
  slugify(`${method} ${route.replace(/[/:]+/g, " ")} ${name}`, {
    lower: true,
    strict: true,
    replacement: "-",
  });
