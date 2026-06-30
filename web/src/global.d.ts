interface Window {
  __THE_OWL_LIVE__?: boolean;
}

// Lets TypeScript accept CSS side-effect imports (e.g. `import "./index.css"` in
// main.tsx). Vite handles the actual bundling; this just stops `tsc` from erroring
// on a module it has no type declarations for.
declare module "*.css";

// Lets TypeScript accept SVG imports as strings (e.g. `import logoUrl from "./logo.svg"`).
// Vite handles the actual bundling; this just stops `tsc` from erroring
// on a module it has no type declarations for.
declare module "*.svg" {
  const src: string;
  export default src;
}
