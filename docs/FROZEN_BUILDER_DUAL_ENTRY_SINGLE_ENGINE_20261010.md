# FROZEN — RAR Builder Dual-Entry, Single-Engine Contract
Date: 2026-10-10
Status: FROZEN BY OWNER DIRECTION
Scope: All clubs, all years, all horses; Collection Builder and LIVE Builder.

## Non-negotiable invariant
**Collection Builder and LIVE Builder MUST send every eligible input through the EXACT SAME canonical analysis engine, same version-locked FROZEN rules, same preprocessing, QA gates, scoring, simulation and persistence contract.** Different submission methods must never produce different algorithms, coefficients, heuristics, or overrides. LIVE mode is NOT a different scoring method.

## Two entrances only
- **Collection Builder:** owner/cooperator selects and uploads official source PDFs. User-facing intake and authorization can vary.
- **LIVE Builder:** operator/assistant retrieves original official PDFs from online sources, stages them and initiates batch jobs. Source collection mechanism may vary.
- Once original PDFs and validated fact inputs are supplied, both must converge at a single shared canonical processing boundary.

## Mandatory parity checks
1. Same source bytes and canonical facts => same PDF SHA-256, image SHA-256, exact parser/crop/normalization versions and QA decisions.
2. Identical Potential pipeline including official canonical image extraction, FROZEN segmentation and deterministic scoring, not an ad-hoc external substitute.
3. Identical Pedigree /20 source handling and FROZEN NICKS/mother/sibling/winning rate computations; reference provenance may differ for historical sources but no change to formula.
4. Identical version-locked 1000 Career generation, Middle/High simulation, Dream/IV scoring and deterministic seeds.
5. The same engine version + FROZEN config hash + exact inputs + seeds => exactly the same numerical output, not approximately similar.
6. Store raw evidence and source epoch, model & config hashes, QA ledger, engine version, simulation parameters, outputs and decision statuses per horse.
7. Any mismatch = QA FAIL, block Official publication and identify root cause; never patch output merely to make numbers agree.

## Change control
- Changes to FROZEN require explicit owner authorization, version bump, migration/QA and dual-entry regression.
- No year-only independent scoring script may be used as Official; helper data acquisition/audit tools are allowed only if routed into the shared engine.
- A historical cohort can display 「参考値」 as its provenance while still entering Official once the exact shared pipeline and all horse-level QA pass.

## Implementation gate — not yet certified
This contract freezes the REQUIRED behavior. It does not assert that the currently deployed Collection and LIVE apps have already passed equivalence testing. Before declaring parity PASS: verify both entrypoints point to the same runtime/build, submit an identical official PDF through both, inspect input/output evidence hashes, recompute numerical checksums, and publish an explicit parity test report. Until then mark DUAL_ENTRY_PARITY_UNVERIFIED.
