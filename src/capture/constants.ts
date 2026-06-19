import type { SanitizeOptions } from "./types";

/** Correlation header the capture middleware keys on; carries the test title. */
export const TEST_NAME_HEADER = "x-test-name";

/** Replacement value written in place of a redacted header value or body key. */
export const REDACTED = "«redacted»";

/**
 * Default sanitization policy.
 *
 * `redactKeys` MUST be stored pre-normalized (lowercased, separators stripped —
 * see `normalizeKey()` in ./sanitize). Storing them pre-normalized avoids a
 * runtime import cycle between constants.ts and sanitize.ts.
 */
export const DEFAULT_SANITIZE: SanitizeOptions = {
  redactHeaders: new Set(["authorization", "cookie", "set-cookie", "proxy-authorization"]),
  redactKeys: new Set([
    "password",
    "token",
    "secret",
    "authenticationtoken",
    "accesstoken",
    "refreshtoken",
    "apikey",
    "clientsecret",
    "privatekey",
  ]),
  maxBodyBytes: 64 * 1024,
};
