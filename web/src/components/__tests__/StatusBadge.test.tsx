// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

afterEach(cleanup);

describe("StatusBadge", () => {
  it("renders the status code and appends statusText when given", () => {
    render(<StatusBadge status={200} statusText="OK" />);
    expect(screen.getByText(/200 OK/)).toBeTruthy();
  });

  it("renders the bare status code when statusText is omitted", () => {
    render(<StatusBadge status={404} />);
    expect(screen.getByText("404")).toBeTruthy();
  });
});
