"use client";

/* The card feed intentionally uses the read-only image URLs stored in the
 * generated public inventory, so native images preserve exact print identity. */
/* eslint-disable @next/next/no-img-element */

import { cardColors, colorLabel, colorMeta, formatMoney, titleCase } from "../../data/mtg";
import type { Card, ViewMode } from "../../data/types";

type CardViewProps = {
  card: Card;
  view: Exclude<ViewMode, "focus">;
  selected: boolean;
  wanted: boolean;
  onToggleSelected: () => void;
  onToggleWanted: () => void;
  onPreview: () => void;
};

function ManaSymbols({ card }: { card: Card }) {
  const colors = cardColors(card);
  return <span className="mana-symbols" aria-label={`Color identity: ${colors.map(colorLabel).join(", ")}`}>{colors.map((color) => {
    const meta = colorMeta.find((item) => item.code === color);
    return meta ? <img key={color} src={meta.asset} alt="" /> : null;
  })}</span>;
}

function TradeStatusPill({ card }: { card: Card }) {
  return <span className={`inquiry-pill status-${card.tradability.key}`}>{card.tradability.label}</span>;
}

type SelectionControlProps = {
  cardName: string;
  selected: boolean;
  onToggle: () => void;
  className?: string;
  label?: string;
};

export function SelectionControl({ cardName, selected, onToggle, className = "", label }: SelectionControlProps) {
  const action = selected ? "Remove" : "Select";
  return <label className={`selection-check ${className}`} title={`${action} ${cardName}`}><input type="checkbox" checked={selected} onChange={onToggle} aria-label={`${action} ${cardName} for export, sharing, or a trade request`} /><span aria-hidden="true">✓</span>{label && <b>{label}</b>}</label>;
}

export function CardView({ card, view, selected, wanted, onToggleSelected, onToggleWanted, onPreview }: CardViewProps) {
  if (view === "list") {
    return (
      <article className={`list-card ${selected ? "is-selected" : ""}`}>
        <SelectionControl className="list-selection" cardName={card.name} selected={selected} onToggle={onToggleSelected} />
        <button type="button" className="list-card-name" onClick={onPreview}>{card.name}</button>
        <span className="list-card-print">{card.setCode.toUpperCase()} {card.collectorNumber} · {card.owner} · {card.quantity} {card.quantity === 1 ? "copy" : "copies"}</span>
        <span className="list-card-type">{card.typeBucket}</span>
        <TradeStatusPill card={card} />
        <strong>{formatMoney(card.marketPrice)}</strong>
        <button type="button" className="small-action" onClick={onToggleWanted}>{wanted ? "Saved" : "Want"}</button>
      </article>
    );
  }

  return (
    <article className={`card-tile ${view === "details" ? "detail-card" : ""} ${selected ? "is-selected" : ""}`}>
      <div className="card-image-wrap">
        <button type="button" className="image-button" onClick={onPreview} aria-label={`Preview ${card.name}`}><img src={card.imageUrl} alt="" loading="lazy" /></button>
        <SelectionControl className="card-selection" cardName={card.name} selected={selected} onToggle={onToggleSelected} />
        <TradeStatusPill card={card} />
      </div>
      <div className="card-content">
        <div className="card-title-row"><h3>{card.name}</h3><strong>{formatMoney(card.marketPrice)}</strong></div>
        <p className="print-line">{card.setName} · {card.setCode.toUpperCase()} {card.collectorNumber} · {titleCase(card.finish)}</p>
        <p className="ownership-line">{card.owner} · {card.quantity} {card.quantity === 1 ? "copy" : "copies"}</p>
        {view === "details" && <><p className="type-line">{card.typeLine}</p><p className="oracle">{card.oracleText || "No Oracle text."}</p></>}
        <div className="card-footer">
          <ManaSymbols card={card} />
          <div className="card-actions">
            <button type="button" className="small-action" onClick={onToggleWanted}>{wanted ? "Saved" : "Want"}</button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FocusCard({ card, selected, wanted, onToggleSelected, onToggleWanted, onPreview }: Omit<CardViewProps, "view">) {
  return (
    <article className="focus-card">
      <div className="focus-card-image"><button type="button" className="image-button" onClick={onPreview} aria-label={`Open full preview of ${card.name}`}><img src={card.imageUrl} alt="" /></button></div>
      <div className="focus-card-copy">
        <div><p className="eyebrow">{card.setName} · {card.setCode.toUpperCase()} {card.collectorNumber}</p><h3>{card.name}</h3><TradeStatusPill card={card} /></div>
        <p className="type-line">{card.typeLine}</p>
        <p className="focus-oracle">{card.oracleText || "No Oracle text."}</p>
        <dl className="focus-facts"><div><dt>Owner</dt><dd>{card.owner}</dd></div><div><dt>Quantity</dt><dd>{card.quantity} {card.quantity === 1 ? "copy" : "copies"}</dd></div><div><dt>Finish</dt><dd>{titleCase(card.finish)}</dd></div><div><dt>Condition</dt><dd>{titleCase(card.condition)}</dd></div><div><dt>Snapshot</dt><dd>{formatMoney(card.marketPrice)}</dd></div></dl>
        <div className="focus-actions"><button type="button" className="secondary-action" onClick={onToggleWanted}>{wanted ? "Remove from wants" : "Add to wants"}</button><SelectionControl className="focus-selection" cardName={card.name} selected={selected} onToggle={onToggleSelected} label={selected ? "Selected" : "Select card"} /></div>
      </div>
    </article>
  );
}
