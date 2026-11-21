# Current Career versus legacy aptitude display — 2026-11-21

Owner screenshots 1000004664/4665 exposed mixed sources on No.59:
current Official prize/score values, but old static turf/distance/growth/category/
target text. Public No.59 Career has growth unknown and target_races empty.
The static 82-horse HTML still contained 持続成長, ダ1600～2000m and a five-race
classic-to-older target list. The frontend fallback incorrectly mixed those values.

## Canonical findings

The frozen Objective v1 policy explicitly fixes growth unknown and delegates
representative targets to Career. It excludes legacy subjective aptitude as input.
Pinned source: dekapooh/RAR recovery commit
496727e589d571b9232f29316857d4c9b9c50f27, engine/calibration/
suitability_objective_v1_policy.json and suitability_sire_year_reference.py.

Replayed all 82 original horses with that existing sire-year rule and the
preserved auto_score_horse. Recruitment-time sire aliases reuse the existing
record builder aliases. All 82 reproduce current RAR/Dream/IV, scenario Dream/IV,
Middle/High starts, prize and ROI within 1e-6. No image/Potential inference,
scoring adjustment, Firebase mutation or transfer was performed.
No.59 current guide is dirt 1400–1800m, growth unknown, High profile G1_JPN1,
representative フェブラリーS. Its 13/22 starts, prizes and 61.047975 total are unchanged.

The 3,125.4万円 Middle prize and 13/22 starts shared by the screenshot horses are
consistent with existing FROZEN Career bands/routes. This display fix does not
change those bands, targets, prizes or coefficients.

## Display-only correction

- Published API records remain authoritative for scores and all stored metadata.
- The 82-horse read-only display supplement is applied only on exact dataset,
  horse identity, source submission, five scores, scenario values and all saved
  Career values. A changed source fails closed and does not reuse the supplement.
- Canonical replay metadata is distinct from originally published Career details.
  It is only display enrichment, not an API/Firestore update or a new source input.
- Before API mapping, preserve static old aptitude in an explicit collapsed
  以前の適性表示（参考） block, then clear old Official fallbacks. Current Career
  cards and suitability use the same current metadata. No old text is deleted.
- Sidecar request is bounded to 5 seconds. If unavailable, current details stay
  unavailable and old text remains explicitly reference-only.
- New script pathname system-master-sync-career-v3.js avoids older service
  workers that ignore query-string versions. Canonical and versioned JS bytes
  are checked equal. SW cache version advances to v54. No Personal storage reset.

Reproducible read-only generator: audit/build-current-career-display.py.
Audited supplement: audit/silk-2026-career-display-v1.json.
Mapping/cache/Admin tests: 8 groups plus all 82 bindings and rejection of modified
scores, identity, submission, scenario, Career counts and cross-dataset reuse PASS.
All JS syntax checks PASS. CI 44960828596 and Pages 44960828588 succeeded.
Live comparison completed on the deployed Premium/Admin screen for Nos.59/83/84/85.

Follow-up acceptance gates fixed at 4: diagnose/canonical comparison; implementation;
regressions/deployment; live Step/new-horse comparison and score preservation.
Current 4/4 complete.

## Final live verification — 2026-11-22 JST

Implementation commits: 3ffdebedd2820c6fecfe0772cf0523877a73cf55 and
8a8624dec3a152a8f21aae188b6280b01eb6f9e7.

The live test found an additional duplicate-script injection in the old service
worker. Fixed the versioned-script detection and added a singleton runtime guard,
plus preservation of an already captured original reference. Regression tests
exercise both single-script HTML transforms and repeated reference capture.
Cache migration from old v53 needed two reloads; v54 serves one v3 sync script.

Verified four live detail pages: names unregistered; Premium small items visible;
current Career and aptitude show the same surface, distance, growth and targets.
For No.59 the expanded old reference retains turf ○, dirt ◎, 1600–2000m,
持続成長, and the original five targets, clearly separate from current metadata.
Totals remain 61.0 / 51.4 / 55.2 / 60.4 in UI. API full-precision scores unchanged.

Published 85-horse API records and immutable version are exactly equal before and
after this frontend release. All 82 existing Career replays equal the committed
read-only supplement. No Firestore write, score update, or transfer was performed.

Machine-readable evidence: audit/CURRENT_CAREER_LIVE_PROOF_20261122.json.
The UI checks cover four horses, while the automated bindings/replays cover all82.
This verifies consistency with existing FROZEN rules; it does not validate
individual predictive accuracy or introduce a growth model.

