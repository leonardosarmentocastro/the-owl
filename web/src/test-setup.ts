// Polyfills so Radix primitives render under jsdom. Guarded so the node-env
// `src/` tests (no DOM globals) import this file without throwing.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView ||= function () {};
  Element.prototype.hasPointerCapture ||= function () {
    return false;
  };
  Element.prototype.releasePointerCapture ||= function () {};
}
