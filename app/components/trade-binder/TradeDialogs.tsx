"use client";

/* The card feed intentionally uses the read-only image URLs stored in the
 * generated public inventory, so native images preserve exact print identity. */
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { sourceLabel } from "../../data/inventory";
import { colorMeta, escapeForMail, formatMoney, titleCase } from "../../data/mtg";
import { distinct, distinctBinderNames, distinctLocations, type Filters } from "../../data/tradeBrowser";
import { buildTradeCsv, buildTradeRequest, buildTradeText, buildTradeXml, downloadTradeSelection } from "../../data/tradeExports";
import type { Card, ColorMode, Comparator } from "../../data/types";
import { ModalFrame } from "./ModalFrame";

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Any {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{label === "Set" ? option.toUpperCase() : titleCase(option)}</option>)}</select></label>;
}

type AdvancedFiltersProps = {
  cards: Card[];
  filters: Filters;
  setFilters: (next: Filters) => void;
  onClose: () => void;
  onReset: () => void;
};

export function AdvancedFilters({ cards, filters, setFilters, onClose, onReset }: AdvancedFiltersProps) {
  const change = <Key extends keyof Filters>(key: Key, value: Filters[Key]) => setFilters({ ...filters, [key]: value });
  const toggleColor = (color: string) => change("colors", filters.colors.includes(color) ? filters.colors.filter((item) => item !== color) : [...filters.colors, color]);
  const tradabilityOptions = Array.from(new Set(cards.map((card) => card.tradability.key))).sort((left, right) => left.localeCompare(right));
  return (
    <ModalFrame className="filter-sheet" labelledBy="filter-heading" onClose={onClose}>
      <header className="sheet-header"><div><p className="eyebrow">Advanced search</p><h2 id="filter-heading">Find the exact print</h2><p>Search rules text, print details, condition, price, and color identity. Results update as you refine.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close advanced search">×</button></header>
      <div className="filter-sections">
        <section><h3>Card text</h3><div className="field-grid two"><label className="field"><span>Card name or set</span><input value={filters.text} onChange={(event) => change("text", event.target.value)} placeholder="e.g. Green Goblin, Fallout" /></label><label className="field"><span>Oracle text</span><input value={filters.oracle} onChange={(event) => change("oracle", event.target.value)} placeholder="e.g. treasure, flying" /></label></div></section>
        <section><h3>Card identity</h3><div className="color-filter-row" aria-label="Color identity">{colorMeta.map((color) => <button key={color.code} type="button" className={`mana-button color-${color.code} ${filters.colors.includes(color.code) ? "is-active" : ""}`} onClick={() => toggleColor(color.code)} aria-pressed={filters.colors.includes(color.code)} title={color.label} aria-label={`${color.label} color identity`}><img src={color.asset} alt="" /></button>)}<select className="color-mode" aria-label="Color identity match" value={filters.colorMode} onChange={(event) => change("colorMode", event.target.value as ColorMode)}><option value="any">Has any selected</option><option value="all">Has all selected</option><option value="exact">Exactly these colors</option></select></div><div className="field-grid three"><FilterSelect label="Owner" value={filters.owner} onChange={(value) => change("owner", value)} options={distinct(cards, "owner")} /><FilterSelect label="Trade status" value={filters.tradability} onChange={(value) => change("tradability", value)} options={tradabilityOptions} /><FilterSelect label="Type" value={filters.type} onChange={(value) => change("type", value)} options={distinct(cards, "typeBucket")} /><FilterSelect label="Rarity" value={filters.rarity} onChange={(value) => change("rarity", value)} options={distinct(cards, "rarity")} /><label className="field"><span>Mana value</span><div className="compound-field"><select aria-label="Mana value comparator" value={filters.manaComparator} onChange={(event) => change("manaComparator", event.target.value as Comparator)}><option value="eq">Equals</option><option value="gt">Greater than</option><option value="lt">Less than</option></select><input inputMode="numeric" value={filters.manaValue} onChange={(event) => change("manaValue", event.target.value)} placeholder="Any" /></div></label></div></section>
        <section><h3>Print details</h3><div className="field-grid three"><FilterSelect label="Binder" value={filters.binder} onChange={(value) => change("binder", value)} options={distinctBinderNames(cards)} /><FilterSelect label="Set" value={filters.set} onChange={(value) => change("set", value)} options={Array.from(new Set(cards.map((card) => card.setCode))).sort()} /><FilterSelect label="Finish" value={filters.finish} onChange={(value) => change("finish", value)} options={distinct(cards, "finish")} /><FilterSelect label="Condition" value={filters.condition} onChange={(value) => change("condition", value)} options={distinct(cards, "condition")} /><FilterSelect label="Language" value={filters.language} onChange={(value) => change("language", value)} options={distinct(cards, "language")} /><FilterSelect label="Location" value={filters.location} onChange={(value) => change("location", value)} options={distinctLocations(cards)} /><label className="field"><span>Minimum price</span><input inputMode="decimal" value={filters.minPrice} onChange={(event) => change("minPrice", event.target.value)} placeholder="$0.00" /></label><label className="field"><span>Maximum price</span><input inputMode="decimal" value={filters.maxPrice} onChange={(event) => change("maxPrice", event.target.value)} placeholder="No maximum" /></label></div><div className="switch-row"><button type="button" className={`toggle-button ${filters.altered ? "is-active" : ""}`} onClick={() => change("altered", filters.altered ? "" : "yes")} aria-pressed={Boolean(filters.altered)}>Altered only</button><button type="button" className={`toggle-button ${filters.playtest ? "is-active" : ""}`} onClick={() => change("playtest", filters.playtest ? "" : "yes")} aria-pressed={Boolean(filters.playtest)}>Homebrew / proxy only</button></div></section>
      </div>
      <footer className="sheet-footer"><button type="button" className="text-action" onClick={onReset}>Reset all</button><button type="button" className="primary-action" onClick={onClose}>Show matching cards</button></footer>
    </ModalFrame>
  );
}

type CardPreviewProps = {
  card: Card;
  selected: boolean;
  wanted: boolean;
  onClose: () => void;
  onToggleSelected: () => void;
  onToggleWanted: () => void;
};

export function CardPreview({ card, selected, wanted, onClose, onToggleSelected, onToggleWanted }: CardPreviewProps) {
  const requestable = !["not_for_trade", "not_tradable", "reserved", "traded"].includes(card.tradability.key);
  return <ModalFrame className="preview-dialog" labelledBy="preview-card-title" onClose={onClose}><button type="button" className="icon-button preview-close" onClick={onClose} aria-label="Close card preview">×</button><img src={card.largeImageUrl || card.imageUrl} alt="" /><div className="preview-copy"><p className="eyebrow">{card.setName} · {card.setCode.toUpperCase()} {card.collectorNumber}</p><h2 id="preview-card-title">{card.name}</h2><p>{card.typeLine}</p><p className={`inquiry-copy ${requestable ? "" : "not-tradable-copy"}`}>{card.tradability.label} · {card.tradability.reason}</p><dl><div><dt>Owner</dt><dd>{card.owner}</dd></div><div><dt>Quantity</dt><dd>{card.quantity} {card.quantity === 1 ? "copy" : "copies"}</dd></div><div><dt>Finish</dt><dd>{titleCase(card.finish)}</dd></div><div><dt>Condition</dt><dd>{titleCase(card.condition)}</dd></div><div><dt>From</dt><dd>{sourceLabel(card.sourceBinders)}</dd></div><div><dt>Market snapshot</dt><dd>{formatMoney(card.marketPrice)}</dd></div></dl><div className="dialog-button-row"><button type="button" className="secondary-action" onClick={onToggleWanted}>{wanted ? "Remove from wants" : "Add to wants"}</button>{requestable && <button type="button" className="primary-action" onClick={onToggleSelected}>{selected ? "Remove from trade list" : "Add to trade list"}</button>}</div></div></ModalFrame>;
}

type TradeListProps = {
  cards: Card[];
  email: string;
  githubUrl: string;
  onClose: () => void;
  onClear: () => void;
  onSaveWants: () => void;
};

export function TradeList({ cards, email, githubUrl, onClose, onClear, onSaveWants }: TradeListProps) {
  const [notice, setNotice] = useState("");
  const message = buildTradeRequest(cards);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setNotice("Trade request copied. Paste it wherever you contact Kyle.");
    } catch {
      setNotice("Copy was unavailable in this browser. Use the email or contact route instead.");
    }
  };
  const exportSelection = (format: "csv" | "text" | "xml") => {
    if (format === "csv") downloadTradeSelection(buildTradeCsv(cards), "trade-binder-selection.csv", "text/csv;charset=utf-8");
    if (format === "text") downloadTradeSelection(buildTradeText(cards), "trade-binder-selection.txt", "text/plain;charset=utf-8");
    if (format === "xml") downloadTradeSelection(buildTradeXml(cards), "trade-binder-selection.xml", "application/xml;charset=utf-8");
    setNotice(`Downloaded ${format.toUpperCase()} selection.`);
  };
  const mailHref = `mailto:${email}?subject=${escapeForMail("Trade Binder request")}&body=${escapeForMail(message)}`;
  return <ModalFrame className="trade-dialog" labelledBy="trade-list-heading" onClose={onClose}><button type="button" className="icon-button preview-close" onClick={onClose} aria-label="Close trade request">×</button><p className="eyebrow">Your trade list</p><h2 id="trade-list-heading">Ready to ask about {cards.length} {cards.length === 1 ? "card" : "cards"}?</h2><p className="dialog-copy">Start with a clear request. This does not confirm availability; Kyle will review the cards and trade terms with you.</p><div className="request-list">{cards.map((card) => <div key={card.id}><span>{card.name}</span><small>{card.setCode.toUpperCase()} {card.collectorNumber} · {titleCase(card.finish)} · {formatMoney(card.marketPrice)}</small></div>)}</div><div className="trade-dialog-actions"><button type="button" className="primary-action" onClick={copy}>Copy trade request</button>{email ? <a className="secondary-action" href={mailHref}>Open email draft</a> : <a className="secondary-action" href={githubUrl} target="_blank" rel="noreferrer">Open contact profile</a>}<button type="button" className="secondary-action" onClick={() => { onSaveWants(); setNotice("Saved to this device’s wants list."); }}>Add to wants list</button><button type="button" className="text-action" onClick={onClear}>Clear list</button></div><div className="export-row" aria-label="Download selected cards"><span>Download selection:</span><button type="button" className="text-action" onClick={() => exportSelection("csv")}>CSV</button><button type="button" className="text-action" onClick={() => exportSelection("text")}>Text</button><button type="button" className="text-action" onClick={() => exportSelection("xml")}>XML</button></div><p className="dialog-status" role="status">{notice}</p></ModalFrame>;
}
