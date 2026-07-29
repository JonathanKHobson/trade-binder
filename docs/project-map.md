---
status: active
lane: prototype
type: project-map
pin: false
---

# Trade Binder Sites Prototype map

## Current slice

Deliver a finished, light-first private Trade Binder candidate: dense physical-card browsing, honest inquiry-only trade language, a clear request path, device-local wants, and a protected future lane for homebrew/proxy cards.

## Source map

- `app/page.tsx` keeps the route thin and supplies page metadata.
- `app/components/TradeBinderPrototype.tsx` orchestrates collection state, navigation, local preferences, and the main browser views.
- `app/components/trade-binder/CardViews.tsx` owns reusable grid, detail, list, and focus card presentations.
- `app/components/trade-binder/TradeDialogs.tsx` owns advanced filtering, preview, request, and download dialogs.
- `app/components/trade-binder/ModalFrame.tsx` owns the shared keyboard-safe modal behavior.
- `app/data/types.ts` owns the public-binder data contract.
- `app/data/mtg.ts` owns Magic-specific formatting and color/filter helpers.
- `app/data/tradeBrowser.ts` owns filtering, sorting, and filter-state rules.
- `app/data/tradeExports.ts` owns trade-request text and CSV/text/XML selection exports.
- `app/data/tradeConfig.ts` owns the intentionally explicit public-contact setting.
- `app/globals.css` owns the isolated visual system and responsive behavior.
- `public/data/cards.json` is a read-only copy of the current public GitHub-binder index. Refresh it from the canonical shareable generator; do not hand-edit it.
- `public/og.png` is the accepted light-mode social preview for this private site.

## Production handoff

After approval, port the interaction model into `scripts/codex/generate-marvel-trade-shareable.mjs` and its generated `docs/shareables/trade-binder/` output. Preserve the existing public URL and source-generated workflow; the Sites prototype is a design and interaction reference, not a second public source of truth.

## Deliberate exclusions

- No card-data editing, authentication, pricing API calls, or durable cross-device user state.
- No change to the live GitHub Pages binder until user approval.
