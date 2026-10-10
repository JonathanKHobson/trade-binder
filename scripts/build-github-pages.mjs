import { copyFile, readFile, writeFile } from "node:fs/promises";
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
const indexPath = resolve(clientDirectory, "index.html");
const indexHtml = await readFile(indexPath, "utf8");
const forwarding = `<script data-gm-sites-forward>
(function () {
  if (location.hostname !== 'jonathankhobson.github.io') return;
  if (new URLSearchParams(location.search).get('_legacy') === '1') return;
  const sourcePrefix = '/trade-binder/';
  if (!location.pathname.startsWith(sourcePrefix)) return;
  location.replace('https://gamemaster-kyle.jkylehobson.chatgpt.site/trade-binder/' + location.pathname.slice(sourcePrefix.length) + location.search + location.hash);
})();
</script>`;
if (!indexHtml.includes("</head>") || !indexHtml.includes("<body")) {
  throw new Error("Expected prerendered HTML document for compatibility forwarding");
}
await writeFile(indexPath, indexHtml.replace(/(<head[^>]*>)/, '$1' + forwarding)
  .replace(/(<body[^>]*>)/, '$1<noscript><p><a href="https://gamemaster-kyle.jkylehobson.chatgpt.site/trade-binder/">Open Trade Binder at GameMasterKyle</a></p></noscript>'));
await writeFile(resolve(clientDirectory, ".nojekyll"), "");

console.log("Prepared dist/client for GitHub Pages.");
