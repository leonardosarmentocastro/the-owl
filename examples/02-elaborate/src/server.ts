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

  if (process.env.OWL_DOCS) app.use("/docs", theOwl.docs());
  return app;
};
