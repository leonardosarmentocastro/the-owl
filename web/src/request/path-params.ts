/** Map a route template's `:params` to the concrete values from a captured path. */
export const parsePathParams = (route: string, capturedPath: string): Record<string, string> => {
  const routeParts = route.split("/");
  const pathParts = capturedPath.split("/");
  if (routeParts.length !== pathParts.length) return {};

  const params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    const seg = routeParts[i];
    if (seg.startsWith(":")) {
      params[seg.slice(1)] = decodeURIComponent(pathParts[i]);
    }
  }
  return params;
};
