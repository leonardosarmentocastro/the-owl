import { describe, it, expect } from "vitest";
import { createCollector } from "../collector";
import type { CapturedRequest, CapturedResponse } from "../../types";

const request = (path: string): CapturedRequest => ({
  url: `http://localhost${path}`, method: "GET", path, query: {}, headers: {}, body: null,
});
const response = (status: number, body: unknown = null): CapturedResponse => ({ status, headers: {}, body });

describe("collector", () => {
  it("groups examples under one endpoint by method+route", () => {
    const c = createCollector();
    c.record({ testName: "(200) ok", method: "GET", route: "/users/:id", request: request("/users/1"), response: response(200) });
    c.record({ testName: "(500) missing", method: "GET", route: "/users/:id", request: request("/users/9"), response: response(500) });

    const endpoints = c.drain();
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].route).toBe("/users/:id");
    expect(endpoints[0].examples.map((e) => e.name)).toEqual(["(200) ok", "(500) missing"]);
  });

  it("dedupes by testName+method+route (res.json then res.end fires twice)", () => {
    const c = createCollector();
    c.record({ testName: "(200) ok", method: "GET", route: "/h", request: request("/h"), response: response(200, "OK") });
    c.record({ testName: "(200) ok", method: "GET", route: "/h", request: request("/h"), response: response(200, null) });
    const [endpoint] = c.drain();
    expect(endpoint.examples).toHaveLength(1);
    expect(endpoint.examples[0].response.body).toBe("OK");
  });

  it("lets ONE test document several endpoints (EC1: setup + request under test)", () => {
    const c = createCollector();
    // same title, two different endpoints hit during one test
    c.record({ testName: "(200) by-customer", method: "POST", route: "/customers/sign-up", request: request("/customers/sign-up"), response: response(200) });
    c.record({ testName: "(200) by-customer", method: "GET", route: "/orders/by-customer", request: request("/orders/by-customer"), response: response(200) });

    const endpoints = c.drain();
    expect(endpoints.map((e) => `${e.method} ${e.route}`).sort()).toEqual([
      "GET /orders/by-customer",
      "POST /customers/sign-up",
    ]);
    // each endpoint carries the test's title as its Example name
    expect(endpoints.every((e) => e.examples[0].name === "(200) by-customer")).toBe(true);
  });

  it("separates distinct endpoints", () => {
    const c = createCollector();
    c.record({ testName: "a", method: "GET", route: "/a", request: request("/a"), response: response(200) });
    c.record({ testName: "b", method: "POST", route: "/b", request: request("/b"), response: response(201) });
    expect(c.drain()).toHaveLength(2);
  });
});
