---
status: active
lane: public-shareable
type: project-map
pin: false
---

# Trade Binder project map

## Current slice

Deliver a finished, light-first public Trade Binder with two explicit scopes: dense physical-card browsing with honest inquiry-only trade language, and a complete Homebrew Forge catalog whose eligible variants and linked faces remain visible without implying physical ownership.

## Source map

- `app/page.tsx` keeps the route thin and supplies page metadata.
- `app/components/TradeBinderPrototype.tsx` orchestrates collection state, navigation, local preferences, and the main browser views.
- `app/components/trade-binder/CardViews.tsx` owns reusable grid, detail, list, and focus card presentations.
- `app/components/trade-binder/TradeDialogs.tsx` owns advanced filtering, preview, request, and download dialogs.
- `app/components/trade-binder/ModalFrame.tsx` owns the shared keyboard-safe modal behavior.
- `app/data/types.ts` owns the public-binder data contract.
- `app/data/mtg.ts` owns Magic-specific formatting and color/filter helpers.
- `app/data/inventory.ts` owns non-destructive consolidation of truly identical cards and requestability rules.
- `app/data/homebrewBrowser.ts` owns homebrew grouping, exact-variant display, and active-face projection without mutating generated source records.
- `app/data/shareState.ts` owns shareable physical/homebrew URLs and persisted filter/view query state.
- `app/data/tradeBrowser.ts` owns filtering, sorting, and filter-state rules.
- `app/data/tradeExports.ts` owns trade-request text and CSV/text/XML selection exports.
- `app/data/tradeConfig.ts` owns the intentionally explicit public-contact setting.
- `app/globals.css` owns the isolated visual system and responsive behavior.
- `public/data/cards.json` is a read-only collection snapshot. Refresh it from the canonical collection generator; do not hand-edit it.
- `public/data/homebrew-cards.json` is generated from current Homebrew Forge set CSVs. It includes every non-archived variant whose export policy is `default` or `optional`, excludes `DEMO`, and connects all authored faces.
- `public/assets/mana/` owns the mana symbols used by the color-identity filter; `public/assets/local-card-images/` mirrors snapshot-referenced local image files.
- `public/assets/homebrew-cards/` contains web-sized 488×680 complete-card renders from the same shared `CardSvg` path used by Maker previews; landscape layouts preserve their full canvas.
- `scripts/generate-homebrew-data.ts` regenerates homebrew metadata and complete card-face images from current set source. It caches only completed source hashes and records renderer warnings against exact faces.
- `scripts/qa-homebrew-browser.mjs` runs the release interaction loop in Chromium at desktop and touch-mobile sizes, including variant/face controls, preview, selection, advanced filters, share state, console/network health, and screenshots.
- `docs/homebrew-release-qa.md` records the source contract, inventory totals, visual anchor map, design-taste verdict, browser evidence, and exact Maker warnings for this release.
- `scripts/build-github-pages.mjs` builds and copies the static root documents used by GitHub Pages.
- The generated `gh-pages` branch is the production deployment route. It contains the static `dist/client/` artifact built by `scripts/build-github-pages.mjs`.
- `tests/inventory-and-exports.test.mjs` locks the duplicate-merge contract and exact-print export fields; `tests/rendered-html.test.mjs` checks the server-rendered shell.
- `tests/homebrew-data.test.mjs` proves non-demo default/optional variant completeness, image presence, variant counts, and transform-face links; `tests/homebrew-browser.test.mjs` locks grouped versus separate behavior.
- `public/og.png` is the accepted light-mode social preview.

## Deployment boundary

The repository deploys its own public Trade Binder through GitHub Pages. The old Homebrew Forge shareable routes are redirect-only compatibility paths; they do not own the production app or duplicate its source.

## Deliberate exclusions

- No card-data editing, authentication, pricing API calls, or durable cross-device user state.
- No automatic claim that a card is tradeable: the snapshot’s explicit status governs every request action.
- No claim that a homebrew listing is physically printed or available; the Homebrew scope is a design catalog and selection/export surface.
