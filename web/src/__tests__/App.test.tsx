// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("../api", () => ({
  DEFAULT_DOCS_HOST: "http://localhost:3000",
  loadCatalog: vi.fn(async () => ({
    generatedAt: "2026-06-30T00:00:00.000Z",
    endpoints: [
      {
        method: "GET", route: "/users",
        examples: [{ name: "returns the list of users", request: { url: "u", method: "GET", path: "/users", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
      },
    ],
  })),
}));

const stubMatchMedia = (matches: boolean) =>
  Object.defineProperty(window, "matchMedia", {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches, media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    }),
  });

import { App } from "../App";

beforeEach(() => stubMatchMedia(false));
afterEach(() => { cleanup(); window.location.hash = ""; });

describe("App", () => {
  it("renders the content heading and the sidebar nav group", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: /API docs/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /GET \/users/i })).toBeTruthy();
  });
});
