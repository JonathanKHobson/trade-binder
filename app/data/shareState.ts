import type { Filters } from "./tradeBrowser";
import type { BinderSection, SortMode, ViewMode } from "./types";

const validSections = new Set<BinderSection>(["browse", "homebrew", "wants", "contact"]);
const validViews = new Set<ViewMode>(["grid", "details", "list", "focus"]);
const validSorts = new Set<SortMode>(["name", "price-high", "price-low", "set"]);
const validColorModes = new Set(["any", "all", "exact"]);
const validComparators = new Set(["eq", "gt", "lt"]);

export type ShareState = {
  activeSection: BinderSection;
  view: ViewMode;
  sort: SortMode;
  filters: Filters;
};

type SharedTextFilter = Exclude<keyof Filters, "colors" | "colorMode" | "manaComparator" | "altered" | "playtest">;

const textFields: Array<[SharedTextFilter, string]> = [
  ["text", "q"], ["oracle", "oracle"], ["binder", "binder"], ["owner", "owner"], ["tradability", "trade"],
  ["set", "set"], ["type", "type"], ["rarity", "rarity"], ["finish", "finish"], ["condition", "condition"],
  ["language", "language"], ["location", "location"], ["minPrice", "min"], ["maxPrice", "max"], ["manaValue", "mv"],
];

export function readShareState(defaults: ShareState): ShareState {
  if (typeof window === "undefined") return defaults;
  const params = new URLSearchParams(window.location.search);
  const scope = params.get("scope");
  const section = params.get("section");
  const requestedSection = section && validSections.has(section as BinderSection) ? section as BinderSection : scope === "homebrew" ? "homebrew" : "browse";
  const filters = { ...defaults.filters };
  for (const [key, parameter] of textFields) filters[key] = params.get(parameter) || "";
  const colors = (params.get("colors") || "").split(",").filter((color) => /^[WUBRGC]$/.test(color));
  filters.colors = Array.from(new Set(colors));
  const colorMode = params.get("colorMode");
  if (colorMode && validColorModes.has(colorMode)) filters.colorMode = colorMode as Filters["colorMode"];
  const comparator = params.get("cmp");
  if (comparator && validComparators.has(comparator)) filters.manaComparator = comparator as Filters["manaComparator"];
  filters.altered = params.get("altered") === "yes" ? "yes" : "";
  filters.playtest = params.get("playtest") === "yes" ? "yes" : "";

  const view = params.get("view");
  const sort = params.get("sort");
  return {
    activeSection: requestedSection,
    view: view && validViews.has(view as ViewMode) ? view as ViewMode : defaults.view,
    sort: sort && validSorts.has(sort as SortMode) ? sort as SortMode : defaults.sort,
    filters,
  };
}

export function shareUrl(state: ShareState) {
  const url = new URL(window.location.href);
  url.search = "";
  const { filters } = state;
  url.searchParams.set("scope", state.activeSection === "homebrew" ? "homebrew" : "physical");
  if (state.activeSection === "wants" || state.activeSection === "contact") url.searchParams.set("section", state.activeSection);
  if (state.view !== "grid") url.searchParams.set("view", state.view);
  if (state.sort !== "name") url.searchParams.set("sort", state.sort);
  for (const [key, parameter] of textFields) if (filters[key]) url.searchParams.set(parameter, String(filters[key]));
  if (filters.colors.length) url.searchParams.set("colors", filters.colors.join(","));
  if (filters.colorMode !== "any") url.searchParams.set("colorMode", filters.colorMode);
  if (filters.manaComparator !== "eq") url.searchParams.set("cmp", filters.manaComparator);
  if (filters.altered) url.searchParams.set("altered", filters.altered);
  if (filters.playtest) url.searchParams.set("playtest", filters.playtest);
  return url.toString();
}
