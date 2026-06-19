import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import theOwl from "the-owl";
import { owlHeaders } from "the-owl/vitest";
import { startServer, stopServer } from "./helpers";

let server: Server;
let base: string;
beforeAll(async () => { ({ server, base } = await startServer()); });
afterAll(async () => { theOwl.save(); await stopServer(server); });

describe("[get] /users/:id", () => {
  it("(200) returns the given user if it exists", async () => {
    // EC1 demo: an UNMARKED warm-up call to a different endpoint (mimics setup/seeding).
    // It must NOT appear in the docs because it carries no owlHeaders().
    await fetch(`${base}/users`); // no owlHeaders → ignored

    const res = await fetch(`${base}/users/1`, { headers: owlHeaders() }); // marked → documented
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, name: "John" });
  });

  it("(404) returns an error if the given user doesn't exist", async () => {
    const res = await fetch(`${base}/users/999`, { headers: owlHeaders() });
    expect(res.status).toBe(404);
  });
});
