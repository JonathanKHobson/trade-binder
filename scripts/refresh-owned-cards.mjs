import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync, gunzipSync } from "node:zlib";

const scriptDirectory = resolve(fileURLToPath(new URL(".", import.meta.url)));
const root = resolve(scriptDirectory, "..");
const destination = resolve(root, "public/data/cards.json");
const compressedDestination = resolve(root, "public/data/cards.json.gz");
const sourcePath = process.argv[2] || process.env.TRADE_BINDER_SOURCE_SNAPSHOT;

if (!sourcePath) {
  throw new Error("Usage: node scripts/refresh-owned-cards.mjs <generated-owned-card-snapshot.json-or-.gz>");
}

const raw = await readFile(resolve(sourcePath));
const text = String(sourcePath).endsWith(".gz") ? gunzipSync(raw).toString("utf8") : raw.toString("utf8");
const input = JSON.parse(text);
if (!input?.summary || !Array.isArray(input.cards)) throw new Error("Source snapshot must contain summary and cards.");

const unique = (values) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const cards = input.cards.map((card) => ({
  ...card,
  sourceBinders: unique(Array.isArray(card.sourceBinders) && card.sourceBinders.length ? card.sourceBinders : [card.binderName]),
  sourceLocations: unique(Array.isArray(card.sourceLocations) && card.sourceLocations.length ? card.sourceLocations : [card.publicLocation]),
  sourceTradeStatus: card.sourceTradeStatus || card.tradeStatus,
})).sort((left, right) => String(left.id).localeCompare(String(right.id)));

const totalQuantity = cards.reduce((total, card) => total + Number(card.quantity || 0), 0);
if (totalQuantity !== Number(input.summary.totalQuantity)) {
  throw new Error(`Source summary says ${input.summary.totalQuantity} physical cards, but its rows total ${totalQuantity}.`);
}
if (new Set(cards.map((card) => card.id)).size !== cards.length) throw new Error("Source snapshot contains duplicate public card ids.");

const payload = { summary: input.summary, cards };
const payloadJson = `${JSON.stringify(payload, null, 2)}\n`;
const manifest = {
  summary: input.summary,
  cards: [],
  compressedCatalogue: {
    path: "cards.json.gz",
    compression: "gzip",
    format: "json",
  },
};
await Promise.all([
  writeFile(destination, `${JSON.stringify(manifest, null, 2)}\n`),
  writeFile(compressedDestination, gzipSync(payloadJson)),
]);
console.log(`Wrote ${cards.length} public rows and ${totalQuantity} physical cards.`);
