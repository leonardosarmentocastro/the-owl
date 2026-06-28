// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ExampleAccordion } from "../ExampleAccordion";
import type { Example } from "../../api";

const example: Example = {
  name: "returns the user",
  request: { url: "u", method: "GET", path: "/users/2", query: {}, headers: {}, body: null },
  response: { status: 200, headers: {}, body: { id: 2, name: "Paul" } },
};

afterEach(() => { cleanup(); delete window.__OWL_LIVE__; });

describe("ExampleAccordion", () => {
  it("is collapsed by default and shows status + name", () => {
    render(<ExampleAccordion method="GET" route="/users/:id" example={example} />);
    expect(screen.getByText(/returns the user/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try it out/i })).toBeNull();
  });

  it("shows the read-only response when expanded in static mode", () => {
    render(<ExampleAccordion method="GET" route="/users/:id" example={example} />);
    fireEvent.click(screen.getByText(/returns the user/));
    expect(screen.getByText(/"name": "Paul"/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try it out/i })).toBeNull();
  });

  describe("live mode", () => {
    beforeEach(() => { window.__OWL_LIVE__ = true; });
    it("shows the Try it out form when expanded", () => {
      render(<ExampleAccordion method="GET" route="/users/:id" example={example} />);
      fireEvent.click(screen.getByText(/returns the user/));
      expect(screen.getByRole("button", { name: /try it out/i })).toBeTruthy();
    });
  });
});
