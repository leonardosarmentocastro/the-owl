#!/usr/bin/env node
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runBuild } from "../build";

const [, , command] = process.argv;
if (command !== "build") {
  console.error("usage: the-owl build");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
runBuild({
  owlDir: join(process.cwd(), ".owl"),
  outDir: join(process.cwd(), "docs"),
  webBundleDir: join(here, "..", "web"), // dist/web shipped in the package
});
console.log("the-owl: docs built into ./docs/site (open index.html or serve via theOwl.docs())");
