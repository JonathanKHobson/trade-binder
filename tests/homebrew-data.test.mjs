import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse } from "../../../packages/forge/node_modules/csv-parse/dist/esm/sync.js";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(siteRoot, "../..");
const data = JSON.parse(await readFile(resolve(siteRoot, "public/data/homebrew-cards.json"), "utf8"));

test("homebrew inventory contains every current non-demo default or optional variant", async () => {
  const expectedIds = new Set();
  for (const entry of await readdir(resolve(repoRoot, "sets"), { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.toUpperCase() === "DEMO") continue;
    const variantsPath = resolve(repoRoot, "sets", entry.name, "card_variants.csv");
    let rows;
    try {
      rows = parse(await readFile(variantsPath, "utf8"), { columns: true, skip_empty_lines: true, relax_column_count: true });
    } catch {
      continue;
    }
    for (const row of rows) {
      if (["default", "optional"].includes(String(row.export_policy).toLowerCase()) && String(row.status).toLowerCase() !== "archived") {
        expectedIds.add(row.variant_id);
      }
    }
  }

  const actualIds = new Set(data.cards.map((card) => card.variantId));
  assert.equal(actualIds.size, data.cards.length, "variant ids must be unique");
  assert.deepEqual([...actualIds].sort(), [...expectedIds].sort());
  assert.equal(data.summary.totalVariants, expectedIds.size);
  assert.equal(data.cards.some((card) => card.setCode === "DEMO"), false);
  assert.equal(data.cards.every((card) => ["default", "optional"].includes(card.variantPolicy)), true);
});

test("named homebrew families and every linked face have complete public images", async () => {
  const requiredSets = ["SGG", "SGE", "SGW", "SGR", "BAR", "KEN", "MOTU", "RAC", "SOA"];
  const codes = new Set(data.cards.map((card) => card.setCode));
  for (const code of requiredSets) assert.equal(codes.has(code), true, `${code} must be published`);

  let faceCount = 0;
  for (const card of data.cards) {
    assert.ok(card.faces.length >= 1, `${card.id} must have a visible face`);
    faceCount += card.faces.length;
    for (const face of card.faces) {
      const path = resolve(siteRoot, "public", face.imageUrl.replace(/^\.\//, ""));
      const details = await stat(path);
      assert.ok(details.size > 5_000, `${card.id} face ${face.faceIndex} must be a complete rendered image`);
      assert.ok(face.width > 0 && face.height > 0);
    }
  }
  assert.equal(faceCount, data.summary.totalFaces);
  assert.equal(data.summary.warnings.every((warning) => !/missing|no renderable/i.test(warning)), true);
});

test("variant counts and transform face connections remain exact", () => {
  const grouped = new Map();
  for (const card of data.cards) grouped.set(card.baseCardId, [...(grouped.get(card.baseCardId) || []), card]);
  for (const variants of grouped.values()) {
    for (const card of variants) assert.equal(card.variantCount, variants.length, `${card.id} variant count`);
  }

  const motu = data.cards.find((card) => card.variantId === "MOTU-001-V1");
  assert.deepEqual(motu.faces.map((face) => face.faceName), ["Adam, Prince of Eternia", "He-Man, Defender of Eternia"]);
  const barbie = data.cards.find((card) => card.variantId === "BAR-001-V1");
  assert.deepEqual(barbie.faces.map((face) => face.faceName), ["Stereotypical Barbie", "Barbara, Choosing to Be Human"]);
  assert.ok(data.cards.some((card) => card.baseCardId === "SGE-Ancients-Data-Archive" && card.faces.length === 2));
});
