import { describe, it, expect, vi } from "vitest";
import { groupEndpoints } from "../group-endpoints";
import type { Endpoint } from "../../api";

const ep = (method: string, route: string): Endpoint => ({
  method, route,
  examples: [{ name: "x", request: { url: "u", method, path: route, query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: {} } }],
});

const names = (eps: Endpoint[], grouping?: string) => groupEndpoints(eps, grouping).map((g) => g.name);

describe("groupEndpoints", () => {
  describe("default (no grouping regex): group by first path segment", () => {
    it("groups every endpoint under its first segment", () => {
      const groups = groupEndpoints([ep("GET", "/users/:id"), ep("GET", "/users/:id/orders"), ep("GET", "/health")]);
      expect(groups.map((g) => g.name)).toEqual(["Users", "Health"]);
      expect(groups[0].endpoints.map((e) => e.route)).toEqual(["/users/:id", "/users/:id/orders"]);
    });

    it("keeps a single endpoint under its own first segment (no prefix stripping)", () => {
      // Regression: the old shared-prefix logic mislabelled a lone /users/:id as ":ID".
      expect(names([ep("GET", "/users/:id")])).toEqual(["Users"]);
    });

    it("does not strip a segment shared by every route", () => {
      expect(names([ep("GET", "/api/v1/users"), ep("GET", "/api/v2/users")])).toEqual(["Api"]);
    });

    it("labels the root route", () => {
      expect(names([ep("GET", "/")])).toEqual(["Root"]);
    });

    it("preserves catalog order of groups and endpoints", () => {
      expect(names([ep("GET", "/health"), ep("GET", "/users/:id")])).toEqual(["Health", "Users"]);
    });

    it("returns an empty array for an empty catalog", () => {
      expect(groupEndpoints([])).toEqual([]);
    });
  });

  describe("with a grouping regex: strip the matched prefix, then group", () => {
    it("strips /api so versioned APIs group by version", () => {
      expect(names([ep("GET", "/api/v1/users"), ep("GET", "/api/v2/users")], "^/api$")).toEqual(["V1", "V2"]);
    });

    it("strips /api/vN so versioned resources merge by resource", () => {
      expect(names([ep("GET", "/api/v1/users"), ep("GET", "/api/v2/users")], "^/api/v[1-9]\\d*$")).toEqual(["Users"]);
    });

    it("strips the longest matching cumulative prefix, then groups by resource", () => {
      expect(names([ep("GET", "/api/v1/users"), ep("GET", "/api/v1/orders")], "^/api/v[1-9]\\d*$")).toEqual(["Users", "Orders"]);
    });

    it("never strips a route's last segment", () => {
      // The only prefix matching ^/api/v[1-9]\d*$ is the whole route /api/v1;
      // stripping it would leave nothing, so the route keeps its first segment.
      expect(names([ep("GET", "/api/v1")], "^/api/v[1-9]\\d*$")).toEqual(["Api"]);
    });

    it("leaves routes the regex does not match grouped by their first segment", () => {
      expect(names([ep("GET", "/api/v1/users"), ep("GET", "/health")], "^/api$")).toEqual(["V1", "Health"]);
    });

    it("falls back to first-segment grouping when the regex is invalid", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(names([ep("GET", "/api/v1/users")], "^/api/(")).toEqual(["Api"]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });
});
