import express, { type Express } from "express";
import theOwl from "the-owl";

export const createApp = (): Express => {
  const app = express();
  theOwl.connect(app); // capture middleware
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).send("OK"));
  app.get("/users", (_req, res) => res.status(200).json([{ id: 1, name: "John" }, { id: 2, name: "Paul" }]));
  return app;
};
