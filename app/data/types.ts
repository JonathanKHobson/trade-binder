export type Card = {
  id: string;
  name: string;
  quantity: number;
  binderName: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  finish: string;
  condition: string;
  language: string;
  publicLocation: string;
  marketPrice: number | null;
  marketTotal: number | null;
  rarity: string;
  manaCost: string;
  manaValue: number | null;
  typeLine: string;
  typeBucket: string;
  oracleText: string;
  colors: string[];
  colorIdentity: string[];
  imageUrl: string;
  largeImageUrl: string;
  altered: boolean;
  proxy: boolean;
  homebrew: boolean;
  tradability: { key: string; label: string; rank: number };
};

export type BinderData = {
  summary: {
    totalQuantity: number;
    uniqueNames: number;
    marketTotal: number;
    binders: Array<{ id: string; name: string; quantity: number }>;
  };
  cards: Card[];
};

export type Comparator = "eq" | "gt" | "lt";
export type ColorMode = "any" | "all" | "exact";
export type ViewMode = "visual" | "details" | "compact";
