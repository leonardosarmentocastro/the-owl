import { describe, it, expect } from "vitest";
import { exampleSlug } from "../slug";

describe("exampleSlug", () => {
  it("builds a lowercase, url-safe slug from method, route and name", () => {
    expect(exampleSlug("GET", "/users/:id", "returns the user")).toBe(
      "get-users-id-returns-the-user",
    );
  });

  it("collapses route separators and punctuation into single dashes", () => {
    expect(exampleSlug("GET", "/health", "(200) returns the application status")).toBe(
      "get-health-200-returns-the-application-status",
    );
  });

  it("is deterministic for the same inputs", () => {
    const a = exampleSlug("POST", "/orders", "creates an order");
    const b = exampleSlug("POST", "/orders", "creates an order");
    expect(a).toBe(b);
  });
});
