import { copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const run = promisify(execFile);
const root = process.cwd();
const clientDirectory = resolve(root, "dist", "client");
const prerenderedDirectory = resolve(root, "dist", "server", "prerendered-routes");

await run(process.execPath, ["node_modules/vinext/dist/cli.js", "build", "--prerender-all"], {
  cwd: root,
  env: {
    ...process.env,
    VITE_BASE_PATH: process.env.VITE_BASE_PATH || "/trade-binder/",
    NEXT_PUBLIC_SITE_ORIGIN: process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://jonathankhobson.github.io/trade-binder/",
    WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
  },
});

await copyFile(resolve(prerenderedDirectory, "index.html"), resolve(clientDirectory, "index.html"));
await copyFile(resolve(prerenderedDirectory, "404.html"), resolve(clientDirectory, "404.html"));
await writeFile(resolve(clientDirectory, ".nojekyll"), "");

console.log("Prepared dist/client for GitHub Pages.");
