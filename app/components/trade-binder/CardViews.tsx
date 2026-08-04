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
  variantNavigation?: CardStepNavigation;
  faceNavigation?: CardStepNavigation;
};

export type CardStepNavigation = {
  position: number;
  count: number;
  label: string;
  onPrevious?: () => void;
  onNext: () => void;
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

function stopNavigation(action: () => void) {
  return (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    action();
  };
}

function CardImageControls({ card, variantNavigation, faceNavigation }: { card: Card; variantNavigation?: CardStepNavigation; faceNavigation?: CardStepNavigation }) {
  return <>
    {variantNavigation && variantNavigation.count > 1 && <div className="variant-controls" aria-label={`${card.name} variants`}>
      <button type="button" onClick={stopNavigation(variantNavigation.onPrevious || variantNavigation.onNext)} aria-label={`Previous variant of ${card.name}`}>‹</button>
      <span><b>{variantNavigation.position}</b> / {variantNavigation.count}<small>variants</small></span>
      <button type="button" onClick={stopNavigation(variantNavigation.onNext)} aria-label={`Next variant of ${card.name}`}>›</button>
    </div>}
    {faceNavigation && faceNavigation.count > 1 && <button type="button" className="face-toggle" onClick={stopNavigation(faceNavigation.onNext)} aria-label={`Show ${faceNavigation.position === 1 ? "back" : "front"} face of ${card.name}`}>
      <span aria-hidden="true">↻</span>{faceNavigation.position === 1 ? "Back" : "Front"}
    </button>}
  </>;
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

export function CardView({ card, view, selected, wanted, onToggleSelected, onToggleWanted, onPreview, variantNavigation, faceNavigation }: CardViewProps) {
  if (view === "list") {
    return (
      <article className={`list-card ${selected ? "is-selected" : ""}`}>
        <SelectionControl className="list-selection" cardName={card.name} selected={selected} onToggle={onToggleSelected} />
        <button type="button" className="list-card-name" onClick={onPreview}>{card.name}</button>
        <span className="list-card-print">{card.setCode.toUpperCase()} {card.collectorNumber} · {card.homebrew ? card.variantName : card.owner} {card.homebrew && card.variantCount ? `· ${card.variantCount} variants` : `· ${card.quantity} ${card.quantity === 1 ? "copy" : "copies"}`}</span>
        <span className="list-card-type">{card.typeBucket}</span>
        <TradeStatusPill card={card} />
        <strong>{formatMoney(card.marketPrice)}</strong>
        <span className="list-actions">{variantNavigation && variantNavigation.count > 1 && <><button type="button" className="step-action" onClick={variantNavigation.onPrevious || variantNavigation.onNext} aria-label={`Previous variant of ${card.name}`}>‹</button><button type="button" className="step-action" onClick={variantNavigation.onNext} aria-label={`Next variant of ${card.name}`}>›</button></>}<button type="button" className="small-action" onClick={onToggleWanted}>{wanted ? "Saved" : "Want"}</button></span>
      </article>
    );
  }

  return (
    <article className={`card-tile ${view === "details" ? "detail-card" : ""} ${selected ? "is-selected" : ""}`}>
      <div className="card-image-wrap">
        <button type="button" className="image-button" onClick={onPreview} aria-label={`Preview ${card.name}`}><img src={card.imageUrl} alt={`${card.name}${card.activeFaceIndex ? " back face" : " card"}`} loading="lazy" /></button>
        <SelectionControl className="card-selection" cardName={card.name} selected={selected} onToggle={onToggleSelected} />
        <TradeStatusPill card={card} />
        <CardImageControls card={card} variantNavigation={variantNavigation} faceNavigation={faceNavigation} />
      </div>
      <div className="card-content">
        <div className="card-title-row"><h3>{card.name}</h3><strong>{formatMoney(card.marketPrice)}</strong></div>
        <p className="print-line">{card.setName} · {card.setCode.toUpperCase()} {card.collectorNumber} · {card.homebrew ? card.variantName : titleCase(card.finish)}</p>
        <p className="ownership-line">{card.homebrew ? `Designed by ${card.designer || card.owner} · ${titleCase(card.variantPolicy || "default")} export` : `${card.owner} · ${card.quantity} ${card.quantity === 1 ? "copy" : "copies"}`}</p>
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

export function FocusCard({ card, selected, wanted, onToggleSelected, onToggleWanted, onPreview, variantNavigation, faceNavigation }: Omit<CardViewProps, "view">) {
  return (
    <article className="focus-card">
      <div className="focus-card-image"><button type="button" className="image-button" onClick={onPreview} aria-label={`Open full preview of ${card.name}`}><img src={card.imageUrl} alt={`${card.name}${card.activeFaceIndex ? " back face" : " card"}`} /></button><CardImageControls card={card} variantNavigation={variantNavigation} faceNavigation={faceNavigation} /></div>
      <div className="focus-card-copy">
        <div><p className="eyebrow">{card.setName} · {card.setCode.toUpperCase()} {card.collectorNumber}</p><h3>{card.name}</h3><TradeStatusPill card={card} /></div>
        <p className="type-line">{card.typeLine}</p>
        <p className="focus-oracle">{card.oracleText || "No Oracle text."}</p>
        <dl className="focus-facts"><div><dt>{card.homebrew ? "Designer" : "Owner"}</dt><dd>{card.designer || card.owner}</dd></div><div><dt>{card.homebrew ? "Variant" : "Quantity"}</dt><dd>{card.homebrew ? card.variantName : `${card.quantity} ${card.quantity === 1 ? "copy" : "copies"}`}</dd></div><div><dt>{card.homebrew ? "Export policy" : "Finish"}</dt><dd>{titleCase(card.homebrew ? card.variantPolicy || "default" : card.finish)}</dd></div><div><dt>{card.homebrew ? "Faces" : "Condition"}</dt><dd>{card.homebrew ? card.faces?.length || 1 : titleCase(card.condition)}</dd></div>{!card.homebrew && <div><dt>Snapshot</dt><dd>{formatMoney(card.marketPrice)}</dd></div>}</dl>
        <div className="focus-actions"><button type="button" className="secondary-action" onClick={onToggleWanted}>{wanted ? "Remove from wants" : "Add to wants"}</button><SelectionControl className="focus-selection" cardName={card.name} selected={selected} onToggle={onToggleSelected} label={selected ? "Selected" : "Select card"} /></div>
      </div>
    </article>
  );
}
