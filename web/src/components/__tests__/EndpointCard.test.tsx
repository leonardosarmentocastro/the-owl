// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EndpointCard } from "../EndpointCard";
import type { Endpoint } from "../../api";

const endpoint: Endpoint = {
  method: "GET",
  route: "/users/:id",
  examples: [
    {
      name: "returns the user",
      request: { url: "u", method: "GET", path: "/users/2", query: {}, headers: {}, body: null },
      response: { status: 200, headers: {}, body: { id: 2, name: "Paul" } },
    },
  ],
};

afterEach(() => { cleanup(); window.location.hash = ""; });

describe("EndpointCard", () => {
  it("forwards activeHash so a matching example opens", () => {
    render(
      <EndpointCard
        endpoint={endpoint}
        baseUrl="http://localhost:3000"
        activeHash="get-users-id-returns-the-user"
      />,
    );
    expect(screen.getByText(/"name": "Paul"/)).toBeTruthy();
  });
});
