---
status: active
lane: public-shareable
type: project-map
pin: false
---

# Trade Binder project map

## Current slice

Deliver a finished, light-first public Trade Binder: dense physical-card browsing, honest inquiry-only trade language, owner and status trust signals, a clear request path, device-local wants, and a protected future lane for homebrew/proxy cards.

## Source map

- `app/page.tsx` keeps the route thin and supplies page metadata.
- `app/components/TradeBinderPrototype.tsx` orchestrates collection state, navigation, local preferences, and the main browser views.
- `app/components/trade-binder/CardViews.tsx` owns reusable grid, detail, list, and focus card presentations.
- `app/components/trade-binder/TradeDialogs.tsx` owns advanced filtering, preview, request, and download dialogs.
- `app/components/trade-binder/ModalFrame.tsx` owns the shared keyboard-safe modal behavior.
- `app/data/types.ts` owns the public-binder data contract.
- `app/data/mtg.ts` owns Magic-specific formatting and color/filter helpers.
- `app/data/inventory.ts` owns non-destructive consolidation of truly identical cards and requestability rules.
- `app/data/shareState.ts` owns shareable physical/homebrew URLs and persisted filter/view query state.
- `app/data/tradeBrowser.ts` owns filtering, sorting, and filter-state rules.
- `app/data/tradeExports.ts` owns trade-request text and CSV/text/XML selection exports.
- `app/data/tradeConfig.ts` owns the intentionally explicit public-contact setting.
- `app/globals.css` owns the isolated visual system and responsive behavior.
- `public/data/cards.json` is a read-only collection snapshot. Refresh it from the canonical collection generator; do not hand-edit it.
- `public/assets/mana/` owns the mana symbols used by the color-identity filter; `public/assets/local-card-images/` mirrors snapshot-referenced local image files.
- `scripts/build-github-pages.mjs` builds and copies the static root documents used by GitHub Pages.
- The generated `gh-pages` branch is the production deployment route. It contains the static `dist/client/` artifact built by `scripts/build-github-pages.mjs`.
- `tests/inventory-and-exports.test.mjs` locks the duplicate-merge contract and exact-print export fields; `tests/rendered-html.test.mjs` checks the server-rendered shell.
- `public/og.png` is the accepted light-mode social preview.

## Deployment boundary

The repository deploys its own public Trade Binder through GitHub Pages. The old Homebrew Forge shareable routes are redirect-only compatibility paths; they do not own the production app or duplicate its source.

## Deliberate exclusions

- No card-data editing, authentication, pricing API calls, or durable cross-device user state.
- No automatic claim that a card is tradeable: the snapshot’s explicit status governs every request action.
