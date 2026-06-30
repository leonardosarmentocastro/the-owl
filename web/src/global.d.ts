interface Window {
  __THE_OWL_LIVE__?: boolean;
}

// Lets TypeScript accept CSS side-effect imports (e.g. `import "./index.css"` in
// main.tsx). Vite handles the actual bundling; this just stops `tsc` from erroring
// on a module it has no type declarations for.
declare module "*.css";
