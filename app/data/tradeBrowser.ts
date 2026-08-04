import { cardColors, comparatorMatches } from "./mtg";
import type { Card, ColorMode, Comparator, SortMode } from "./types";

export type Filters = {
  text: string;
  oracle: string;
  binder: string;
  owner: string;
  tradability: string;
  set: string;
  type: string;
  rarity: string;
  finish: string;
  condition: string;
  language: string;
  location: string;
  minPrice: string;
  maxPrice: string;
  manaValue: string;
  manaComparator: Comparator;
  colors: string[];
  colorMode: ColorMode;
  altered: "" | "yes";
  playtest: "" | "yes";
  variantPolicy: string;
};

export const emptyFilters: Filters = {
  text: "",
  oracle: "",
  binder: "",
  owner: "",
  tradability: "",
  set: "",
  type: "",
  rarity: "",
  finish: "",
  condition: "",
  language: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  manaValue: "",
  manaComparator: "eq",
  colors: [],
  colorMode: "any",
  altered: "",
  playtest: "",
  variantPolicy: "",
};

export function distinct(cards: Card[], field: keyof Card) {
  return Array.from(
    new Set(cards.map((card) => String(card[field] || "")).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
}

export const distinctBinderNames = (cards: Card[]) => Array.from(new Set(cards.flatMap((card) => card.sourceBinders?.length ? card.sourceBinders : [card.binderName]))).sort((left, right) => left.localeCompare(right));
export const distinctLocations = (cards: Card[]) => Array.from(new Set(cards.flatMap((card) => card.sourceLocations?.length ? card.sourceLocations : [card.publicLocation]))).sort((left, right) => left.localeCompare(right));

function matchesColors(card: Card, filters: Filters) {
  if (filters.colors.length === 0) return true;
  const identity = cardColors(card);
  if (filters.colorMode === "all") {
    return filters.colors.every((color) => identity.includes(color));
  }
  if (filters.colorMode === "exact") {
    return identity.length === filters.colors.length && filters.colors.every((color) => identity.includes(color));
  }
  return filters.colors.some((color) => identity.includes(color));
}

function valueBetween(value: number | null, minimum: string, maximum: string) {
  if (!minimum && !maximum) return true;
  if (value === null || value === undefined) return false;
  return (!minimum || value >= Number(minimum)) && (!maximum || value <= Number(maximum));
}

function sortCards(cards: Card[], sort: SortMode) {
  return [...cards].sort((left, right) => {
    if (sort === "price-high") return (right.marketPrice ?? -1) - (left.marketPrice ?? -1) || left.name.localeCompare(right.name);
    if (sort === "price-low") return (left.marketPrice ?? Number.POSITIVE_INFINITY) - (right.marketPrice ?? Number.POSITIVE_INFINITY) || left.name.localeCompare(right.name);
    if (sort === "set") return left.setName.localeCompare(right.setName) || left.collectorNumber.localeCompare(right.collectorNumber, undefined, { numeric: true });
    return left.name.localeCompare(right.name);
  });
}

export function filterCards(cards: Card[], filters: Filters, sort: SortMode) {
  const query = filters.text.trim().toLowerCase();
  const oracle = filters.oracle.trim().toLowerCase();
  return sortCards(cards.filter((card) => {
    const queryText = [card.name, card.variantName, card.variantKind, card.setName, card.setCode, card.typeLine, card.owner, card.designer, card.tradability.label, ...card.sourceBinders, ...card.sourceLocations].join(" ").toLowerCase();
    return (
      (!query || queryText.includes(query)) &&
      (!oracle || card.oracleText.toLowerCase().includes(oracle)) &&
      (!filters.binder || card.sourceBinders.includes(filters.binder)) &&
      (!filters.owner || card.owner === filters.owner) &&
      (!filters.tradability || card.tradability.key === filters.tradability) &&
      (!filters.set || card.setCode === filters.set) &&
      (!filters.type || card.typeBucket === filters.type) &&
      (!filters.rarity || card.rarity === filters.rarity) &&
      (!filters.finish || card.finish === filters.finish) &&
      (!filters.condition || card.condition === filters.condition) &&
      (!filters.language || card.language === filters.language) &&
      (!filters.location || card.sourceLocations.includes(filters.location)) &&
      (!filters.altered || card.altered) &&
      (!filters.playtest || card.homebrew || card.proxy) &&
      (!filters.variantPolicy || card.variantPolicy === filters.variantPolicy) &&
      matchesColors(card, filters) &&
      valueBetween(card.marketPrice, filters.minPrice, filters.maxPrice) &&
      comparatorMatches(card.manaValue, filters.manaValue, filters.manaComparator)
    );
  }), sort);
}

export function activeFilterCount(filters: Filters) {
  return Object.entries(filters).filter(([key, value]) =>
    !["manaComparator", "colorMode"].includes(key) && (Array.isArray(value) ? value.length > 0 : Boolean(value)),
  ).length;
}
