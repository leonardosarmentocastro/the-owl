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
  theOwl.save();
  await stopServer(server);
});

describe("[get] /users", () => {
  it("(200) returns the list of users", async () => {
    const res = await fetch(`${base}/users`, { headers: owlHeaders() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, name: "John" }, { id: 2, name: "Paul" }]);
  });
});
