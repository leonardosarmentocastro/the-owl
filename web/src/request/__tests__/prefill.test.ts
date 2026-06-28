import { describe, it, expect } from "vitest";
import { prefillFromExample } from "../prefill";
import type { Example } from "../../api";

const example = (over: Partial<Example["request"]> = {}): Example => ({
  name: "(200) ok",
  request: {
    url: "u",
    method: "POST",
    path: "/users/2",
    query: { active: "true" },
    headers: { "x-test-name": "login.test.ts", "content-type": "application/json", authorization: "«redacted»" },
    body: { email: "a@b.io", password: "«redacted»" },
    ...over,
  },
  response: { status: 200, headers: {}, body: null },
});

describe("prefillFromExample", () => {
  it("drops the owl test header", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.headers.find((h) => h.name === "x-test-name")).toBeUndefined();
  });

  it("empties + flags redacted header values", () => {
    const form = prefillFromExample(example(), "/users/:id");
    const auth = form.headers.find((h) => h.name === "authorization");
    expect(auth).toEqual({ name: "authorization", value: "", needsInput: true });
  });

  it("keeps normal header values", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.headers.find((h) => h.name === "content-type")?.value).toBe("application/json");
  });

  it("fills path params from the captured path", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.pathParams).toEqual([{ name: "id", value: "2" }]);
  });

  it("builds query rows", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.query).toEqual([{ name: "active", value: "true" }]);
  });

  it("clears redacted values inside the body JSON and pretty-prints it", () => {
    const form = prefillFromExample(example(), "/users/:id");
    expect(form.body).toBe(JSON.stringify({ email: "a@b.io", password: "" }, null, 2));
  });

  it("uses an empty body string when there is no body", () => {
    const form = prefillFromExample(example({ body: null }), "/users/:id");
    expect(form.body).toBe("");
  });

  it("carries the method through", () => {
    expect(prefillFromExample(example(), "/users/:id").method).toBe("POST");
  });
});
