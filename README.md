# Trade Binder

Trade Binder is a public, read-only Magic collection browser for exact prints. It preserves the owner, finish, condition, source, and trade status of each record while giving visitors a compact way to search cards and assemble an inquiry.

## What it covers

- Light-first, compact card browsing with a device-local dark appearance toggle.
- Search, true quick filters, and an advanced Magic-native print search.
- Grid, details, list, and one-card focus views with real sorting.
- Owner and trade-status visibility, plus an Owner filter.
- Exact duplicate prints merge into one quantity only when owner, printing, finish, condition, language, and trade status all match.
- A clear, inquiry-only trade request flow with copy, contact, and CSV/text/XML export actions. Cards marked **Not tradable** remain visible but cannot enter a request.
- A device-local wants list and a deliberately separate homebrew/proxy scope.
- A share control that preserves the current scope, view, search, and filters in the URL.

## Source boundaries

- `public/data/cards.json` is a read-only generated collection snapshot. Refresh it from the canonical collection generator; do not hand-edit it.
- `app/data/inventory.ts` consolidates only indistinguishable physical copies at display time. It never changes the source snapshot.
- Wants and display preference are intentionally stored only in the visitor’s browser.
- Set `app/data/tradeConfig.ts` only after confirming the exact public email address that should receive trade requests.
- `public/assets/mana/` contains the canonical mana-symbol SVGs used by the advanced color filter. `public/assets/local-card-images/` holds the small set of local images referenced by the snapshot.

## Validate locally

```bash
npm run dev
npm run lint
npm test
npm run build:pages
```

`npm run build:pages` prerenders the client and prepares `dist/client/` for the GitHub Pages workflow. The live GitHub Pages deployment is defined in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

See [docs/project-map.md](docs/project-map.md) for source ownership and deployment boundaries.
