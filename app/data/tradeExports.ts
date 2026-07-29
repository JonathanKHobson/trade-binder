import { formatMoney, titleCase } from "./mtg";
import type { Card } from "./types";

const csvEscape = (value: string | number | null | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const xmlEscape = (value: string | number | null | undefined) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

export function buildTradeRequest(cards: Card[]) {
  const list = cards.map((card) =>
    `• ${card.quantity}× ${card.name} (${card.setCode.toUpperCase()} ${card.collectorNumber}, ${titleCase(card.finish)}, ${titleCase(card.condition)}, owner: ${card.owner}) — ${formatMoney(card.marketPrice)}`,
  ).join("\n");
  return `Hi! I’m interested in the following cards from your trade binder:\n\n${list}\n\nCould you let me know what you’re looking for in trade?`;
}

export function buildTradeCsv(cards: Card[]) {
  const headings = ["name", "quantity", "owner", "source_binders", "set_code", "set_name", "collector_number", "finish", "condition", "language", "market_price", "market_currency", "rarity", "type_line", "color_identity", "scryfall_uri"];
  const rows = cards.map((card) => [card.name, card.quantity, card.owner, card.sourceBinders.join("; "), card.setCode.toUpperCase(), card.setName, card.collectorNumber, card.finish, card.condition, card.language, card.marketPrice, "USD", card.rarity, card.typeLine, card.colorIdentity.join(""), card.scryfallUri]);
  return [headings, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function buildTradeText(cards: Card[]) {
  return cards.map((card) => `${card.quantity} ${card.name} (${card.setCode.toUpperCase()}) ${card.collectorNumber}\n# Owner: ${card.owner} | Finish: ${titleCase(card.finish)} | Condition: ${titleCase(card.condition)} | Snapshot: ${formatMoney(card.marketPrice)}`).join("\n\n");
}

export function buildTradeXml(cards: Card[]) {
  const cardRows = cards.map((card) => `  <card name="${xmlEscape(card.name)}" quantity="${card.quantity}" owner="${xmlEscape(card.owner)}" set_code="${xmlEscape(card.setCode.toUpperCase())}" collector_number="${xmlEscape(card.collectorNumber)}" finish="${xmlEscape(card.finish)}" condition="${xmlEscape(card.condition)}" market_price="${xmlEscape(card.marketPrice)}" scryfall_uri="${xmlEscape(card.scryfallUri)}" />`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<tradeSelection>\n${cardRows}\n</tradeSelection>\n`;
}

export function downloadTradeSelection(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
