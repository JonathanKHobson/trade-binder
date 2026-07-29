import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

async function importDataModules() {
  const directory = await mkdtemp(join(tmpdir(), "trade-binder-tests-"));
  const modules = ["types", "mtg", "inventory", "tradeExports"];

  try {
    for (const name of modules) {
      const source = await readFile(new URL(`../app/data/${name}.ts`, import.meta.url), "utf8");
      const compiled = ts.transpileModule(source, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
        },
      }).outputText.replaceAll('from "./mtg"', 'from "./mtg.js"');
      await writeFile(join(directory, `${name}.js`), compiled);
    }

    return {
      directory,
      inventory: await import(pathToFileURL(join(directory, "inventory.js")).href),
      exports: await import(pathToFileURL(join(directory, "tradeExports.js")).href),
    };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

test("identical print records merge without loosening owner or trade protections", async () => {
  const data = JSON.parse(await readFile(new URL("../public/data/cards.json", import.meta.url), "utf8"));
  const { directory, inventory } = await importDataModules();

  try {
    const cards = inventory.consolidatePrints(data.cards);
    const BLCAdarkar = cards.find((card) => card.name === "Adarkar Wastes" && card.setCode === "BLC" && card.collectorNumber === "291" && card.owner === "Eleni");
    const EOCAdarkar = cards.find((card) => card.name === "Adarkar Wastes" && card.setCode === "EOC" && card.collectorNumber === "147" && card.owner === "Kyle");

    assert.equal(cards.length, 1707);
    assert.equal(BLCAdarkar?.quantity, 2);
    assert.equal(BLCAdarkar?.tradability.label, "Not tradable");
    assert.equal(inventory.isTradeRequestable(BLCAdarkar), false);
    assert.equal(EOCAdarkar?.quantity, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("selection exports retain exact-print and ownership fields", async () => {
  const data = JSON.parse(await readFile(new URL("../public/data/cards.json", import.meta.url), "utf8"));
  const { directory, inventory, exports } = await importDataModules();

  try {
    const card = inventory.consolidatePrints(data.cards).find((candidate) => candidate.name === "Abomination, Terrifying Titan" && candidate.setCode === "MSH" && candidate.collectorNumber === "198");
    assert.ok(card);

    const csv = exports.buildTradeCsv([card]);
    const text = exports.buildTradeText([card]);
    const xml = exports.buildTradeXml([card]);

    assert.match(csv, /"owner"/);
    assert.match(csv, /"scryfall_uri"/);
    assert.match(csv, new RegExp(card.scryfallUri.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(text, /1 Abomination, Terrifying Titan \(MSH\) 198/);
    assert.match(text, /# Owner: Kyle/);
    assert.match(xml, /owner="Kyle"/);
    assert.match(xml, /scryfall_uri="https:\/\/scryfall\.com\/card\/msh\/198/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
