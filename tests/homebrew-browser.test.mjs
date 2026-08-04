import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

async function importBrowserModules() {
  const directory = await mkdtemp(join(tmpdir(), "trade-binder-homebrew-tests-"));
  for (const name of ["types", "mtg", "tradeBrowser", "homebrewBrowser"]) {
    const source = await readFile(new URL(`../app/data/${name}.ts`, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText
      .replaceAll('from "./mtg"', 'from "./mtg.js"')
      .replaceAll('from "./tradeBrowser"', 'from "./tradeBrowser.js"');
    await writeFile(join(directory, `${name}.js`), compiled);
  }
  return {
    directory,
    browser: await import(pathToFileURL(join(directory, "homebrewBrowser.js")).href),
    filters: await import(pathToFileURL(join(directory, "tradeBrowser.js")).href),
  };
}

const card = (id, name, typeLine, primary = false) => ({
  id,
  baseCardId: "CARD-1",
  name,
  variantName: name,
  variantPolicy: primary ? "default" : "optional",
  isPrimaryVariant: primary,
  typeLine,
  typeBucket: typeLine.toLowerCase(),
  oracleText: "",
  setName: "Test Set",
  setCode: "TST",
  collectorNumber: "1",
  owner: "Kyle",
  designer: "Kyle",
  tradability: { key: "homebrew_reference", label: "Homebrew / proxy" },
  sourceBinders: [],
  sourceLocations: [],
  colorIdentity: [],
  marketPrice: null,
  altered: false,
  homebrew: true,
  proxy: true,
  rarity: "rare",
  finish: "digital",
  condition: "digital master",
  language: "en",
  publicLocation: "Homebrew Forge",
});

test("grouped mode collapses variants while separate mode preserves exact records", async () => {
  const { directory, browser, filters } = await importBrowserModules();
  try {
    const cards = [card("CARD-1-V1", "Creature version", "Creature", true), card("CARD-1-V2", "Instant version", "Instant")];
    const grouped = browser.homebrewResults(cards, filters.emptyFilters, "name", false, {});
    const separate = browser.homebrewResults(cards, filters.emptyFilters, "name", true, {});
    assert.equal(grouped.length, 1);
    assert.equal(grouped[0].id, "CARD-1-V1");
    assert.deepEqual(separate.map((entry) => entry.id), ["CARD-1-V1", "CARD-1-V2"]);

    const requested = browser.homebrewResults(cards, filters.emptyFilters, "name", false, { "CARD-1": "CARD-1-V2" });
    assert.equal(requested[0].id, "CARD-1-V2");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
