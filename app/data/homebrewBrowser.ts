import { filterCards, type Filters } from "./tradeBrowser";
import type { Card, SortMode } from "./types";

export function baseCardIdentity(card: Card) {
  return card.baseCardId || card.id;
}

export function groupHomebrewCards(cards: Card[]) {
  const groups = new Map<string, Card[]>();
  for (const card of cards) {
    const key = baseCardIdentity(card);
    groups.set(key, [...(groups.get(key) || []), card]);
  }
  for (const [key, variants] of groups) groups.set(key, sortVariants(variants));
  return groups;
}

export function sortVariants(cards: Card[]) {
  return [...cards].sort((left, right) => {
    const primary = Number(Boolean(right.isPrimaryVariant)) - Number(Boolean(left.isPrimaryVariant));
    if (primary) return primary;
    const policy = Number(left.variantPolicy === "optional") - Number(right.variantPolicy === "optional");
    if (policy) return policy;
    return (left.variantName || left.name).localeCompare(right.variantName || right.name)
      || left.id.localeCompare(right.id);
  });
}

export function homebrewResults(
  cards: Card[],
  filters: Filters,
  sort: SortMode,
  showVariantsSeparately: boolean,
  activeVariantByCard: Record<string, string>,
) {
  const matches = filterCards(cards, filters, sort);
  if (showVariantsSeparately) return matches;

  const allGroups = groupHomebrewCards(cards);
  const matchingByGroup = groupHomebrewCards(matches);
  const seen = new Set<string>();
  const results: Card[] = [];
  for (const match of matches) {
    const key = baseCardIdentity(match);
    if (seen.has(key)) continue;
    seen.add(key);
    const allVariants = allGroups.get(key) || [match];
    const matchingVariants = matchingByGroup.get(key) || [match];
    const requested = activeVariantByCard[key];
    const selected = allVariants.find((card) => card.id === requested)
      || allVariants.find((card) => card.isPrimaryVariant)
      || matchingVariants[0]
      || allVariants[0];
    results.push(selected);
  }
  return results;
}

export function cardWithActiveFace(card: Card, faceIndex: number | undefined) {
  const faces = card.faces || [];
  if (!faces.length) return card;
  const face = faces.find((candidate) => candidate.faceIndex === faceIndex) || faces[0];
  return {
    ...card,
    activeFaceIndex: face.faceIndex,
    imageUrl: face.imageUrl,
    largeImageUrl: face.largeImageUrl,
  };
}
