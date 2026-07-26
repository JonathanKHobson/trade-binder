"use client";

/* The card feed mixes local records and Scryfall image URLs, so native images
 * preserve its exact source identity in this read-only approval prototype. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import {
  cardColors,
  colorMeta,
  comparatorMatches,
  escapeForMail,
  formatMoney,
  titleCase,
} from "../data/mtg";
import type { BinderData, Card, ColorMode, Comparator, ViewMode } from "../data/types";

type Filters = {
  text: string;
  oracle: string;
  binder: string;
  set: string;
  type: string;
  rarity: string;
  finish: string;
  condition: string;
  language: string;
  location: string;
  availability: string;
  minPrice: string;
  maxPrice: string;
  manaValue: string;
  manaComparator: Comparator;
  colors: string[];
  colorMode: ColorMode;
  availableOnly: boolean;
  altered: "" | "yes";
  playtest: "" | "yes";
};

const emptyFilters: Filters = {
  text: "", oracle: "", binder: "", set: "", type: "", rarity: "", finish: "", condition: "", language: "", location: "", availability: "", minPrice: "", maxPrice: "", manaValue: "", manaComparator: "eq", colors: [], colorMode: "any", availableOnly: false, altered: "", playtest: "",
};

const availabilityOrder: Record<string, number> = { trade: 0, available: 0, ask: 1, review: 2, not_for_trade: 3 };

function distinct(cards: Card[], field: keyof Card) {
  return Array.from(new Set(cards.map((card) => String(card[field] || "")).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function matchesColors(card: Card, filters: Filters) {
  if (filters.colors.length === 0) return true;
  const identity = cardColors(card);
  if (filters.colorMode === "all") return filters.colors.every((color) => identity.includes(color));
  if (filters.colorMode === "exact") return identity.length === filters.colors.length && filters.colors.every((color) => identity.includes(color));
  return filters.colors.some((color) => identity.includes(color));
}

function valueBetween(value: number | null, minimum: string, maximum: string) {
  if (!minimum && !maximum) return true;
  if (value === null || value === undefined) return false;
  return (!minimum || value >= Number(minimum)) && (!maximum || value <= Number(maximum));
}

function filteredCards(cards: Card[], filters: Filters) {
  const query = filters.text.trim().toLowerCase();
  const oracle = filters.oracle.trim().toLowerCase();
  return cards.filter((card) => {
    const queryText = [card.name, card.setName, card.setCode, card.typeLine, card.binderName].join(" ").toLowerCase();
    return (!query || queryText.includes(query)) && (!oracle || card.oracleText.toLowerCase().includes(oracle)) && (!filters.binder || card.binderName === filters.binder) && (!filters.set || card.setCode === filters.set) && (!filters.type || card.typeBucket === filters.type) && (!filters.rarity || card.rarity === filters.rarity) && (!filters.finish || card.finish === filters.finish) && (!filters.condition || card.condition === filters.condition) && (!filters.language || card.language === filters.language) && (!filters.location || card.publicLocation === filters.location) && (!filters.availability || card.tradability.key === filters.availability) && (!filters.availableOnly || card.tradability.key === "available") && (!filters.altered || card.altered) && (!filters.playtest || card.homebrew || card.proxy) && matchesColors(card, filters) && valueBetween(card.marketPrice, filters.minPrice, filters.maxPrice) && comparatorMatches(card.manaValue, filters.manaValue, filters.manaComparator);
  }).sort((left, right) => (availabilityOrder[left.tradability.key] ?? 9) - (availabilityOrder[right.tradability.key] ?? 9) || left.name.localeCompare(right.name));
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Any {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{label === "Set" ? option : titleCase(option)}</option>)}</select></label>;
}

function AdvancedFilters({ cards, filters, setFilters, onClose, onReset }: { cards: Card[]; filters: Filters; setFilters: (next: Filters) => void; onClose: () => void; onReset: () => void }) {
  const change = <Key extends keyof Filters>(key: Key, value: Filters[Key]) => setFilters({ ...filters, [key]: value });
  const toggleColor = (color: string) => change("colors", filters.colors.includes(color) ? filters.colors.filter((item) => item !== color) : [...filters.colors, color]);
  return <div className="filter-layer" role="presentation" onMouseDown={onClose}>
    <section className="filter-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-heading" onMouseDown={(event) => event.stopPropagation()}>
      <header className="sheet-header"><div><p className="eyebrow">Advanced search</p><h2 id="filter-heading">Find the exact print</h2><p>Use familiar Magic fields. Active filters update the result count immediately.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close advanced search">×</button></header>
      <div className="filter-sections">
        <section><h3>Card text</h3><div className="field-grid two"><label className="field"><span>Card name or set</span><input value={filters.text} onChange={(event) => change("text", event.target.value)} placeholder="e.g. Green Goblin, Fallout" /></label><label className="field"><span>Oracle text</span><input value={filters.oracle} onChange={(event) => change("oracle", event.target.value)} placeholder="e.g. treasure, flying" /></label></div></section>
        <section><h3>Card identity</h3><div className="color-filter-row" aria-label="Color identity">{colorMeta.map((color) => <button key={color.code} type="button" className={`mana-button ${filters.colors.includes(color.code) ? "is-active" : ""}`} onClick={() => toggleColor(color.code)} aria-pressed={filters.colors.includes(color.code)} title={color.label}>{color.symbol}</button>)}<select className="color-mode" aria-label="Color identity match" value={filters.colorMode} onChange={(event) => change("colorMode", event.target.value as ColorMode)}><option value="any">Has any selected</option><option value="all">Has all selected</option><option value="exact">Exactly these colors</option></select></div><div className="field-grid three"><FilterSelect label="Type" value={filters.type} onChange={(value) => change("type", value)} options={distinct(cards, "typeBucket")} /><FilterSelect label="Rarity" value={filters.rarity} onChange={(value) => change("rarity", value)} options={distinct(cards, "rarity")} /><label className="field"><span>Mana value</span><div className="compound-field"><select aria-label="Mana value comparator" value={filters.manaComparator} onChange={(event) => change("manaComparator", event.target.value as Comparator)}><option value="eq">=</option><option value="gt">&gt;</option><option value="lt">&lt;</option></select><input inputMode="numeric" value={filters.manaValue} onChange={(event) => change("manaValue", event.target.value)} placeholder="Any" /></div></label></div></section>
        <section><h3>Print &amp; trade details</h3><div className="field-grid three"><FilterSelect label="Binder" value={filters.binder} onChange={(value) => change("binder", value)} options={distinct(cards, "binderName")} /><FilterSelect label="Set" value={filters.set} onChange={(value) => change("set", value)} options={Array.from(new Set(cards.map((card) => card.setCode))).sort()} /><FilterSelect label="Availability" value={filters.availability} onChange={(value) => change("availability", value)} options={Array.from(new Set(cards.map((card) => card.tradability.key))).sort()} /><FilterSelect label="Finish" value={filters.finish} onChange={(value) => change("finish", value)} options={distinct(cards, "finish")} /><FilterSelect label="Condition" value={filters.condition} onChange={(value) => change("condition", value)} options={distinct(cards, "condition")} /><FilterSelect label="Language" value={filters.language} onChange={(value) => change("language", value)} options={distinct(cards, "language")} /><FilterSelect label="Location" value={filters.location} onChange={(value) => change("location", value)} options={distinct(cards, "publicLocation")} /><label className="field"><span>Minimum price</span><input inputMode="decimal" value={filters.minPrice} onChange={(event) => change("minPrice", event.target.value)} placeholder="$0.00" /></label><label className="field"><span>Maximum price</span><input inputMode="decimal" value={filters.maxPrice} onChange={(event) => change("maxPrice", event.target.value)} placeholder="No maximum" /></label></div><div className="switch-row"><button type="button" className={`toggle-button ${filters.altered ? "is-active" : ""}`} onClick={() => change("altered", filters.altered ? "" : "yes")} aria-pressed={Boolean(filters.altered)}>Altered only</button><button type="button" className={`toggle-button ${filters.playtest ? "is-active" : ""}`} onClick={() => change("playtest", filters.playtest ? "" : "yes")} aria-pressed={Boolean(filters.playtest)}>Playtest / proxy only</button></div></section>
      </div>
      <footer className="sheet-footer"><button type="button" className="text-action" onClick={onReset}>Reset all</button><button type="button" className="primary-action" onClick={onClose}>Show matching cards</button></footer>
    </section>
  </div>;
}

function CardItem({ card, view, selected, onToggle, onPreview }: { card: Card; view: ViewMode; selected: boolean; onToggle: () => void; onPreview: () => void }) {
  const availability = card.tradability.label;
  if (view === "compact") return <article className={`compact-card ${selected ? "is-selected" : ""}`}><label className="check-control"><input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Add ${card.name} to trade list`} /><span /></label><button type="button" className="compact-name" onClick={onPreview}>{card.name}</button><span className="set-cell">{card.setCode} · {card.collectorNumber}</span><span>{card.typeBucket}</span><span>{titleCase(card.finish)}</span><span className={`availability-pill ${card.tradability.key}`}>{availability}</span><strong>{formatMoney(card.marketPrice)}</strong></article>;
  return <article className={`card-tile ${view === "details" ? "detail-card" : ""} ${selected ? "is-selected" : ""}`}><div className="card-image-wrap"><button type="button" className="image-button" onClick={onPreview} aria-label={`Preview ${card.name}`}><img src={card.imageUrl} alt="" loading="lazy" /></button><span className={`availability-pill ${card.tradability.key}`}>{availability}</span></div><div className="card-content"><div className="card-title-row"><h3>{card.name}</h3><strong>{formatMoney(card.marketPrice)}</strong></div><p className="print-line">{card.setName} · {card.setCode.toUpperCase()} {card.collectorNumber} · {titleCase(card.finish)}</p>{view === "details" && <><p className="type-line">{card.typeLine}</p><p className="oracle">{card.oracleText || "No Oracle text."}</p></>}<div className="card-footer"><span className="color-chips" aria-label={`Color identity ${cardColors(card).join("")}`}>{cardColors(card).map((color) => <i key={color} className={`color-chip color-${color}`}>{color}</i>)}</span><label className="select-card"><input type="checkbox" checked={selected} onChange={onToggle} /> <span>{selected ? "In trade list" : "Add to trade list"}</span></label></div></div></article>;
}

function CardPreview({ card, onClose, onToggle, selected }: { card: Card; onClose: () => void; onToggle: () => void; selected: boolean }) {
  return <div className="preview-layer" role="presentation" onMouseDown={onClose}><section className="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-card-title" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="icon-button preview-close" onClick={onClose} aria-label="Close card preview">×</button><img src={card.largeImageUrl || card.imageUrl} alt="" /><div className="preview-copy"><p className="eyebrow">{card.setName} · {card.setCode.toUpperCase()} {card.collectorNumber}</p><h2 id="preview-card-title">{card.name}</h2><p>{card.typeLine}</p><dl><div><dt>Finish</dt><dd>{titleCase(card.finish)}</dd></div><div><dt>Condition</dt><dd>{titleCase(card.condition)}</dd></div><div><dt>Location</dt><dd>{card.publicLocation}</dd></div><div><dt>Market snapshot</dt><dd>{formatMoney(card.marketPrice)}</dd></div></dl><button type="button" className="primary-action wide" onClick={onToggle}>{selected ? "Remove from trade list" : "Add to trade list"}</button></div></section></div>;
}

function TradeList({ cards, onClose, onClear }: { cards: Card[]; onClose: () => void; onClear: () => void }) {
  const list = cards.map((card) => `• ${card.quantity}× ${card.name} (${card.setCode.toUpperCase()} ${card.collectorNumber}, ${titleCase(card.finish)}, ${titleCase(card.condition)}) — ${formatMoney(card.marketPrice)}`).join("\n");
  const message = `Hi! I’m interested in the following cards from your trade binder:\n\n${list}\n\nCould you let me know what you’re looking for in trade?`;
  const copy = async () => { await navigator.clipboard?.writeText(message); onClose(); };
  return <div className="preview-layer" role="presentation" onMouseDown={onClose}><section className="trade-dialog" role="dialog" aria-modal="true" aria-labelledby="trade-list-heading" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="icon-button preview-close" onClick={onClose} aria-label="Close trade request">×</button><p className="eyebrow">Your trade list</p><h2 id="trade-list-heading">Ready to ask about {cards.length} {cards.length === 1 ? "card" : "cards"}?</h2><p className="dialog-copy">This is the next step: copy the request below or open an email draft, then tell Kyle what you have in mind.</p><div className="request-list">{cards.map((card) => <div key={card.id}><span>{card.name}</span><small>{card.setCode.toUpperCase()} {card.collectorNumber} · {titleCase(card.finish)} · {formatMoney(card.marketPrice)}</small></div>)}</div><div className="trade-dialog-actions"><button type="button" className="primary-action" onClick={copy}>Copy trade request</button><a className="secondary-action" href={`mailto:?subject=${escapeForMail("Trade Binder request")}&body=${escapeForMail(message)}`}>Open email draft</a><button type="button" className="text-action" onClick={onClear}>Clear list</button></div></section></div>;
}

export function TradeBinderPrototype() {
  const [data, setData] = useState<BinderData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [view, setView] = useState<ViewMode>("visual");
  const [limit, setLimit] = useState(36);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<Card | null>(null);
  const [tradeListOpen, setTradeListOpen] = useState(false);
  useEffect(() => { fetch("/data/cards.json").then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load cards"))).then((next: BinderData) => setData(next)).catch(() => setLoadError(true)); }, []);
  const matches = useMemo(() => data ? filteredCards(data.cards, filters) : [], [data, filters]);
  const selectedCards = useMemo(() => data ? data.cards.filter((card) => selected.includes(card.id)) : [], [data, selected]);
  const selectedValue = selectedCards.reduce((total, card) => total + (card.marketPrice || 0), 0);
  const availableQuantity = data?.cards.filter((card) => card.tradability.key === "available").reduce((total, card) => total + card.quantity, 0) || 0;
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => !["manaComparator", "colorMode"].includes(key) && (Array.isArray(value) ? value.length > 0 : Boolean(value))).length;
  const toggleSelected = (id: string) => setSelected((current) => current.includes(id) ? current.filter((cardId) => cardId !== id) : [...current, id]);
  const reset = () => { setFilters(emptyFilters); setLimit(36); };
  const updateSearch = (value: string) => { setFilters((current) => ({ ...current, text: value })); setLimit(36); };
  if (loadError) return <main className="error-state"><h1>Trade Binder could not load</h1><p>Try refreshing the page. The public card index is kept local to this prototype.</p></main>;
  if (!data) return <main className="loading-state"><div className="loading-mark">✦</div><h1>Loading the Trade Binder</h1><p>Indexing prints, conditions, and trade availability…</p></main>;
  return <main className="app-shell">
    <header className="trade-header"><div className="trade-brand"><div className="binder-mark">✦</div><h1>Trade Binder</h1></div><div className="header-actions" aria-label="Page options"><span>☼</span><span>⋮</span></div></header>
    <div className="binder-layout">
      <aside className="binder-sidebar" aria-label="Trade Binder sections">
        <nav><span className="side-nav-item is-current">▦ <b>Overview</b></span><span className="side-nav-item">▣ <b>My Binder</b></span><span className="side-nav-item">♡ <b>Wants List</b></span><span className="side-nav-item">⇄ <b>Trade History</b></span><span className="side-nav-item">▤ <b>Messages</b></span><span className="side-nav-item">⚙ <b>Settings</b></span></nav>
        <section className="owned-summary"><span>Cards owned</span><strong>{data.summary.totalQuantity.toLocaleString()}</strong><em>Available to trade</em><b>{availableQuantity.toLocaleString()}</b><hr /><small>Last updated<br />July 25, 2026</small></section>
        <a className="public-page-link" href="https://jonathankhobson.github.io/homebrew_forge_packet/shareables/trade-binder/">View public page <span>↗</span></a>
      </aside>
      <section className="workspace" id="browse" aria-label="Trade Binder browser">
        <div className="command-bar"><label className="search-control"><span aria-hidden="true">⌕</span><input type="search" value={filters.text} onChange={(event) => updateSearch(event.target.value)} placeholder={`Search ${data.summary.totalQuantity.toLocaleString()}+ cards`} aria-label="Search cards" /><kbd>/</kbd></label><label className="availability-switch"><span>Available to trade</span><input type="checkbox" checked={filters.availableOnly} onChange={(event) => setFilters((current) => ({ ...current, availableOnly: event.target.checked }))} /><i aria-hidden="true" /></label><button type="button" className={`filter-button icon-filter ${activeFilterCount ? "has-filters" : ""}`} onClick={() => setFiltersOpen(true)} aria-label="Open advanced search"><span>☷</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button></div>
        <div className="quick-row"><button type="button" className="filter-button inline-filter" onClick={() => setFiltersOpen(true)}><span>☷</span> Filters</button><button type="button" className="compact-filter" onClick={() => setFiltersOpen(true)}>Color: {filters.colors.length ? filters.colors.join("") : "All"}⌄</button><button type="button" className="compact-filter" onClick={() => setFiltersOpen(true)}>Type: {filters.type || "All"}⌄</button><button type="button" className="compact-filter" onClick={() => setFiltersOpen(true)}>Rarity: {filters.rarity || "All"}⌄</button><button type="button" className="compact-filter" onClick={() => setFiltersOpen(true)}>Set: {filters.set || "All"}⌄</button>{activeFilterCount > 0 && <button type="button" className="clear-button" onClick={reset}>Clear all</button>}</div>
        <div className="browse-heading"><div><h2>{matches.length.toLocaleString()} cards found</h2></div><div className="sort-and-view"><button className="sort-button" type="button">Sort: Name (A–Z)⌄</button><div className="view-controls" role="group" aria-label="Card view">{(["visual", "details", "compact"] as ViewMode[]).map((mode) => <button key={mode} type="button" className={view === mode ? "is-active" : ""} onClick={() => setView(mode)} aria-pressed={view === mode} aria-label={`${mode} view`}>{mode === "visual" ? "▦" : mode === "details" ? "☷" : "≡"}</button>)}</div></div></div>
        {matches.length === 0 ? <section className="empty-state"><h3>No cards match those filters.</h3><p>Clear a filter, or widen the Oracle text or price search.</p><button className="primary-action" type="button" onClick={reset}>Reset all filters</button></section> : <div className={`card-results ${view}`}>{matches.slice(0, limit).map((card) => <CardItem key={card.id} card={card} view={view} selected={selected.includes(card.id)} onToggle={() => toggleSelected(card.id)} onPreview={() => setPreview(card)} />)}</div>}
        {limit < matches.length && <div className="load-more"><button type="button" onClick={() => setLimit((current) => current + 36)}>Show 36 more cards</button><span>Showing {Math.min(limit, matches.length).toLocaleString()} of {matches.length.toLocaleString()}</span></div>}
      </section>
    </div>
    <aside className={`trade-tray ${selected.length ? "has-cards" : ""}`} aria-live="polite"><div><span className="tray-label">Trade list</span><strong>{selected.length} {selected.length === 1 ? "card" : "cards"}</strong><span className="tray-value">{selected.length ? `${formatMoney(selectedValue)} snapshot` : "Select cards to start a request"}</span></div><div className="tray-actions"><button type="button" className="text-action" disabled={!selected.length} onClick={() => setSelected([])}>Clear</button><button type="button" className="primary-action" disabled={!selected.length} onClick={() => setTradeListOpen(true)}>Request selected cards <span>→</span></button></div></aside>
    <nav className="mobile-nav" aria-label="Mobile trade binder sections"><span className="is-current">▦<b>Overview</b></span><span>▣<b>My Binder</b></span><span>♡<b>Wants List</b></span><span>▤<b>Messages</b></span></nav>
    {filtersOpen && <AdvancedFilters cards={data.cards} filters={filters} setFilters={setFilters} onClose={() => setFiltersOpen(false)} onReset={reset} />}{preview && <CardPreview card={preview} selected={selected.includes(preview.id)} onToggle={() => toggleSelected(preview.id)} onClose={() => setPreview(null)} />}{tradeListOpen && <TradeList cards={selectedCards} onClose={() => setTradeListOpen(false)} onClear={() => { setSelected([]); setTradeListOpen(false); }} />}
  </main>;
}
