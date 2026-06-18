import { describe, it, expect } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import { createCollector } from "../src/collector";
import { makeCaptureMiddleware } from "../src/capture";
import { TEST_NAME_HEADER } from "../src/headers";

const start = async () => {
  const collector = createCollector();
  const app = express();
  app.use(express.json());
  app.use(makeCaptureMiddleware(collector));
  app.get("/health", (_req, res) => res.status(200).send("OK"));
  const users = express.Router();
  users.get("/:id", (req, res) => res.json({ id: req.params.id }));
  app.use("/users", users);
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address() as AddressInfo;
  return { collector, server, base: `http://localhost:${port}` };
};

describe("capture middleware", () => {
  it("auto-resolves the mounted route template (no x-req-original-path)", async () => {
    const { collector, server, base } = await start();
    await fetch(`${base}/users/1`, { headers: { [TEST_NAME_HEADER]: "(200) returns user" } });
    server.close();

    const [endpoint] = collector.drain();
    expect(endpoint.method).toBe("GET");
    expect(endpoint.route).toBe("/users/:id");
    expect(endpoint.examples[0].name).toBe("(200) returns user");
    expect(endpoint.examples[0].response.body).toEqual({ id: "1" });
  });

  it("captures res.send bodies and ignores untagged requests", async () => {
    const { collector, server, base } = await start();
    await fetch(`${base}/health`, { headers: { [TEST_NAME_HEADER]: "(200) ok" } });
    await fetch(`${base}/health`); // untagged
    server.close();

    const endpoints = collector.drain();
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].examples[0].response.body).toBe("OK");
  });

  it("does not write x-test-name onto the outgoing response", async () => {
    const { server, base } = await start();
    const res = await fetch(`${base}/health`, { headers: { [TEST_NAME_HEADER]: "x" } });
    server.close();
    expect(res.headers.get(TEST_NAME_HEADER)).toBeNull();
  });

  it("redacts sensitive request headers in the captured Example (EC2)", async () => {
    const { collector, server, base } = await start();
    await fetch(`${base}/health`, {
      headers: { [TEST_NAME_HEADER]: "(200) ok", authorization: "Bearer super-secret" },
    });
    server.close();
    const [endpoint] = collector.drain();
    expect(endpoint.examples[0].request.headers.authorization).toBe("«redacted»");
  });
});
