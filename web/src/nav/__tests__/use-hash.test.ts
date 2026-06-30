// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useHash } from "../use-hash";

afterEach(() => { cleanup(); window.location.hash = ""; });

describe("useHash", () => {
  it("returns the current hash without the leading #", () => {
    window.location.hash = "#get-users-200";
    const { result } = renderHook(() => useHash());
    expect(result.current).toBe("get-users-200");
  });

  it("updates when a hashchange event fires", () => {
    const { result } = renderHook(() => useHash());
    act(() => {
      window.location.hash = "#changed";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current).toBe("changed");
  });
});
