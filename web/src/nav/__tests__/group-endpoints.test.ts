import { describe, it, expect } from "vitest";
import { groupEndpoints } from "../group-endpoints";
import type { Endpoint } from "../../api";

const ep = (method: string, route: string): Endpoint => ({
  method, route,
  examples: [{ name: "x", request: { url: "u", method, path: route, query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: {} } }],
});

const names = (eps: Endpoint[]) => groupEndpoints(eps).map((g) => g.name);

describe("groupEndpoints", () => {
  it("returns an empty array for an empty catalog", () => {
    expect(groupEndpoints([])).toEqual([]);
  });

  it("groups by first segment when routes share no prefix", () => {
    const groups = groupEndpoints([ep("GET", "/users/:id"), ep("GET", "/users/:id/addresses"), ep("GET", "/health")]);
    expect(groups.map((g) => g.name)).toEqual(["Users", "Health"]);
    expect(groups[0].endpoints.map((e) => e.route)).toEqual(["/users/:id", "/users/:id/addresses"]);
  });

  it("strips a prefix shared by every route", () => {
    expect(names([ep("GET", "/api/users/:id"), ep("GET", "/api/users/:id/addresses"), ep("GET", "/api/health")]))
      .toEqual(["Users", "Health"]);
  });

  it("groups multi-version APIs by version (documented behavior)", () => {
    expect(names([ep("GET", "/api/v1/users"), ep("GET", "/api/v1/orders"), ep("GET", "/api/v2/users"), ep("GET", "/api/v2/orders")]))
      .toEqual(["V1", "V2"]);
  });

  it("keeps the last segment for a single endpoint", () => {
    expect(names([ep("GET", "/api/health")])).toEqual(["Health"]);
  });

  it("labels the root route", () => {
    expect(names([ep("GET", "/")])).toEqual(["Root"]);
  });

  it("preserves catalog order of groups and endpoints", () => {
    expect(names([ep("GET", "/health"), ep("GET", "/users/:id")])).toEqual(["Health", "Users"]);
  });
});
