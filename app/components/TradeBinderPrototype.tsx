"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { colorMeta, formatMoney, titleCase } from "../data/mtg";
import { activeFilterCount, distinct, emptyFilters, filterCards, type Filters } from "../data/tradeBrowser";
import { tradeContact } from "../data/tradeConfig";
import type { BinderData, BinderSection, Card, SortMode, ThemeMode, ViewMode } from "../data/types";
import { CardView, FocusCard } from "./trade-binder/CardViews";
import { AdvancedFilters, CardPreview, TradeList } from "./trade-binder/TradeDialogs";

const WANTS_STORAGE_KEY = "trade-binder-wants";
const THEME_STORAGE_KEY = "trade-binder-theme";

const navItems: Array<{ id: BinderSection; label: string; mark: string }> = [
  { id: "browse", label: "Browse cards", mark: "▦" },
  { id: "wants", label: "Wants list", mark: "♡" },
  { id: "contact", label: "Contact", mark: "✉" },
];

const viewOptions: Array<{ id: ViewMode; label: string; mark: string; hint: string }> = [
  { id: "grid", label: "Grid", mark: "▦", hint: "Square card grid" },
  { id: "details", label: "Details", mark: "▤", hint: "Two-column card details" },
  { id: "list", label: "List", mark: "≡", hint: "Single-row list" },
  { id: "focus", label: "Focus", mark: "▣", hint: "One card at a time" },
];

function NavButtons({ activeSection, onNavigate, compact = false }: { activeSection: BinderSection; onNavigate: (section: BinderSection) => void; compact?: boolean }) {
  return <nav className={compact ? "mobile-nav" : "binder-nav"} aria-label={compact ? "Mobile trade binder sections" : "Trade Binder sections"}>{navItems.map((item) => <button key={item.id} type="button" className={activeSection === item.id ? "is-current" : ""} onClick={() => onNavigate(item.id)}><span aria-hidden="true">{item.mark}</span><b>{compact && item.id === "browse" ? "Browse" : item.label}</b></button>)}</nav>;
}

function QuickSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="quick-select"><span>{label}</span><select aria-label={`Quick filter: ${label}`} value={value} onChange={(event) => onChange(event.target.value)}><option value="">All</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function EmptyPanel({ title, copy, actionLabel, onAction }: { title: string; copy: string; actionLabel: string; onAction: () => void }) {
  return <section className="empty-state"><h2>{title}</h2><p>{copy}</p><button type="button" className="primary-action" onClick={onAction}>{actionLabel}</button></section>;
}

export function TradeBinderPrototype() {
  const [data, setData] = useState<BinderData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortMode>("name");
  const [activeSection, setActiveSection] = useState<BinderSection>("browse");
  const [limit, setLimit] = useState(36);
  const [focusIndex, setFocusIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [wants, setWants] = useState<string[]>([]);
  const [preview, setPreview] = useState<Card | null>(null);
  const [tradeListOpen, setTradeListOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [wantsHydrated, setWantsHydrated] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const deferredText = useDeferredValue(filters.text);

  const loadCards = useCallback(() => {
    fetch("/data/cards.json")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load cards")))
      .then((next: BinderData) => { setData(next); setLoadError(false); })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    fetch("/data/cards.json")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load cards")))
      .then((next: BinderData) => { setData(next); setLoadError(false); })
      .catch(() => setLoadError(true));
  }, []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
      try {
        const storedWants = JSON.parse(window.localStorage.getItem(WANTS_STORAGE_KEY) || "[]");
        if (Array.isArray(storedWants)) setWants(storedWants.filter((item): item is string => typeof item === "string"));
      } catch {
        window.localStorage.removeItem(WANTS_STORAGE_KEY);
      }
      setWantsHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (wantsHydrated) window.localStorage.setItem(WANTS_STORAGE_KEY, JSON.stringify(wants));
  }, [wants, wantsHydrated]);
  useEffect(() => { window.localStorage.setItem(THEME_STORAGE_KEY, theme); }, [theme]);
  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && !target?.matches("input, textarea, select, [contenteditable='true']")) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  const deferredFilters = useMemo(() => ({ ...filters, text: deferredText }), [filters, deferredText]);
  const matches = useMemo(() => data ? filterCards(data.cards, deferredFilters, sort) : [], [data, deferredFilters, sort]);
  const selectedCards = useMemo(() => data ? data.cards.filter((card) => selected.includes(card.id)) : [], [data, selected]);
  const wantedCards = useMemo(() => data ? data.cards.filter((card) => wants.includes(card.id)) : [], [data, wants]);
  const activeFilters = activeFilterCount(filters);
  const selectedValue = selectedCards.reduce((total, card) => total + (card.marketPrice || 0), 0);
  const focusPosition = matches.length ? focusIndex % matches.length : 0;
  const focusCard = matches.length ? matches[focusPosition] : null;
  const quickColor = filters.colors.length === 1 ? filters.colors[0] : "";

  const updateFilters = (next: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setLimit(36);
    setFocusIndex(0);
  };
  const reset = () => { setFilters(emptyFilters); setLimit(36); setFocusIndex(0); };
  const toggleSelected = (id: string) => setSelected((current) => current.includes(id) ? current.filter((cardId) => cardId !== id) : [...current, id]);
  const toggleWanted = (id: string) => setWants((current) => current.includes(id) ? current.filter((cardId) => cardId !== id) : [...current, id]);
  const addCardsToWants = (cards: Card[]) => setWants((current) => Array.from(new Set([...current, ...cards.map((card) => card.id)])));
  const navigate = (section: BinderSection) => { setActiveSection(section); window.scrollTo({ top: 0, behavior: "smooth" }); };

  if (loadError) return <main className="error-state"><h1>Trade Binder could not load</h1><p>The collection index is local to this prototype. Try loading it again.</p><button type="button" className="primary-action" onClick={loadCards}>Try again</button></main>;
  if (!data) return <main className="loading-state"><div className="loading-mark" aria-hidden="true">▤</div><h1>Loading the Trade Binder</h1><p>Indexing prints, conditions, and collection details…</p></main>;

  const quickOptions = {
    type: distinct(data.cards, "typeBucket").map((value) => ({ value, label: titleCase(value) })),
    rarity: distinct(data.cards, "rarity").map((value) => ({ value, label: titleCase(value) })),
    set: Array.from(new Set(data.cards.map((card) => card.setCode))).sort().map((value) => ({ value, label: value.toUpperCase() })),
  };

  return <main className="app-shell" data-theme={theme}>
    <a className="skip-link" href="#main-content">Skip to card browser</a>
    <header className="trade-header"><div className="trade-brand"><div className="binder-mark" aria-hidden="true"><i /><i /><i /></div><div><p className="brand-kicker">Physical collection</p><h1>Trade Binder</h1></div></div><button type="button" className="theme-toggle" onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} aria-label={`Use ${theme === "light" ? "dark" : "light"} appearance`}><span aria-hidden="true">{theme === "light" ? "◐" : "☼"}</span><b>{theme === "light" ? "Dark" : "Light"}</b></button></header>
    <div className="binder-layout">
      <aside className="binder-sidebar"><NavButtons activeSection={activeSection} onNavigate={navigate} /><section className="owned-summary"><span>Cards owned</span><strong>{data.summary.totalQuantity.toLocaleString()}</strong><p>Trade status is still being reviewed. Every card below is an inquiry, not a promise.</p><hr /><small>Collection snapshot<br />July 25, 2026</small></section><a className="public-page-link" href="https://jonathankhobson.github.io/homebrew_forge_packet/shareables/trade-binder/">View current public binder <span aria-hidden="true">↗</span></a></aside>
      <section className="workspace" id="main-content" aria-label="Trade Binder workspace">
        {activeSection === "browse" && <>
          <div className="scope-switch" role="group" aria-label="Collection scope"><button type="button" className="is-active" onClick={() => navigate("browse")}>Physical cards</button><button type="button" onClick={() => navigate("homebrew")}>Homebrew &amp; proxies</button></div>
          <div className="inquiry-banner"><b>Possible trade, not confirmed.</b><span>All listed cards are open for conversation while Kyle finishes reviewing trade status.</span></div>
          <div className="command-bar"><label className="search-control"><span aria-hidden="true">⌕</span><input ref={searchRef} type="search" value={filters.text} onChange={(event) => updateFilters({ text: event.target.value })} placeholder={`Search ${data.summary.totalQuantity.toLocaleString()}+ cards`} aria-label="Search cards" /><kbd>/</kbd></label><button type="button" className={`filter-button ${activeFilters ? "has-filters" : ""}`} onClick={() => setFiltersOpen(true)}><span aria-hidden="true">☷</span> Filters{activeFilters > 0 && <b>{activeFilters}</b>}</button></div>
          <div className="quick-row" aria-label="Quick filters"><label className="quick-select color-select"><span>Color</span><select aria-label="Quick filter: color" value={quickColor} onChange={(event) => updateFilters({ colors: event.target.value ? [event.target.value] : [] })}><option value="">All</option>{colorMeta.map((color) => <option key={color.code} value={color.code}>{color.symbol} {color.label}</option>)}</select></label><QuickSelect label="Type" value={filters.type} onChange={(value) => updateFilters({ type: value })} options={quickOptions.type} /><QuickSelect label="Rarity" value={filters.rarity} onChange={(value) => updateFilters({ rarity: value })} options={quickOptions.rarity} /><QuickSelect label="Set" value={filters.set} onChange={(value) => updateFilters({ set: value })} options={quickOptions.set} />{activeFilters > 0 && <button type="button" className="clear-button" onClick={reset}>Clear filters</button>}</div>
          <div className="browse-heading"><div><h2>{matches.length.toLocaleString()} prints found</h2><p>Choose a view, select cards, then request a trade conversation.</p></div><div className="sort-and-view"><label className="sort-select"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="Sort cards"><option value="name">Name A–Z</option><option value="price-high">Price high to low</option><option value="price-low">Price low to high</option><option value="set">Set &amp; collector number</option></select></label><div className="view-controls" role="group" aria-label="Card view">{viewOptions.map((option) => <button key={option.id} type="button" className={view === option.id ? "is-active" : ""} onClick={() => setView(option.id)} aria-pressed={view === option.id} title={option.hint}><span aria-hidden="true">{option.mark}</span><b>{option.label}</b></button>)}</div></div></div>
          {matches.length === 0 ? <EmptyPanel title="No cards match those filters." copy="Clear a filter, widen your Oracle-text search, or switch to the physical collection." actionLabel="Reset filters" onAction={reset} /> : view === "focus" && focusCard ? <><div className="focus-nav"><button type="button" className="secondary-action" onClick={() => setFocusIndex((current) => (current - 1 + matches.length) % matches.length)}>Previous</button><span>{focusPosition + 1} of {matches.length}</span><button type="button" className="secondary-action" onClick={() => setFocusIndex((current) => (current + 1) % matches.length)}>Next</button></div><FocusCard card={focusCard} selected={selected.includes(focusCard.id)} wanted={wants.includes(focusCard.id)} onToggleSelected={() => toggleSelected(focusCard.id)} onToggleWanted={() => toggleWanted(focusCard.id)} onPreview={() => setPreview(focusCard)} /></> : <div className={`card-results ${view}`}>{matches.slice(0, limit).map((card) => <CardView key={card.id} card={card} view={view} selected={selected.includes(card.id)} wanted={wants.includes(card.id)} onToggleSelected={() => toggleSelected(card.id)} onToggleWanted={() => toggleWanted(card.id)} onPreview={() => setPreview(card)} />)}</div>}
          {view !== "focus" && limit < matches.length && <div className="load-more"><button type="button" onClick={() => setLimit((current) => current + 36)}>Show 36 more cards</button><span>Showing {Math.min(limit, matches.length).toLocaleString()} of {matches.length.toLocaleString()}</span></div>}
        </>}
        {activeSection === "wants" && <section className="section-page"><p className="eyebrow">Browser-local list</p><h2>Wants list</h2><p className="section-intro">Save cards here while you browse. This list stays only on this device and is never sent to Kyle automatically.</p>{wantedCards.length === 0 ? <EmptyPanel title="Your wants list is empty." copy="Use the Want button on any card to save it here." actionLabel="Browse cards" onAction={() => navigate("browse")} /> : <><div className="wants-header"><strong>{wantedCards.length} saved {wantedCards.length === 1 ? "card" : "cards"}</strong><button type="button" className="text-action" onClick={() => setWants([])}>Clear wants list</button></div><div className="card-results list">{wantedCards.map((card) => <CardView key={card.id} card={card} view="list" selected={selected.includes(card.id)} wanted onToggleSelected={() => toggleSelected(card.id)} onToggleWanted={() => toggleWanted(card.id)} onPreview={() => setPreview(card)} />)}</div></>}</section>}
        {activeSection === "contact" && <section className="section-page contact-page"><p className="eyebrow">Trade conversations</p><h2>Contact Kyle</h2><p className="section-intro">Build a card list first, then copy a clear request with exact print, finish, and condition details. Every request begins as a conversation, not a confirmed trade.</p><div className="contact-card"><h3>Start with your request</h3><p>Use the trade tray to copy your selected cards. Then use the contact route below to share what you have in mind.</p><div className="contact-actions">{tradeContact.email ? <a className="primary-action" href={`mailto:${tradeContact.email}`}>Email Kyle</a> : <a className="primary-action" href={tradeContact.githubUrl} target="_blank" rel="noreferrer">Open contact profile</a>}<button type="button" className="secondary-action" onClick={() => navigate("browse")}>Browse cards</button></div></div><p className="local-note">A public trade email can be added to this private prototype only after Kyle confirms the exact address to publish.</p></section>}
        {activeSection === "homebrew" && <section className="section-page homebrew-page"><p className="eyebrow">Separate collection scope</p><h2>Homebrew &amp; proxy cards</h2><p className="section-intro">This future section will keep homebrew and proxy cards distinct from physical official inventory and from physical-trade claims.</p><EmptyPanel title="No homebrew or proxy cards are listed yet." copy="When these cards are added, they will live here with their own source, printing, and trade notes instead of mixing into the physical binder." actionLabel="Return to physical cards" onAction={() => navigate("browse")} /></section>}
      </section>
    </div>
    <aside className={`trade-tray ${selected.length ? "has-cards" : ""}`} aria-live="polite"><div><span className="tray-label">Trade list</span><strong>{selected.length} {selected.length === 1 ? "card" : "cards"}</strong><span className="tray-value">{selected.length ? `${formatMoney(selectedValue)} snapshot` : "Select cards to start a request"}</span></div><div className="tray-actions"><button type="button" className="text-action" disabled={!selected.length} onClick={() => setSelected([])}>Clear</button><button type="button" className="primary-action" disabled={!selected.length} onClick={() => setTradeListOpen(true)}>Request selected <span aria-hidden="true">→</span></button></div></aside>
    <NavButtons activeSection={activeSection} onNavigate={navigate} compact />
    {filtersOpen && <AdvancedFilters cards={data.cards} filters={filters} setFilters={setFilters} onClose={() => setFiltersOpen(false)} onReset={reset} />}
    {preview && <CardPreview card={preview} selected={selected.includes(preview.id)} wanted={wants.includes(preview.id)} onToggleSelected={() => toggleSelected(preview.id)} onToggleWanted={() => toggleWanted(preview.id)} onClose={() => setPreview(null)} />}
    {tradeListOpen && <TradeList cards={selectedCards} email={tradeContact.email} githubUrl={tradeContact.githubUrl} onClose={() => setTradeListOpen(false)} onClear={() => { setSelected([]); setTradeListOpen(false); }} onSaveWants={() => addCardsToWants(selectedCards)} />}
  </main>;
}
