# RAR v2 Score Contract Integration

Branch: `integration/rar-v2-score-contract-20260914`

This branch is intentionally isolated from public `main`.

## Builder/Engine source

Official scoring contract:

- Potential /30
- Pedigree /20
- Dream /20
- Investment Value /30
- RAR /100

Official ROI/IV source:

- Middle scenario = Dream Middle + suitability
- High Career scenario = Dream High Career + suitability
- Official ROI = median of the two scenario ROI values

## App integration adapter

`rar-v2-overlay.js` overlays the legacy in-memory `HORSES` objects without
requiring the current 400KB index data block to be replaced immediately.

The legacy internal key `roi` is retained for backward-compatible ranking
logic, but its v2 value is Investment Value /30.

The adapter also stores:

- Dream Middle / High Career
- ROI Middle / High Career / Official
- Middle / High / Official accumulated prize
- score-spec provenance

## Remaining before public main

1. Produce `rar-v2-summaries.json` with a reliable recruitment-number join.
2. Inject/load `rar-v2-overlay.js` from `index.html`.
3. Add the Middle / High Career detail switch UI.
4. Verify rankings and Personal point behavior with Dream /20 and IV /30.
5. Smoke-test PWA/cache behavior.
6. Only then merge to `main`.
