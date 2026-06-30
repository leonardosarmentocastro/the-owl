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

afterEach(() => { cleanup(); delete window.__THE_OWL_LIVE__; });

describe("ExampleAccordion", () => {
  it("is collapsed by default and shows status + name", () => {
    render(<ExampleAccordion method="GET" route="/users/:id" example={example} baseUrl="http://localhost:3000" />);
    expect(screen.getByText(/returns the user/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try it out/i })).toBeNull();
  });

  it("shows the read-only response when expanded in static mode", () => {
    render(<ExampleAccordion method="GET" route="/users/:id" example={example} baseUrl="http://localhost:3000" />);
    fireEvent.click(screen.getByText(/returns the user/));
    expect(screen.getByText(/"name": "Paul"/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try it out/i })).toBeNull();
  });

  it("shows a curl command in the static read-only view", () => {
    render(<ExampleAccordion method="GET" route="/users/:id" example={example} baseUrl="http://localhost:3000" />);
    fireEvent.click(screen.getByText(/returns the user/));
    expect(screen.getByText(/curl -X GET 'http:\/\/localhost:3000\/users\/2'/)).toBeTruthy();
  });

  it("auto-opens and carries its slug as id when activeHash matches", () => {
    const { container } = render(
      <ExampleAccordion
        method="GET"
        route="/users/:id"
        example={example}
        baseUrl="http://localhost:3000"
        activeHash="get-users-id-returns-the-user"
      />,
    );
    expect(container.querySelector("#get-users-id-returns-the-user")).toBeTruthy();
    expect(screen.getByText(/"name": "Paul"/)).toBeTruthy();
  });

  it("stays collapsed when activeHash does not match", () => {
    render(
      <ExampleAccordion
        method="GET"
        route="/users/:id"
        example={example}
        baseUrl="http://localhost:3000"
        activeHash="some-other-slug"
      />,
    );
    expect(screen.queryByText(/"name": "Paul"/)).toBeNull();
  });

  describe("live mode", () => {
    beforeEach(() => { window.__THE_OWL_LIVE__ = true; });
    it("shows the Try it out form when expanded", () => {
      render(<ExampleAccordion method="GET" route="/users/:id" example={example} baseUrl="http://localhost:3000" />);
      fireEvent.click(screen.getByText(/returns the user/));
      expect(screen.getByRole("button", { name: /try it out/i })).toBeTruthy();
    });

    it("shows a curl command alongside the live form", () => {
      render(<ExampleAccordion method="GET" route="/users/:id" example={example} baseUrl="http://localhost:3000" />);
      fireEvent.click(screen.getByText(/returns the user/));
      expect(screen.getByRole("button", { name: /try it out/i })).toBeTruthy();
      expect(screen.getByText(/curl -X GET/)).toBeTruthy();
    });
  });
});
