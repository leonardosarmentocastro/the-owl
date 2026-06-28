import { describe, it, expect } from "vitest";
import { injectLiveFlag } from "../serve";

describe("injectLiveFlag", () => {
  it("inserts the live marker before </head>", () => {
    const out = injectLiveFlag("<html><head><title>x</title></head><body></body></html>");
    expect(out).toContain("window.__OWL_LIVE__ = true");
    expect(out.indexOf("window.__OWL_LIVE__")).toBeLessThan(out.indexOf("</head>"));
  });

  it("still injects when there is no head", () => {
    const out = injectLiveFlag("<body>hi</body>");
    expect(out).toContain("window.__OWL_LIVE__ = true");
  });
});
