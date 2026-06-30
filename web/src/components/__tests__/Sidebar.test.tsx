// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Sidebar } from "../Sidebar";
import type { Endpoint } from "../../api";

const endpoints: Endpoint[] = [
  {
    method: "GET", route: "/health",
    examples: [{ name: "returns the application status", request: { url: "u", method: "GET", path: "/health", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: {} } }],
  },
  {
    method: "GET", route: "/users",
    examples: [{ name: "returns the list of users", request: { url: "u", method: "GET", path: "/users", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
  },
];

afterEach(cleanup);

describe("Sidebar", () => {
  it("renders one collapsible group per endpoint", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    expect(screen.getByRole("button", { name: /GET \/health/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /GET \/users/i })).toBeTruthy();
  });

  it("hides examples until the group is expanded", () => {
    render(<Sidebar endpoints={endpoints} activeHash="" />);
    expect(screen.queryByText(/returns the list of users/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    expect(screen.getByText(/returns the list of users/)).toBeTruthy();
  });

  it("links each example to its slug and fires onNavigate on click", () => {
    const onNavigate = vi.fn();
    render(<Sidebar endpoints={endpoints} activeHash="" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    const link = screen.getByRole("link", { name: /returns the list of users/ });
    expect(link.getAttribute("href")).toBe("#get-users-returns-the-list-of-users");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });

  it("marks the active example link with aria-current", () => {
    render(<Sidebar endpoints={endpoints} activeHash="get-users-returns-the-list-of-users" />);
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    const link = screen.getByRole("link", { name: /returns the list of users/ });
    expect(link.getAttribute("aria-current")).toBe("page");
  });
});
