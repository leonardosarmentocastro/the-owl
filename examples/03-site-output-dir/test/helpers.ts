import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/server";

export const startServer = async (): Promise<{ server: Server; base: string }> => {
  const server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address() as AddressInfo;
  return { server, base: `http://localhost:${port}` };
};

export const stopServer = (server: Server): Promise<void> =>
  new Promise((resolve) => server.close(() => resolve()));
