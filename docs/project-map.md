---
status: active
lane: prototype
type: project-map
pin: false
---

# Trade Binder Sites Prototype map

## Current slice

Prove a compact, warm-dark public binder that mirrors the approved Trade Binder North Star: a desktop rail, card-first grid, compact controls, and a mobile bottom navigation. It must also give a visitor a clear next step after selecting cards.

## Source map

- `app/page.tsx` keeps the route thin and supplies page metadata.
- `app/components/TradeBinderPrototype.tsx` owns browse state, advanced filters, views, preview, and the trade request flow.
- `app/data/types.ts` owns the public-binder data contract.
- `app/data/mtg.ts` owns Magic-specific formatting and color/filter helpers.
- `app/globals.css` owns the isolated visual system and responsive behavior.
- `public/data/cards.json` is a read-only copy of the current public GitHub-binder index. Refresh it from the canonical shareable generator; do not hand-edit it.

## Production handoff

After approval, port the interaction model into `scripts/codex/generate-marvel-trade-shareable.mjs` and its generated `docs/shareables/trade-binder/` output. Preserve the existing public URL and source-generated workflow; the Sites prototype is a design and interaction reference, not a second public source of truth.

## Deliberate exclusions

- No card-data editing, authentication, pricing API calls, or durable user state.
- No change to the live GitHub Pages binder until user approval.
