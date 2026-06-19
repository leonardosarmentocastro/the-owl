import slugify from "slugify";

export const endpointSlug = (method: string, route: string): string =>
  slugify(`${method} ${route.replace(/[/:]+/g, " ")}`, { lower: true, strict: true, replacement: "-" });
