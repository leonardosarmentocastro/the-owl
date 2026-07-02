import { describe, it, expect, afterEach } from "vitest";
import { resolve } from "node:path";
import { resolveSiteOutputDir } from "../output-dir";

const KEY = "THE_OWL_SITE_OUTPUT_DIR";
const original = process.env[KEY];
afterEach(() => {
  if (original === undefined) delete process.env[KEY];
  else process.env[KEY] = original;
});

describe("resolveSiteOutputDir", () => {
  it("defaults to <cwd>/docs/site when the var is unset", () => {
    delete process.env[KEY];
    expect(resolveSiteOutputDir()).toBe(resolve(process.cwd(), "docs/site"));
  });

  it("resolves a relative value against the current working directory", () => {
    process.env[KEY] = "public/api-docs";
    expect(resolveSiteOutputDir()).toBe(resolve(process.cwd(), "public/api-docs"));
  });

  it("uses an absolute value as-is", () => {
    process.env[KEY] = "/tmp/owl-out";
    expect(resolveSiteOutputDir()).toBe("/tmp/owl-out");
  });
});
