import type { Card, Comparator } from "./types";

export const colorMeta = [
  { code: "W", label: "White", asset: "./assets/mana/W.svg" },
  { code: "U", label: "Blue", asset: "./assets/mana/U.svg" },
  { code: "B", label: "Black", asset: "./assets/mana/B.svg" },
  { code: "R", label: "Red", asset: "./assets/mana/R.svg" },
  { code: "G", label: "Green", asset: "./assets/mana/G.svg" },
  { code: "C", label: "Colorless", asset: "./assets/mana/C.svg" },
] as const;

export const formatMoney = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(value);

export const titleCase = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const cardColors = (card: Card) =>
  card.colorIdentity.length > 0 ? card.colorIdentity : ["C"];

export const comparatorMatches = (
  actual: number | null,
  expected: string,
  comparator: Comparator,
) => {
  if (!expected) return true;
  if (actual === null || actual === undefined) return false;
  const value = Number(expected);
  if (Number.isNaN(value)) return true;
  if (comparator === "gt") return actual > value;
  if (comparator === "lt") return actual < value;
  return actual === value;
};

export const escapeForMail = (value: string) => encodeURIComponent(value);

export const colorLabel = (code: string) => colorMeta.find((color) => color.code === code)?.label || "Colorless";
