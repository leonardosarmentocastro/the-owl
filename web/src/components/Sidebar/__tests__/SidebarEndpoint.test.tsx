// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SidebarEndpoint } from "../SidebarEndpoint";
import type { Endpoint } from "../../../api";

const endpoint: Endpoint = {
  method: "GET", route: "/users",
  examples: [{ name: "returns the list of users", request: { url: "u", method: "GET", path: "/users", query: {}, headers: {}, body: null }, response: { status: 200, headers: {}, body: [] } }],
};

afterEach(cleanup);

describe("SidebarEndpoint", () => {
  it("collapses examples until the method+route toggle is clicked", () => {
    render(<SidebarEndpoint endpoint={endpoint} activeHash="" />);
    expect(screen.queryByText(/returns the list of users/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    expect(screen.getByText(/returns the list of users/)).toBeTruthy();
  });

  it("links each example to its slug and fires onNavigate on click", () => {
    const onNavigate = vi.fn();
    render(<SidebarEndpoint endpoint={endpoint} activeHash="" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /GET \/users/i }));
    const link = screen.getByRole("link", { name: /returns the list of users/ });
    expect(link.getAttribute("href")).toBe("#get-users-returns-the-list-of-users");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });
});
