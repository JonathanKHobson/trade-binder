import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, rename, rm, unlink, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../../../packages/forge/node_modules/playwright/index.mjs";
import { loadRenderAssetPack } from "../../../packages/forge/src/assets/assetPack.ts";
import { loadForgeProject } from "../../../packages/forge/src/data/loadProject.ts";
import type { CardFaceRecord, CardRecord, CardVariantRecord, ExportProfile } from "../../../packages/forge/src/domain/schemas.ts";
import { loadProjectReferenceCatalog } from "../../../packages/forge/src/reference/referenceStore.ts";
import { renderCardImage } from "../../../packages/forge/src/renderer/renderCard.tsx";
import { cardFaceFromVariantFace, cardRecordForVariant } from "../../../packages/forge/src/variants/cardVariants.ts";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(scriptDirectory, "..");
const repoRoot = resolve(siteRoot, "../..");
const setsRoot = resolve(repoRoot, "sets");
const publicRoot = resolve(siteRoot, "public");
const assetRoot = resolve(publicRoot, "assets/homebrew-cards");
const dataPath = resolve(publicRoot, "data/homebrew-cards.json");
const excludedSets = new Set(["DEMO"]);
const eligiblePolicies = new Set(["default", "optional"]);
const rendererFiles = [
  resolve(repoRoot, "packages/forge/src/renderer/CardSvg.tsx"),
  resolve(repoRoot, "packages/forge/src/renderer/renderCard.tsx"),
  resolve(repoRoot, "packages/forge/src/domain/themedFrames.ts"),
];

const profile: ExportProfile = {
  profileId: "trade_binder_web",
  target: "images",
  imageFormat: "jpeg",
  widthPx: 488,
  heightPx: 680,
  quality: 84,
  includeBleed: false,
  bleedPx: 0,
  includeCropMarks: false,
  includePlaytestWatermark: false,
  watermarkText: undefined,
  allowPlaceholderArt: true,
  filenameTemplate: "{{card_id}}.jpg",
};

type GeneratedFace = {
  faceIndex: number;
  faceName: string;
  manaCost: string;
  typeLine: string;
  oracleText: string;
  imageUrl: string;
  largeImageUrl: string;
  width: number;
  height: number;
};

type GeneratedCard = Record<string, unknown> & {
  id: string;
  baseCardId: string;
  variantId: string;
  sourceHash: string;
  faces: GeneratedFace[];
};

const existingCards = new Map<string, GeneratedCard>();
try {
  const existing = JSON.parse(await readFile(dataPath, "utf8")) as { cards?: GeneratedCard[] };
  for (const card of existing.cards || []) existingCards.set(card.id, card);
} catch {
  // The first generation intentionally starts without a cache.
}

const rendererRevision = createHash("sha256");
for (const path of rendererFiles) rendererRevision.update(await readFile(path));
const rendererHash = rendererRevision.digest("hex");
const referenceCatalog = loadProjectReferenceCatalog(repoRoot);
const directories = (await readdir(setsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && !excludedSets.has(entry.name.toUpperCase()))
  .map((entry) => entry.name)
  .sort();

await mkdir(assetRoot, { recursive: true });
await mkdir(dirname(dataPath), { recursive: true });

const browser = await chromium.launch({ headless: true });
const cards: GeneratedCard[] = [];
const setSummaries: Array<{ code: string; name: string; cards: number; variants: number; faces: number }> = [];
const warnings: string[] = [];
let renderedFaces = 0;
let reusedFaces = 0;

try {
  for (const setCode of directories) {
    let project;
    try {
      project = await loadForgeProject({ rootDir: repoRoot, setCode });
    } catch (error) {
      warnings.push(`${setCode}: ${(error as Error).message}`);
      continue;
    }
    const variants = project.variants.filter((variant) =>
      eligiblePolicies.has(variant.exportPolicy) && variant.status !== "archived",
    );
    if (!variants.length) continue;

    const cardById = new Map(project.cards.map((card) => [card.cardId, card]));
    const assetPack = await loadRenderAssetPack({
      rootDir: repoRoot,
      packId: project.set.defaultAssetPack || "basic-m15-local",
    });
    const setDirectory = resolve(assetRoot, setCode.toLowerCase());
    await mkdir(setDirectory, { recursive: true });
    const groupSizes = new Map<string, number>();
    for (const variant of variants) groupSizes.set(variant.cardId, (groupSizes.get(variant.cardId) || 0) + 1);

    const generated = await mapWithConcurrency(variants, 3, async (variant): Promise<GeneratedCard | null> => {
      const parent = cardById.get(variant.cardId);
      if (!parent) {
        warnings.push(`${setCode}/${variant.variantId}: parent card ${variant.cardId} is missing.`);
        return null;
      }
      const variantCard = cardRecordForVariant(parent, variant);
      const variantFaces = project.variantFaces
        .filter((face) => face.variantId === variant.variantId)
        .map((face) => cardFaceFromVariantFace(face, variant.variantId))
        .sort((left, right) => left.faceIndex - right.faceIndex);
      if (!variantFaces.length) {
        warnings.push(`${setCode}/${variant.variantId}: no renderable faces were found.`);
        return null;
      }
      const webKey = `${setCode.toLowerCase()}-${slug(variant.variantId)}`;
      const renderCard = { ...variantCard, cardId: webKey };
      const sourceHash = hash({ rendererHash, set: project.set, parent, variant, variantFaces, art: artHashInput(variantFaces, project.art) });
      const cached = existingCards.get(variant.variantId);
      const expectedFaces = variantFaces.map((face) => faceDescriptor(setCode, webKey, face));
      const canReuse = cached?.sourceHash === sourceHash
        && cached.faces.length === expectedFaces.length
        && await everyFileExists(expectedFaces.map((face) => publicFile(face.imageUrl)));
      let faces: GeneratedFace[];

      if (canReuse) {
        faces = cached.faces;
        reusedFaces += faces.length;
      } else {
        faces = await mapWithConcurrency(variantFaces, 2, async (face) => {
          const descriptor = faceDescriptor(setCode, webKey, face);
          const tempDirectory = resolve(repoRoot, ".tmp/trade-binder-homebrew", setCode.toLowerCase(), webKey);
          const result = await renderCardImage({
            card: renderCard,
            faces: variantFaces.map((candidate) => ({ ...candidate, cardId: webKey })),
            faceIndex: face.faceIndex,
            art: project.art,
            set: project.set,
            assetPack,
            exportProfile: profile,
            outDir: tempDirectory,
            rootDir: repoRoot,
            referenceCatalog,
            browser,
          });
          const destination = publicFile(descriptor.imageUrl);
          await mkdir(dirname(destination), { recursive: true });
          await rm(destination, { force: true });
          await rename(result.outputPath, destination);
          await unlink(`${result.outputPath}.svg`).catch(() => undefined);
          await unlink(`${result.outputPath}.render.json`).catch(() => undefined);
          if (result.warnings.length) warnings.push(...result.warnings.map((warning) => `${setCode}/${variant.variantId}/face-${face.faceIndex}: ${warning}`));
          renderedFaces += 1;
          return descriptor;
        });
      }

      const front = variantFaces[0];
      return generatedCard({
        parent,
        variant,
        variantCard,
        front,
        faces,
        setCode,
        setName: project.set.setName,
        designer: variant.designer || project.set.author || "Kyle",
        variantCount: groupSizes.get(variant.cardId) || 1,
        sourceHash,
      });
    });
    const setCards = generated.filter((card): card is GeneratedCard => Boolean(card));
    setCards.sort(cardOrder);
    cards.push(...setCards);
    setSummaries.push({
      code: setCode.toUpperCase(),
      name: project.set.setName,
      cards: new Set(setCards.map((card) => card.baseCardId)).size,
      variants: setCards.length,
      faces: setCards.reduce((total, card) => total + card.faces.length, 0),
    });
    console.log(`${setCode}: ${setCards.length} variants, ${setCards.reduce((total, card) => total + card.faces.length, 0)} faces`);
  }
} finally {
  await browser.close();
  await rm(resolve(repoRoot, ".tmp/trade-binder-homebrew"), { recursive: true, force: true });
}

cards.sort(cardOrder);
const output = {
  summary: {
    generatedAt: new Date().toISOString(),
    uniqueCards: new Set(cards.map((card) => card.baseCardId)).size,
    totalVariants: cards.length,
    totalFaces: cards.reduce((total, card) => total + card.faces.length, 0),
    setCount: setSummaries.length,
    sets: setSummaries,
    includedExportPolicies: ["default", "optional"],
    excludedSets: [...excludedSets],
    renderedFaces,
    reusedFaces,
    warnings,
  },
  cards,
};
await writeFile(dataPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${relative(siteRoot, dataPath)} with ${cards.length} variants and ${output.summary.totalFaces} faces.`);
if (warnings.length) console.warn(`${warnings.length} render/data warnings were recorded in the generated summary.`);

function generatedCard(args: {
  parent: CardRecord;
  variant: CardVariantRecord;
  variantCard: CardRecord;
  front: CardFaceRecord;
  faces: GeneratedFace[];
  setCode: string;
  setName: string;
  designer: string;
  variantCount: number;
  sourceHash: string;
}): GeneratedCard {
  const colors = colorArray(args.variantCard.colorIdentity);
  const binderName = `${args.setName} homebrew`;
  return {
    id: args.variant.variantId,
    baseCardId: args.parent.cardId,
    variantId: args.variant.variantId,
    variantName: args.variant.displayName,
    variantKind: args.variant.kind,
    variantPolicy: args.variant.exportPolicy,
    variantStatus: args.variant.status,
    isPrimaryVariant: args.variant.isPrimary,
    variantCount: args.variantCount,
    sourceHash: args.sourceHash,
    name: args.front.faceName || args.variantCard.name,
    quantity: 1,
    owner: args.designer,
    designer: args.designer,
    ownershipStatus: "authored",
    binderName,
    sourceBinders: [binderName],
    scryfallId: "",
    scryfallUri: "",
    setCode: args.setCode,
    setName: args.setName,
    collectorNumber: args.variantCard.collectorNumber,
    finish: "digital",
    condition: "digital master",
    language: args.variant.language || "en",
    publicLocation: "Homebrew Forge",
    sourceLocations: ["Homebrew Forge"],
    marketPrice: null,
    marketTotal: null,
    rarity: args.variantCard.rarity,
    manaCost: args.front.manaCost || "",
    manaValue: manaValue(args.front.manaCost),
    typeLine: args.front.typeLine || "",
    typeBucket: typeBucket(args.front.typeLine),
    oracleText: args.front.oracleText || "",
    colors,
    colorIdentity: colors,
    imageUrl: args.faces[0].imageUrl,
    largeImageUrl: args.faces[0].largeImageUrl,
    altered: false,
    misprint: false,
    proxy: true,
    homebrew: true,
    tradeStatus: "homebrew_reference",
    sourceTradeStatus: "homebrew_reference",
    tradeNotes: "Digital Homebrew Forge listing; a physical print is not implied.",
    tradability: {
      key: "homebrew_reference",
      label: "Homebrew / proxy",
      rank: 3,
      reason: "Fan-made Homebrew Forge design. This listing does not confirm that a physical print exists or is available.",
    },
    faces: args.faces,
  };
}

function faceDescriptor(setCode: string, webKey: string, face: CardFaceRecord): GeneratedFace {
  const filename = `${webKey}-face-${face.faceIndex}.jpg`;
  const imageUrl = `./assets/homebrew-cards/${setCode.toLowerCase()}/${filename}`;
  const landscape = /plane|phenomenon/i.test(face.frameType) || /Plane —|Phenomenon/.test(face.typeLine);
  return {
    faceIndex: face.faceIndex,
    faceName: face.faceName || "",
    manaCost: face.manaCost || "",
    typeLine: face.typeLine || "",
    oracleText: face.oracleText || "",
    imageUrl,
    largeImageUrl: imageUrl,
    width: landscape ? 680 : 488,
    height: landscape ? 488 : 680,
  };
}

function artHashInput(faces: CardFaceRecord[], art: Record<string, { checksumSha256?: string; filePath?: string; transform?: unknown; crop?: unknown }>) {
  return faces.map((face) => {
    const record = face.artId ? art[face.artId] : undefined;
    return { artId: face.artId, checksum: record?.checksumSha256, filePath: record?.filePath, transform: record?.transform, crop: record?.crop };
  });
}

function publicFile(url: string) {
  return resolve(publicRoot, url.replace(/^\.\//, ""));
}

async function everyFileExists(paths: string[]) {
  return (await Promise.all(paths.map(async (path) => {
    try { await access(path); return true; } catch { return false; }
  }))).every(Boolean);
}

async function mapWithConcurrency<T, R>(values: T[], concurrency: number, work: (value: T) => Promise<R>) {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await work(values[index]);
    }
  }));
  return results;
}

function manaValue(cost: string | undefined) {
  cost ||= "";
  const symbols = [...cost.matchAll(/\{([^}]+)\}/g)].map((match) => match[1].toUpperCase());
  if (!symbols.length) return cost.trim() ? null : 0;
  return symbols.reduce((total, symbol) => {
    if (/^\d+$/.test(symbol)) return total + Number(symbol);
    if (symbol === "X" || symbol === "Y" || symbol === "Z") return total;
    const hybrid = symbol.split("/").filter(Boolean);
    const numeric = hybrid.map(Number).filter(Number.isFinite);
    return total + (numeric.length ? Math.max(...numeric) : 1);
  }, 0);
}

function typeBucket(typeLine: string | undefined) {
  typeLine ||= "";
  const value = typeLine.toLowerCase();
  if (value.includes("land")) return "land";
  if (value.includes("creature")) return "creature";
  if (value.includes("planeswalker")) return "planeswalker";
  if (value.includes("battle")) return "battle";
  if (value.includes("artifact")) return "artifact";
  if (value.includes("enchantment")) return "enchantment";
  if (value.includes("instant")) return "instant";
  if (value.includes("sorcery")) return "sorcery";
  if (value.includes("token")) return "token";
  return "other";
}

function colorArray(value: string[] | string | undefined) {
  const tokens = Array.isArray(value) ? value : String(value || "").split("");
  return Array.from(new Set(tokens.map((token) => token.toUpperCase()).filter((token) => /^[WUBRGC]$/.test(token))));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150) || "variant";
}

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function cardOrder(left: GeneratedCard, right: GeneratedCard) {
  return String(left.setCode).localeCompare(String(right.setCode))
    || String(left.collectorNumber).localeCompare(String(right.collectorNumber), undefined, { numeric: true })
    || String(left.name).localeCompare(String(right.name))
    || left.id.localeCompare(right.id);
}
