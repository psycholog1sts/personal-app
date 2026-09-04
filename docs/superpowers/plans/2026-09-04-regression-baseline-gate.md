# Regression Baseline Gate Implementation Plan

## Goal

Allow mature repositories to adopt RLSProof as a ratcheting CI gate without allowing baselines to weaken coverage or DB-proof semantics.

## Task 1 — Contract tests (RED)

Modify `test/action.test.js` first.

Add tests that require:
- `action.yml` exposes optional `baseline-report` and outputs `baseline-mode`, `regressions`, `resolved-findings`.
- baseline mode with the same high finding already present does not block solely for that legacy finding.
- a new high finding blocks.
- same finding ID with a severity increase blocks.
- incompatible engine scope fails closed.
- incomplete baseline coverage fails closed.

Run CI and confirm the new tests fail for missing behavior before implementation.

## Task 2 — Pure regression evaluator

Add `src/action/baseline.js` with pure functions:
- validate baseline shape and coverage compatibility.
- compare finding IDs and severity rank.
- return regression, existing, resolved counts and a static regression gate.

No file IO in this module.

## Task 3 — Action runtime integration

Modify `src/action/run.js`:
- parse `baseline-report` / `RLSPROOF_BASELINE_REPORT`.
- read baseline using existing hardened `readReport`.
- evaluate after current static scan, before final release state.
- replace only the static absolute gate with regression static gate when baseline mode is active.
- combine with DB proof using existing `combineReleaseGate` semantics.
- keep full-mode incomplete coverage fail-closed.
- write baseline outputs and summary counts.

## Task 4 — Composite action manifest

Modify `action.yml`:
- optional `baseline-report`, default empty.
- wire env to runtime.
- expose baseline outputs.

No behavior change for users who omit the input.

## Task 5 — Docs / install surface

Update README and install copy with an explicit ratchet example. State that the baseline must be generated with the same scan mode, must have complete coverage, and is a reviewed acceptance artifact — not a way to suppress DB proof or missing coverage.

## Task 6 — Verification

Run:
- full unit suite
- production build
- static export verification
- action contract
- external integration with real pinned scanners

Open PR only after GREEN. Review exact diff for secret leakage, baseline bypasses, coverage downgrade paths, and accidental default behavior changes. Merge only exact verified head, then re-run main CI and Pages deployment on merge SHA.
