import { describe, it, expect } from "vitest";
import { parsePathParams } from "../path-params";

describe("parsePathParams", () => {
  it("maps a single param", () => {
    expect(parsePathParams("/users/:id", "/users/2")).toEqual({ id: "2" });
  });

  it("maps multiple params in route order", () => {
    expect(parsePathParams("/orgs/:org/users/:id", "/orgs/acme/users/7")).toEqual({
      org: "acme",
      id: "7",
    });
  });

  it("returns an empty object when the route has no params", () => {
    expect(parsePathParams("/health", "/health")).toEqual({});
  });

  it("url-decodes captured segment values", () => {
    expect(parsePathParams("/users/:name", "/users/jane%20doe")).toEqual({ name: "jane doe" });
  });

  it("returns empty when the concrete path does not match the template shape", () => {
    expect(parsePathParams("/users/:id", "/health")).toEqual({});
  });
});
