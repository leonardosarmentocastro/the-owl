import { describe, it, expect } from "vitest";
import { buildRequest, validateForm } from "../build-request";
import type { RequestFormState } from "../types";

const base = (over: Partial<RequestFormState> = {}): RequestFormState => ({
  method: "GET",
  route: "/users/:id",
  pathParams: [{ name: "id", value: "2" }],
  query: [],
  headers: [],
  body: "",
  ...over,
});

describe("buildRequest", () => {
  it("substitutes path params into the route", () => {
    expect(buildRequest(base()).url).toBe("/users/2");
  });

  it("url-encodes path param values", () => {
    expect(buildRequest(base({ pathParams: [{ name: "id", value: "a b" }] })).url).toBe("/users/a%20b");
  });

  it("appends non-empty query rows", () => {
    expect(buildRequest(base({ query: [{ name: "active", value: "true" }, { name: "", value: "skip" }] })).url).toBe(
      "/users/2?active=true"
    );
  });

  it("sets method and header rows", () => {
    const { init } = buildRequest(base({ method: "POST", headers: [{ name: "content-type", value: "application/json" }] }));
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });
  });

  it("omits the body for GET", () => {
    expect(buildRequest(base({ body: '{"x":1}' })).init.body).toBeUndefined();
  });

  it("includes the body string for non-GET", () => {
    expect(buildRequest(base({ method: "POST", body: '{"x":1}' })).init.body).toBe('{"x":1}');
  });
});

describe("validateForm", () => {
  it("passes a clean form", () => {
    expect(validateForm(base())).toEqual([]);
  });

  it("blocks an unfilled redacted header", () => {
    const errors = validateForm(base({ headers: [{ name: "authorization", value: "", needsInput: true }] }));
    expect(errors).toContain('Header "authorization" was redacted — enter a value');
  });

  it("blocks invalid JSON body on a non-GET", () => {
    expect(validateForm(base({ method: "POST", body: "{not json" }))).toContain("Request body is not valid JSON");
  });

  it("blocks a body that still contains the redaction placeholder", () => {
    expect(validateForm(base({ method: "POST", body: '{"p":"«redacted»"}' }))).toContain(
      "Request body still contains a redacted placeholder — replace it"
    );
  });
});
