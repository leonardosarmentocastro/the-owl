import { describe, it, expect, vi, afterEach } from "vitest";
import { fireRequest } from "../fire";
import type { RequestFormState } from "../types";

const form: RequestFormState = {
  method: "GET",
  route: "/users/:id",
  pathParams: [{ name: "id", value: "2" }],
  query: [],
  headers: [],
  body: "",
};

afterEach(() => vi.restoreAllMocks());

describe("fireRequest", () => {
  it("returns status, body, headers and size on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response('{"id":2}', { status: 200, statusText: "OK", headers: { "content-type": "application/json" } })
      )
    );
    const result = await fireRequest(form);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.bodyText).toBe('{"id":2}');
    expect(result.headers["content-type"]).toBe("application/json");
    expect(result.sizeBytes).toBe(8);
    expect(result.error).toBeUndefined();
  });

  it("captures network failures in `error` without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("boom"); }));
    const result = await fireRequest(form);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("boom");
    expect(result.status).toBe(0);
  });
});
