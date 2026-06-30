// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatusText, statusLabel } from "../StatusText";

afterEach(cleanup);

describe("StatusText", () => {
  it("pairs the code with its uppercased reason phrase", () => {
    render(<StatusText status={200} />);
    expect(screen.getByText("200 OK")).toBeTruthy();
  });

  it("derives the phrase from the code for other 2xx and 4xx statuses", () => {
    expect(statusLabel(201)).toBe("201 CREATED");
    expect(statusLabel(204)).toBe("204 NO CONTENT");
    expect(statusLabel(404)).toBe("404 NOT FOUND");
  });

  it("falls back to a provided statusText for unknown codes", () => {
    expect(statusLabel(299, "Custom")).toBe("299 CUSTOM");
    expect(statusLabel(299)).toBe("299");
  });
});
