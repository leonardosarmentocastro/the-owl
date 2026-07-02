// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Sidebar } from "../Sidebar";
import type { Endpoint } from "../../../api";

const endpoints: Endpoint[] = [
  {
    method: "GET", route: "/users/:id",
    examples: [{ name: "returns the user", request: { url: "u", method: "GET", path: "/users/1", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: {} } }],
  },
  {
    method: "GET", route: "/users/:id/addresses",
    examples: [{ name: "returns the addresses", request: { url: "u", method: "GET", path: "/users/1/addresses", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
  },
  {
    method: "GET", route: "/health",
    examples: [{ name: "returns the application status", request: { url: "u", method: "GET", path: "/health", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: {} } }],
  },
];

afterEach(cleanup);

describe("Sidebar", () => {
  it("renders a section header per resource group", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    expect(screen.getByText("Users")).toBeTruthy();
    expect(screen.getByText("Health")).toBeTruthy();
  });

  it("renders each endpoint as a collapsible toggle under its group", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    expect(screen.getByRole("button", { name: /GET \/users\/:id$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /GET \/users\/:id\/addresses/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /GET \/health/i })).toBeTruthy();
  });

  it("links examples to their slug and fires onNavigate on click", () => {
    const onNavigate = vi.fn();
    render(<Sidebar endpoints={endpoints} activeHash="" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /GET \/health/i }));
    const link = screen.getByRole("link", { name: /returns the application status/ });
    expect(link.getAttribute("href")).toBe("#get-health-returns-the-application-status");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });

  it("strips the grouping-regex prefix so versioned routes group by version", () => {
    const versioned: Endpoint[] = [
      {
        method: "GET", route: "/api/v1/users",
        examples: [{ name: "v1 users", request: { url: "u", method: "GET", path: "/api/v1/users", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
      },
      {
        method: "GET", route: "/api/v2/users",
        examples: [{ name: "v2 users", request: { url: "u", method: "GET", path: "/api/v2/users", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
      },
    ];
    render(<Sidebar endpoints={versioned} activeHash="" grouping="^/api$" />);
    expect(screen.getByText("V1")).toBeTruthy();
    expect(screen.getByText("V2")).toBeTruthy();
    expect(screen.queryByText("Api")).toBeNull();
  });

  it("links the logo to the GitHub repository", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    const link = screen.getByRole("link", { name: /the-owl/i });
    expect(link.getAttribute("href")).toBe("https://github.com/leonardosarmentocastro/the-owl");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
