import type { Card, Comparator } from "./types";

export const colorMeta = [
  { code: "W", label: "White", symbol: "☼" },
  { code: "U", label: "Blue", symbol: "◌" },
  { code: "B", label: "Black", symbol: "◐" },
  { code: "R", label: "Red", symbol: "✦" },
  { code: "G", label: "Green", symbol: "✿" },
  { code: "C", label: "Colorless", symbol: "◇" },
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
