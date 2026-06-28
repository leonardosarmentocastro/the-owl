// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ResponsePanel } from "../ResponsePanel";
import type { LiveResult } from "../../request/fire";

const ok: LiveResult = {
  ok: true, status: 200, statusText: "OK", timeMs: 12, sizeBytes: 8,
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
    render(<ResponsePanel result={{ ...ok, ok: false, status: 0, bodyText: "", error: "boom" }} />);
    expect(screen.getByText(/boom/)).toBeTruthy();
  });
});
