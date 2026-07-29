export type Card = {
  id: string;
  name: string;
  quantity: number;
  owner: string;
  ownershipStatus: string;
  binderName: string;
  sourceBinders: string[];
  scryfallId: string;
  scryfallUri: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  finish: string;
  condition: string;
  language: string;
  publicLocation: string;
  sourceLocations: string[];
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
  misprint: boolean;
  proxy: boolean;
  homebrew: boolean;
  tradeStatus: string;
  sourceTradeStatus?: string;
  tradeNotes?: string;
  tradability: { key: string; label: string; rank: number; reason: string };
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
export type ViewMode = "grid" | "details" | "list" | "focus";
export type SortMode = "name" | "price-high" | "price-low" | "set";
export type BinderSection = "browse" | "wants" | "contact" | "homebrew";
export type ThemeMode = "light" | "dark";
