/** True only when the docs are served live by `theOwl.docs()` (so "Try it out"
 * can fire same-origin requests). The static build never sets this flag. */
export const isLive = (): boolean => typeof window !== "undefined" && window.__THE_OWL_LIVE__ === true;
