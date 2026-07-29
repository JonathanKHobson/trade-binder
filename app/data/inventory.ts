import type { Card } from "./types";

const requestableStatuses = new Set(["not_for_trade", "not_tradable", "reserved", "traded"]);

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));

const sourceBindersFor = (card: Card) => card.sourceBinders?.length ? card.sourceBinders : [card.binderName];
const sourceLocationsFor = (card: Card) => card.sourceLocations?.length ? card.sourceLocations : [card.publicLocation];

function printKey(card: Card) {
  const printIdentity = card.scryfallId || [card.name, card.setCode, card.collectorNumber].join("|");
  return [
    card.owner,
    card.ownershipStatus,
    printIdentity,
    card.finish,
    card.condition,
    card.language,
    card.tradeStatus,
    card.tradability.key,
    card.altered,
    card.misprint,
    card.proxy,
    card.homebrew,
  ].join("\u001f");
}

/**
 * Collapses only physically identical, same-owner prints. Source binders and
 * locations are retained so a merged quantity never hides its provenance.
 */
export function consolidatePrints(cards: Card[]): Card[] {
  const groups = new Map<string, Card[]>();
  for (const card of cards) {
    const key = printKey(card);
    groups.set(key, [...(groups.get(key) || []), card]);
  }

  return Array.from(groups.values()).map((group) => {
    const [first] = group;
    const quantity = group.reduce((total, card) => total + card.quantity, 0);
    const sourceBinders = unique(group.flatMap(sourceBindersFor));
    const sourceLocations = unique(group.flatMap(sourceLocationsFor));
    const hasCompleteMarketSnapshot = group.every((card) => card.marketPrice !== null && card.marketPrice !== undefined);
    const marketTotal = hasCompleteMarketSnapshot
      ? Number(group.reduce((total, card) => total + ((card.marketPrice || 0) * card.quantity), 0).toFixed(2))
      : null;
    return {
      ...first,
      quantity,
      marketPrice: marketTotal === null ? null : Number((marketTotal / quantity).toFixed(2)),
      marketTotal,
      binderName: sourceBinders.length === 1 ? sourceBinders[0] : "Multiple binders",
      sourceBinders,
      publicLocation: sourceLocations.length === 1 ? sourceLocations[0] : "Multiple recorded locations",
      sourceLocations,
    };
  });
}

export function isTradeRequestable(card: Card) {
  return !requestableStatuses.has(card.tradeStatus) && !requestableStatuses.has(card.tradability.key);
}

export function sourceLabel(values: string[]) {
  if (values.length === 0) return "—";
  if (values.length === 1) return values[0];
  return `${values[0]} + ${values.length - 1} more`;
}
