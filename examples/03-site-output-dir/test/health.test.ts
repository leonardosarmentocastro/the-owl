import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import theOwl from "the-owl";
import { owlHeaders } from "the-owl/vitest";
import { startServer, stopServer } from "./helpers";

let server: Server;
let base: string;

beforeAll(async () => {
  ({ server, base } = await startServer());
});
afterAll(async () => {
  theOwl.save(); // drain this file's Examples to .owl/
  await stopServer(server);
});

describe("[get] /health", () => {
  it("(200) returns the application status", async () => {
    const res = await fetch(`${base}/health`, {
      headers: { "your-custom-header": "appears in the docs; the-owl's header is filtered out", ...owlHeaders() },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });
});
