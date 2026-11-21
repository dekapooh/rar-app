# Horse-specific Career source correction — 2026-11-22

Owner clarification: the dirt Triple Crown screenshot is No.59 ステップオブダンスの25; the other screenshot is No.85 パーフェクトフルートの25. They are different horses, not before/after screenshots of No.59.

The prior CURRENT_CAREER_DISPLAY and LIVE_PROOF artifacts verified a current-score replay but did not establish that replacing the recorded aptitude was appropriate. Their acceptance conclusion is superseded by this correction.

## Source records

- RAR commit d0693a2c2001b23617c2c678cb5a9f150b86df2e, builder_app/web/silk_2026_suitability_v1.json: No.59/name, dirt1600–2000m, 持続成長, 羽田盃/東京ダービー/JDC/チャンピオンズC/フェブラリーS.
- RAR commit 496727e589d571b9232f29316857d4c9b9c50f27, specs/frozen/RAR_ROI_IV_82_FROZEN_20260914.json: No.59/name, original 14/23 starts, Middle31,968,000 yen/High542,304,999.9999999 yen. Representative high events explicitly include the three dirt classics.
- Current API No.59: 61.047975 total, 13/22 starts, Middle31,254,000/High182,664,999.99999994 yen, Objective v1 guide. This is a different calculation route; no claim that the archive generated the current number.
- Current API No.85: 60.35482857142857 total, 13/22 starts, own persisted Career detail and evidence. No.59 source is never used for it.

## Correction

Original 82-horse recorded suitability is retained in each horse's main aptitude card, bound to its own audited identity. Original Career summaries have their own named/numbered section, explicitly excluded from current Official numbers. Current Official Career uses its own scoring suitability/growth/targets and is separately named/numbered. Current calculation inputs are visible in a separate collapsed block.

No score, prize, API record, Firestore or transfer write. No growth model or FROZEN coefficient changes. Growth unknown applies to Objective v1 only; it is not a statement that all historical FROZEN assets lack growth. The existing v2 candidate was inspected and not silently activated.

Tests: 10 groups including No.59 original/current separation, No.85 no inherited Triple Crown, all82 score/identity bindings, cross-source rejection, cache single-runtime and reference retention. Inline/external JS syntax PASS; all82 current replays PASS. Deployment/live comparison pending, acceptance3/4.
