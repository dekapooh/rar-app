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

- Middle scenario = Dream Middle + recruitment-time suitability
- High Career scenario = Dream High Career + recruitment-time suitability
- Official ROI = median of the two scenario ROI values
- Dream diagnostic 1000-Career prize/ROI outputs never feed Official IV

## Current app integration state

The 82-horse integration payload is now generated as:

- `rar-v2-summaries.json`
- join key: recruitment `no` 1..82
- Potential: current 82-horse Potential source
- Pedigree: current 82-horse Pedigree source
- Dream Middle / High Career / Official: FROZEN 2026-09-14 formula
- canonical `horse_id`: not present in current source, therefore left null rather than inferred

The app loads `rar-v2-summaries.json` first. The deterministic three-source Dream rebuild remains only as a fail-safe fallback.

## Numeric ROI/IV HOLD

`RAR_ROI_PRIZE_GENERATOR_CONFIG_20260914` is still `HOLD`.

Therefore the current integration branch deliberately stores:

- Middle prize = null
- High Career prize = null
- Official prize = null
- Middle ROI = null
- High Career ROI = null
- Official ROI = null
- Investment Value = null
- Official RAR /100 total = null

No legacy ROI /25 value is reused as IV /30.

Until the numeric config becomes `FROZEN_FINAL`, the app displays a provisional score subtotal:

`Potential /30 + Pedigree /20 + Dream /20 = /70`

This is explicitly labeled provisional and must not be presented as Official RAR /100.

## App adapter

`rar-v2-overlay.js`:

- overlays Potential /30, Pedigree /20 and Dream /20 onto the legacy `HORSES` objects
- reserves the legacy internal key `roi` for future Investment Value /30 compatibility
- fails closed while IV is HOLD
- disables the IV ranking category while HOLD
- preserves legacy ROI data only in memory as legacy fields; it is not scored
- preserves saved legacy ROI Personal Point data in localStorage but excludes it from ranking, Personal total and editing while IV is HOLD
- exposes Dream Middle / High Career switch UI
- exposes the ROI/prize scenario fields as HOLD until their numeric config is frozen
- retains score/spec provenance

## PWA integration

`index.html` loads the v2 overlay directly.

`sw.js` app shell includes:

- `rar-v2-overlay.js`
- `rar-v2-summaries.json`
- Potential source
- Pedigree source
- FACT source

The service-worker cache key is bumped whenever the integration shell changes.

## Promotion gate before public main

Completed on integration branch:

1. 82-row recruitment-number join
2. Generated Dream summaries
3. Dream /20 UI routing
4. IV /30 UI contract and HOLD fail-closed behavior
5. Middle / High Career detail switch
6. Personal Point HOLD guard
7. PWA shell registration for v2 assets

Still required before public `main`:

1. Static contract audit of the current branch HEAD
2. Browser runtime smoke test
3. PWA/cache runtime smoke test
4. Final review of integration-vs-main diff
5. Explicit merge/promotion decision

The numeric ROI/IV config is a separate data calibration gate. It does not require redesign of the app integration architecture.
