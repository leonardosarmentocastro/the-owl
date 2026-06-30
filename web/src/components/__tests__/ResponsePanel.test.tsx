// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { ResponsePanel, type ResponseData } from "../ResponsePanel";

const ok: ResponseData = {
  status: 200, statusText: "OK", timeMs: 12, sizeBytes: 8,
  headers: { "content-type": "application/json" }, bodyText: '{"id":2}',
};

afterEach(cleanup);

describe("ResponsePanel", () => {
  it("shows the status and pretty-printed JSON body", () => {
    render(<ResponsePanel result={ok} />);
    expect(screen.getByText(/200/)).toBeTruthy();
    expect(screen.getByText(/"id": 2/)).toBeTruthy();
  });

  it("shows an error block when the fetch failed", () => {
    render(<ResponsePanel result={{ ...ok, status: 0, bodyText: "", error: "boom" }} />);
    expect(screen.getByText(/boom/)).toBeTruthy();
  });

  it("lists response headers in a read-only table", () => {
    render(<ResponsePanel result={ok} />);
    const table = screen.getByRole("table", { name: "Response headers" });
    expect(within(table).getByText("content-type")).toBeTruthy();
    expect(within(table).getByText("application/json")).toBeTruthy();
    expect(within(table).queryByRole("textbox")).toBeNull();
  });

  it("offers a copy button for the body", () => {
    render(<ResponsePanel result={ok} />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeTruthy();
  });
});
