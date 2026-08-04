---
status: active
lane: public-shareable
type: qa-report
pin: false
---

# Homebrew Trade Binder release QA

## Release contract

- Source: current Homebrew Forge set CSVs loaded through the same normalization path as Maker.
- Included: every non-archived variant whose export policy is `default` or `optional`.
- Excluded: the complete `DEMO` set and every `excluded` export variant.
- Rendering: complete 488×680 Maker-preview images from shared `CardSvg`; landscape layouts retain their complete canvas.
- Relationships: variants remain grouped by authored base-card ID, while authored front/back faces remain attached to the exact variant.

## Inventory result

- 563 authored base cards.
- 1,191 eligible variants.
- 1,226 complete card-face images.
- 13 non-demo sets: AFN, ALN, BAR, HBF, KEN, MOTU, RAC, SGE, SGG, SGR, SGW, SOA, and SQM.
- `UNGRP` is present in source but currently contains no card rows.

## Visual anchor map

| ID | Source / viewport | Region | Observation | Action | Verification |
| --- | --- | --- | --- | --- | --- |
| A1 | Desktop 1440×1000 | Header and scope | Homebrew reads as the sibling collection scope inside the established official-card shell. | Preserve the official header, nav, light-first tokens, and view controls. | Chromium screenshot and DOM assertions passed. |
| A2 | Desktop 1440×1000 | Search and filters | Search, filters, set/designer controls, and Grouped/All variants are visible without expanding a panel. | Keep variant display as a first-class control. | Share URL retains scope, query, filters, and display mode. |
| A3 | Desktop card grid | Card image overlay | Grouped cards always show total variant position/count; arrows appear for card hover or keyboard focus. | Keep arrows secondary until interaction while retaining the count. | Hover opacity and variant change assertions passed. |
| A4 | Desktop/mobile card grid and preview | Transform controls | Front/Back is distinct from variant cycling and uses the exact linked face images. | Keep face language explicit rather than overloading variant arrows. | Source URL, preview heading, and face-switch assertions passed. |
| B1 | Mobile 390×844 | Homebrew controls | Variant display is the leading horizontal control, ahead of lower-priority quick filters. | Preserve this mobile order. | Touch viewport screenshot passed with no page overflow. |
| B2 | Mobile 390×844 | Three-column grid | Full cards remain uncropped at official-binder density; arrows are visible on coarse pointers. | Preserve `object-fit: contain` and touch-visible arrows. | Mobile image/overlay assertions passed. |

## Design taste gate

- Surface: public operational card browser.
- Dials: low variance, low motion, high scan density, established Trade Binder reference source, high trust.
- Verdict: ready. The Homebrew scope is visually specific to this collection without becoming a separate redesign or a generic card-gallery template.
- Keep: compact official-binder hierarchy, plain-language physical-print disclaimer, complete card imagery, separate variant/face actions, and mobile three-column scan density.

## Automated and browser gates

- ESLint: pass.
- Unit/data tests: 7/7 pass.
- Static GitHub Pages build: pass.
- Source-to-generated variant equality: pass.
- 1,226/1,226 face images present and non-zero: pass.
- Desktop and touch-mobile Playwright loop: pass.
- Console errors: 0.
- Failed requests: 0.
- Page horizontal overflow: none at 1440×1000 or 390×844.

## Source-renderer warnings

Maker reports six existing flavor-text overflow warnings on exact authored variants: SGE Earth V1; SGR Halla Containment World V1 and Legacy Art; SGW Michael's Command Base V1 and Legacy Art; and SGW Wraith Homeworld Silent Spires Legacy Art. The Trade Binder faithfully displays Maker's current output and records these warnings in generated data; this release does not silently rewrite card content or layout.
