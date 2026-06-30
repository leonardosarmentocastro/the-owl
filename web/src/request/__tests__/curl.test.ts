import { describe, it, expect } from "vitest";
import { formatCurl } from "../curl";
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

const HOST = "http://localhost:3000";

describe("formatCurl", () => {
  it("renders a GET with the method and absolute URL, no body", () => {
    expect(formatCurl(base(), HOST)).toBe("curl -X GET 'http://localhost:3000/users/2'");
  });

  it("encodes real path param values", () => {
    expect(formatCurl(base({ pathParams: [{ name: "id", value: "a b" }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/a%20b'"
    );
  });

  it("uses a CHANGE_ME placeholder for an empty path param", () => {
    expect(formatCurl(base({ pathParams: [{ name: "id", value: "" }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/<CHANGE_ME:id>'"
    );
  });

  it("appends named query rows and encodes real values", () => {
    expect(formatCurl(base({ query: [{ name: "q", value: "a b" }, { name: "", value: "skip" }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2?q=a%20b'"
    );
  });

  it("placeholders a redacted (needsInput) query value", () => {
    expect(formatCurl(base({ query: [{ name: "token", value: "", needsInput: true }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2?token=<CHANGE_ME:token>'"
    );
  });

  it("emits one -H per named header", () => {
    expect(formatCurl(base({ headers: [{ name: "accept", value: "application/json" }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2' \\\n  -H 'accept: application/json'"
    );
  });

  it("placeholders a redacted (needsInput) header value", () => {
    expect(formatCurl(base({ headers: [{ name: "authorization", value: "", needsInput: true }] }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2' \\\n  -H 'authorization: <CHANGE_ME:authorization>'"
    );
  });

  it("includes -d with the body for non-bodyless methods", () => {
    expect(
      formatCurl(base({ method: "POST", route: "/users", pathParams: [], body: '{"name":"John"}' }), HOST)
    ).toBe("curl -X POST 'http://localhost:3000/users' \\\n  -d '{\"name\":\"John\"}'");
  });

  it("omits the body for GET even when present", () => {
    expect(formatCurl(base({ body: '{"x":1}' }), HOST)).toBe(
      "curl -X GET 'http://localhost:3000/users/2'"
    );
  });

  it("shell-escapes single quotes in the body", () => {
    expect(formatCurl(base({ method: "POST", route: "/x", pathParams: [], body: "a'b" }), HOST)).toBe(
      "curl -X POST 'http://localhost:3000/x' \\\n  -d 'a'\\''b'"
    );
  });

  it("joins without doubling the slash when baseUrl has a trailing slash", () => {
    expect(formatCurl(base(), "http://localhost:3000/")).toBe(
      "curl -X GET 'http://localhost:3000/users/2'"
    );
  });
});
