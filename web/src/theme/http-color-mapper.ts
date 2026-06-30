/** Tailwind text-color class for an HTTP method (full literals so Tailwind's
 * scanner keeps them). DELETE and its "DEL" shorthand share the same red. */
export const methodColorClass = (method: string): string => {
  const m = method.toUpperCase();
  if (m === "GET") return "text-green-700";
  if (m === "POST") return "text-blue-700";
  if (m === "PUT") return "text-amber-600";
  if (m === "PATCH") return "text-teal-600";
  if (m.startsWith("DEL")) return "text-red-700";
  return "text-muted-foreground";
};

/** Tailwind text-color class for an HTTP status, by range: 1xx gray-blue,
 * 2xx green, 3xx amber, 4xx red, 5xx purple. */
export const statusColorClass = (status: number): string => {
  if (status >= 500) return "text-purple-700";
  if (status >= 400) return "text-red-700";
  if (status >= 300) return "text-amber-600";
  if (status >= 200) return "text-green-700";
  return "text-slate-500";
};
