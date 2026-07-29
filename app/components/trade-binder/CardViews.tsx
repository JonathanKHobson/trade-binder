"use client";

/* The card feed intentionally uses the read-only image URLs stored in the
 * generated public inventory, so native images preserve exact print identity. */
/* eslint-disable @next/next/no-img-element */

import { cardColors, colorLabel, formatMoney, titleCase } from "../../data/mtg";
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

function ColorDots({ card }: { card: Card }) {
  const colors = cardColors(card);
  return <span className="color-dots" aria-label={`Color identity: ${colors.map(colorLabel).join(", ")}`}>{colors.map((color) => <i key={color} className={`color-dot color-${color}`} />)}</span>;
}

function InquiryPill() {
  return <span className="inquiry-pill">Ask about trade</span>;
}

export function CardView({ card, view, selected, wanted, onToggleSelected, onToggleWanted, onPreview }: CardViewProps) {
  if (view === "list") {
    return (
      <article className={`list-card ${selected ? "is-selected" : ""}`}>
        <label className="check-control"><input type="checkbox" checked={selected} onChange={onToggleSelected} aria-label={`Add ${card.name} to trade list`} /><span /></label>
        <button type="button" className="list-card-name" onClick={onPreview}>{card.name}</button>
        <span className="list-card-print">{card.setCode.toUpperCase()} {card.collectorNumber}</span>
        <span className="list-card-type">{card.typeBucket}</span>
        <InquiryPill />
        <strong>{formatMoney(card.marketPrice)}</strong>
        <button type="button" className="small-action" onClick={onToggleWanted}>{wanted ? "Saved" : "Want"}</button>
      </article>
    );
  }

  return (
    <article className={`card-tile ${view === "details" ? "detail-card" : ""} ${selected ? "is-selected" : ""}`}>
      <div className="card-image-wrap">
        <button type="button" className="image-button" onClick={onPreview} aria-label={`Preview ${card.name}`}><img src={card.imageUrl} alt="" loading="lazy" /></button>
        <InquiryPill />
      </div>
      <div className="card-content">
        <div className="card-title-row"><h3>{card.name}</h3><strong>{formatMoney(card.marketPrice)}</strong></div>
        <p className="print-line">{card.setName} · {card.setCode.toUpperCase()} {card.collectorNumber} · {titleCase(card.finish)}</p>
        {view === "details" && <><p className="type-line">{card.typeLine}</p><p className="oracle">{card.oracleText || "No Oracle text."}</p></>}
        <div className="card-footer">
          <ColorDots card={card} />
          <div className="card-actions">
            <button type="button" className="small-action" onClick={onToggleWanted}>{wanted ? "Saved" : "Want"}</button>
            <label className="select-card"><input type="checkbox" checked={selected} onChange={onToggleSelected} /> <span>{selected ? "In list" : "Request"}</span></label>
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
        <div><p className="eyebrow">{card.setName} · {card.setCode.toUpperCase()} {card.collectorNumber}</p><h3>{card.name}</h3><InquiryPill /></div>
        <p className="type-line">{card.typeLine}</p>
        <p className="focus-oracle">{card.oracleText || "No Oracle text."}</p>
        <dl className="focus-facts"><div><dt>Finish</dt><dd>{titleCase(card.finish)}</dd></div><div><dt>Condition</dt><dd>{titleCase(card.condition)}</dd></div><div><dt>Snapshot</dt><dd>{formatMoney(card.marketPrice)}</dd></div></dl>
        <div className="focus-actions"><button type="button" className="secondary-action" onClick={onToggleWanted}>{wanted ? "Remove from wants" : "Add to wants"}</button><button type="button" className="primary-action" onClick={onToggleSelected}>{selected ? "Remove from trade list" : "Add to trade list"}</button></div>
      </div>
    </article>
  );
}
