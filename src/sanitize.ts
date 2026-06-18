export const REDACTED = "«redacted»";

export interface SanitizeOptions {
  /** Header names (lowercased) whose values are masked but kept. */
  redactHeaders: Set<string>;
  /** Object keys (lowercased) whose values are masked anywhere in a body/query. */
  redactKeys: Set<string>;
  /** Max serialized body size before truncation. */
  maxBodyBytes: number;
}

/** Normalize an object key for redaction matching: lowercased, separators stripped,
 * so `access_token`, `api-key`, `accessToken` all collapse to one comparable form. */
export const normalizeKey = (key: string): string => key.toLowerCase().replace(/[-_]/g, "");

export const DEFAULT_SANITIZE: SanitizeOptions = {
  redactHeaders: new Set(["authorization", "cookie", "set-cookie", "proxy-authorization"]),
  redactKeys: new Set(
    ["password", "token", "secret", "authenticationtoken", "accesstoken", "refreshtoken", "apikey", "clientsecret", "privatekey"].map(
      normalizeKey
    )
  ),
  maxBodyBytes: 64 * 1024,
};

export const sanitizeHeaders = (
  headers: Record<string, string>,
  opts: SanitizeOptions
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers).map(([key, value]) =>
      opts.redactHeaders.has(key.toLowerCase()) ? [key, REDACTED] : [key, value]
    )
  );

const deepRedact = (value: unknown, keys: Set<string>): unknown => {
  if (Array.isArray(value)) return value.map((v) => deepRedact(v, keys));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        keys.has(normalizeKey(k)) ? [k, REDACTED] : [k, deepRedact(v, keys)]
      )
    );
  }
  return value;
};

const isInlineable = (contentType?: string): boolean => {
  if (!contentType) return true; // already-parsed objects have no content-type here
  const ct = contentType.toLowerCase();
  return ct.includes("application/json") || ct.startsWith("text/");
};

export const sanitizeBody = (
  body: unknown,
  contentType: string | undefined,
  opts: SanitizeOptions
): unknown => {
  if (body == null) return null;
  if (Buffer.isBuffer(body)) return `[${contentType ?? "binary"}]`;
  if (contentType && !isInlineable(contentType)) {
    return contentType.toLowerCase().includes("multipart/form-data")
      ? "[multipart/form-data]"
      : `[${contentType}]`;
  }

  const redacted = typeof body === "object" ? deepRedact(body, opts.redactKeys) : body;
  const serialized = typeof redacted === "string" ? redacted : JSON.stringify(redacted);
  if (serialized.length > opts.maxBodyBytes) {
    return `${serialized.slice(0, opts.maxBodyBytes)}… [truncated ${serialized.length - opts.maxBodyBytes} chars]`;
  }
  return redacted;
};
