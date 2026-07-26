# Trade Binder — North Star Prototype

This private ChatGPT Sites prototype is the approval-stage redesign for the Homebrew Forge Trade Binder. It deliberately leaves the public GitHub Pages shareable untouched.

The browser uses the current public card index at `public/data/cards.json` as read-only data. It introduces a compact warm-dark binder interface, Magic-native search fields, visual/details/compact views, and a persistent trade-list action that makes the next step explicit.

## Validate locally

```bash
npm run dev
npm run lint
npm test
```

See [docs/project-map.md](docs/project-map.md) for the production handoff after approval.
