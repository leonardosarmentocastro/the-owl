import { describe, it, expect } from "vitest";
import { DEFAULT_SANITIZE, sanitizeHeaders, sanitizeBody, REDACTED } from "../src/sanitize";

describe("sanitize", () => {
  it("masks sensitive header values but keeps the key (EC2)", () => {
    const out = sanitizeHeaders({ authorization: "Bearer secret", "accept-language": "pt-br" }, DEFAULT_SANITIZE);
    expect(out).toEqual({ authorization: REDACTED, "accept-language": "pt-br" });
  });

  it("deep-masks sensitive body keys (EC2)", () => {
    const out = sanitizeBody({ email: "a@b.c", password: "hunter2", nested: { token: "abc" } }, "application/json", DEFAULT_SANITIZE);
    expect(out).toEqual({ email: "a@b.c", password: REDACTED, nested: { token: REDACTED } });
  });

  it("redacts separator/snake_case/camelCase secret variants (EC2)", () => {
    const out = sanitizeBody(
      { access_token: "L", "api-key": "L", client_secret: "L", refreshToken: "L", id: 1 },
      "application/json",
      DEFAULT_SANITIZE
    );
    expect(out).toEqual({
      access_token: REDACTED,
      "api-key": REDACTED,
      client_secret: REDACTED,
      refreshToken: REDACTED,
      id: 1,
    });
  });

  it("replaces multipart/binary bodies with a placeholder (EC3)", () => {
    expect(sanitizeBody("……", "multipart/form-data; boundary=x", DEFAULT_SANITIZE)).toBe("[multipart/form-data]");
    expect(sanitizeBody(Buffer.from([0, 1, 2]) as unknown, "image/png", DEFAULT_SANITIZE)).toBe("[image/png]");
  });

  it("truncates oversized bodies (EC3)", () => {
    const big = { blob: "x".repeat(DEFAULT_SANITIZE.maxBodyBytes + 10) };
    const out = sanitizeBody(big, "application/json", DEFAULT_SANITIZE) as string;
    expect(typeof out).toBe("string");
    expect(out).toContain("[truncated");
  });

  it("passes through small JSON untouched", () => {
    expect(sanitizeBody({ id: 1 }, "application/json", DEFAULT_SANITIZE)).toEqual({ id: 1 });
    expect(sanitizeBody(null, undefined, DEFAULT_SANITIZE)).toBeNull();
  });
});
