# Trade Binder — North Star Prototype

This private, source-backed prototype is the finished interaction and visual reference for the Homebrew Forge Trade Binder. It reads a copy of the public binder index but never changes collection data or the public GitHub Pages binder.

## What it covers

- Light-first, compact card browsing with a device-local dark appearance toggle.
- Search, true quick filters, and an advanced Magic-native print search.
- Grid, details, list, and one-card focus views with real sorting.
- A clear, inquiry-only trade request flow with copy, contact, and CSV/text/XML export actions.
- A device-local wants list and a deliberately separate future homebrew/proxy scope.

## Source boundaries

- `public/data/cards.json` is a read-only generated collection snapshot. Refresh it from the canonical trade-binder generator; do not hand-edit it.
- Wants and display preference are intentionally stored only in the visitor’s browser.
- Set `app/data/tradeConfig.ts` only after confirming the exact public email address that should receive trade requests.

## Validate locally

```bash
npm run dev
npm run lint
npm test
```

See [docs/project-map.md](docs/project-map.md) for the production handoff after approval.
