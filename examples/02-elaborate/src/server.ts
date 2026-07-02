import express, { type Express } from "express";
import theOwl from "the-owl";

const users = [
  { id: 1, name: "John" },
  { id: 2, name: "Paul" },
];

export const createApp = (): Express => {
  const app = express();
  theOwl.connect(app);
  app.use(express.json());

  app.get("/users", (_req, res) => res.status(200).json(users));
  app.get("/users/:id", (req, res) => {
    const user = users.find((u) => u.id === Number(req.params.id));
    if (!user) {
      res.status(404).json({ error: `user ${req.params.id} not found` });
      return;
    }
    res.status(200).json(user);
  });

  // Versioned APIs under a shared /api prefix. With THE_OWL_GROUPING_REGEX=^/api$
  // the docs sidebar strips /api and groups these under V1 / V2.
  app.get("/api/v1/users", (_req, res) => res.status(200).json(users));
  app.get("/api/v2/users", (_req, res) =>
    res.status(200).json(users.map((u) => ({ ...u, email: `${u.name.toLowerCase()}@example.com` }))),
  );

  if (process.env.THE_OWL_DOCS) app.use("/docs", theOwl.docs());
  return app;
};
