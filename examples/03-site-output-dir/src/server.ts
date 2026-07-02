import express, { type Express } from "express";
import theOwl from "the-owl";

export const createApp = (): Express => {
  const app = express();
  theOwl.connect(app); // capture middleware
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).send("OK"));
  app.get("/users", (_req, res) => res.status(200).json([{ id: 1, name: "John" }, { id: 2, name: "Paul" }]));

  // Always serve the interactive docs live. theOwl.docs() reads
  // THE_OWL_SITE_OUTPUT_DIR to locate catalog.json, so setting the same value
  // used at build time (public/api-docs) makes it serve from the custom dir
  // without passing docs({ catalog }) explicitly.
  app.use("/docs", theOwl.docs());
  return app;
};
