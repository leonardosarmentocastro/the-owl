import { createApp } from "./server.ts";

// Tiny dev entrypoint so you can browse the docs by hand: `pnpm start`.
// The `start` script sets THE_OWL_SITE_OUTPUT_DIR=public/api-docs (the same dir
// the build wrote to), so theOwl.docs() serves catalog.json from there.
const port = Number(process.env.PORT) || 3000;
createApp().listen(port, () => {
  console.log(`site-output-dir example server listening on http://localhost:${port}`);
  console.log(`open the interactive docs at http://localhost:${port}/docs`);
});
