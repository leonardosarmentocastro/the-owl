import { expect } from "vitest";
import { TEST_NAME_HEADER } from "./constants";

/** Returns the-owl's correlation header, filled from the current Vitest test name. */
export const owlHeaders = (): Record<string, string> => {
  const testName = expect.getState().currentTestName;
  if (!testName) {
    throw new Error("owlHeaders() must be called inside a running test");
  }
  return { [TEST_NAME_HEADER]: testName };
};
