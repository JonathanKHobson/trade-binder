# Trade Binder

Trade Binder is a public, read-only Magic collection browser for exact prints. It preserves the owner, finish, condition, source, and trade status of each record while giving visitors a compact way to search cards and assemble an inquiry.

[Open the public Trade Binder](https://jonathankhobson.github.io/trade-binder/). The `main` branch contains application source and generated public data; GitHub Pages serves the generated `gh-pages` branch.

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

- `public/data/cards.json` is a compact, read-only generated collection manifest; `public/data/cards.json.gz` is its complete generated physical-card catalogue. Refresh both with the explicit snapshot command in [Refresh data only from its owner](#refresh-data-only-from-its-owner); do not hand-edit either.
- `app/data/inventory.ts` consolidates only indistinguishable physical copies at display time. It never changes the source snapshot.
- Wants and display preference are intentionally stored only in the visitor’s browser.
- Set `app/data/tradeConfig.ts` only after confirming the exact public email address that should receive trade requests.
- `public/assets/mana/` contains the canonical mana-symbol SVGs used by the advanced color filter. `public/assets/local-card-images/` holds the small set of local images referenced by the snapshot.

## Validate locally

Use Node.js 22.13 or later, as declared in `package.json`. In a full checkout, install the locked dependencies with `npm ci`, then choose the appropriate command below. `npm run dev` starts a development server; it is not a test. Stop it when previewing is finished. The full `npm test` suite also needs the enclosing Forge workspace described below.

```bash
npm run dev
npm run lint
npm test
npm run build:pages
```

`npm run build:pages` prerenders the client and prepares `dist/client/` for the generated `gh-pages` release branch. Do not hand-edit that branch; it is the static deployment artifact for the public GitHub Pages site.

For a standalone checkout with dependencies installed, the focused inventory/export and homebrew grouping checks are:

```sh
node --test tests/inventory-and-exports.test.mjs tests/homebrew-browser.test.mjs
```

These do not replace the full suite. `tests/homebrew-data.test.mjs` imports Forge's `csv-parse` dependency, reads the enclosing `sets/` source and checks committed card images. `npm test` includes it, so a standalone clone cannot run the complete suite without the source workspace. Do not remove that check to obtain a passing result.

For filtering or browser interaction changes, also run `npm run qa:homebrew` from the Trade Binder package directory inside the enclosing Forge workspace, with Forge's Playwright Chromium installed and a preview already serving. Set `TRADE_BINDER_QA_URL` to that preview, including `?scope=homebrew`, and `TRADE_BINDER_QA_OUTPUT` to a temporary review folder. The script defaults to port 4173 under `/trade-binder/`; it does not start a server. Review its inventory-count assertions when source data intentionally changes. This browser check covers advanced filters; the focused unit checks do not establish complete filtering coverage.

See [docs/project-map.md](docs/project-map.md) for source ownership and deployment boundaries.

## Refresh data only from its owner

Ordinary application work can use the committed data. A data refresh is a separate operation:

- Physical cards: `node scripts/refresh-owned-cards.mjs <approved-snapshot.json-or-.gz>` requires a validated, public-safe Homebrew Forge snapshot. The script checks quantities and unique IDs before replacing the generated manifest and compressed catalog.
- Homebrew metadata and images: `npm run generate:homebrew` runs `scripts/generate-homebrew-data.ts` and requires the owning Homebrew Forge workspace, including `packages/forge`, its dependencies, renderer inputs and `sets/`. A standalone clone does not supply that layout. Do not install arbitrary packages or rewrite paths merely to make this command run; locate the source workspace and preserve its export policy first.

The source branch, generated data and `gh-pages` output have different roles. Keep source changes on `main` or a review branch, regenerate through the documented owner, and publish only after separately authorized release checks. Agent guidance is in [AGENTS.md](AGENTS.md).
