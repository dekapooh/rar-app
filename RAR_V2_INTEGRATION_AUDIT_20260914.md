# RAR v2 Integration Audit — 2026-09-14

Target repository: `dekapooh/rar-app`  
Target branch: `integration/rar-v2-score-contract-20260914`  
Public `main`: unchanged by this integration work.

## Score contract

Expected production architecture:

`RAR /100 = Potential /30 + Pedigree /20 + Dream /20 + Investment Value /30`

Current numeric state:

- Potential: available for 82/82
- Pedigree: available for 82/82
- Dream Middle / High Career / Official: generated for 82/82
- ROI prize generator coefficients: HOLD
- Middle / High / Official prize: HOLD
- Middle / High / Official ROI: HOLD
- Investment Value /30: HOLD
- Official RAR /100: HOLD
- Displayed integration subtotal while HOLD: Potential + Pedigree + Dream = provisional /70

## Static contract audit

Result: **PASS**

Checks performed:

- summary rows = 82
- unique recruitment nos = 82
- recruitment no coverage = 1..82
- Potential source rows = 82
- Pedigree source rows = 82
- FACT source rows = 82
- all 82 joins resolved
- all Dream Middle values independently recomputed from FROZEN percentile mapping and matched
- all Dream High Career values independently recomputed and matched
- all Dream Official values matched `(Middle + High Career) / 2`
- all provisional /70 subtotals matched
- all recruitment totals matched FACT source
- all prize / ROI / IV / Official RAR fields remained null while HOLD
- all 82 rows report IV HOLD
- overlay JavaScript syntax check passed
- service-worker JavaScript syntax check passed
- index category maxima = 30 / 20 / 20 / 30
- generated summary is primary overlay source
- deterministic source rebuild remains fallback only
- IV controls are disabled while HOLD
- legacy ROI Personal Point is excluded from effective Personal total and Personal budget while HOLD
- ranking/search/compare/mypage provisional labels are present
- service-worker shell contains overlay, generated summary and all three source files

Dream Official observed range in the current 82 rows: 9.25–12.5.

## Synthetic runtime smoke

Result: **PASS_SYNTHETIC_RUNTIME**

The actual `rar-v2-overlay.js` was executed against:

- the actual generated 82-row `rar-v2-summaries.json`
- an 82-horse legacy in-memory `HORSES` fixture
- minimal browser-like globals

Verified runtime output:

- overlay active = true
- applied rows = 82
- source = `rar-v2-summaries.json`
- score architecture = `30+20+20+30`
- IV status = HOLD
- current ranking maximum = 70
- Dream max contract = 20
- IV max contract = 30
- HOLD horses = 82
- legacy ROI is preserved separately but removed from active score

## Tests not executed

These must not be reported as PASS:

- targeted pytest: NOT RUN
- repository full pytest: NOT RUN
- real browser/device smoke: NOT RUN
- real Service Worker offline/cache runtime smoke: NOT RUN

Reason for browser test not running in this environment:

- local Chromium exists
- direct checkout/download of the integration branch from the container was blocked by outbound GitHub DNS/network restrictions
- connected GitHub reads were available and were used for all repository evidence

## Promotion decision

### Official RAR v2 /100 public release

**NO-GO at this audit point.**

Reasons:

1. ROI Prize Generator numeric config is still HOLD, so IV /30 and Official RAR /100 do not yet exist.
2. Real browser/device smoke has not been executed.
3. Real PWA/offline cache smoke has not been executed.

### Provisional /70 integration build

Technically ready for controlled testing on the integration branch.

It explicitly identifies itself as provisional, fails closed on IV, and does not substitute legacy ROI /25 for Investment Value /30.

Publishing the provisional /70 build to public `main` is a product decision, not an automatic technical promotion.

## Next gate

For full Official RAR v2 completion:

1. Freeze an evidence-backed ROI Prize Generator config as `FROZEN_FINAL`.
2. Generate Middle / High Career prize and ROI values for all 82 horses.
3. Generate IV /30 and Official RAR /100.
4. Replace HOLD fields in `rar-v2-summaries.json`.
5. Execute real browser/device smoke.
6. Execute real PWA/cache smoke.
7. Final integration-vs-main diff review.
8. Promote to `main`.

## Builder -> RAR transfer audit update

Transfer contract: `RAR_BUILDER_TO_APP_TRANSFER_20260914`

### Static transfer audit — PASS

Verified after the first actual Builder -> RAR integration write:

- Builder payload: `dekapooh/RAR:builder_app/web/rar-v2-summaries.json`
- App payload: `dekapooh/rar-app:rar-v2-summaries.json`
- Git blob SHA on both sides: `897a035c63980ed621abff3ae6307d1bed159ed3`
- row count: 82
- unique recruitment numbers 1..82: PASS
- transfer contract ID rows: 82/82
- `roi_iv_status=HOLD`: 82/82
- Official RAR /100 null while IV is HOLD: 82/82
- Dream Official = (Middle + High Career) / 2: PASS
- provisional /70 = Potential + Pedigree + Dream: PASS
- PWA cache key bumped to `rar-rc66-public-beta-v14-rar-v2-builder-sync`
- `rar-v2-summaries.json` remains in the service-worker app shell

The current integration branch is ahead of public `main`; no transfer in this audit writes to public `main`.

### Still not run

- real browser/device smoke
- real Service Worker offline/cache runtime smoke
- full Builder pytest after the transfer-generator addition

Therefore this PASS applies only to the static Builder-to-App transfer contract. It does not change the existing NO-GO for Official RAR /100 public release while the numeric ROI Prize Generator config remains HOLD.

