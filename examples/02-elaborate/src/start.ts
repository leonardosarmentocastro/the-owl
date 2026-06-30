import { createApp } from "./server.ts";

// Tiny dev entrypoint so you can browse the docs by hand: `pnpm start`.
// `createApp()` reads THE_OWL_DOCS at call time, so the `start` script sets it.
const port = Number(process.env.PORT) || 3000;
createApp().listen(port, () => {
  console.log(`elaborate listening on http://localhost:${port}`);
  console.log(`open the interactive docs at http://localhost:${port}/docs`);
});
