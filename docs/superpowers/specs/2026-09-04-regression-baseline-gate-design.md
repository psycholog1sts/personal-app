# Regression Baseline Gate Design

## Problem

Absolute security gates are correct for greenfield repositories but hard to adopt in mature codebases with an existing finding backlog. Teams need a ratchet: preserve visibility of accepted legacy findings while blocking newly introduced or severity-escalated findings.

## External patterns reviewed

- pgrls supports a committed baseline so CI fails only on new findings and separately supports semantic diff against a known-good snapshot.
- GitHub Code Scanning emphasizes new pull-request alerts and merge protection around introduced vulnerabilities.
- Mature scanners separate tool failure from security failure and preserve incomplete coverage as a non-pass state.

## Product decision

Add an optional `baseline-report` input to the GitHub Action. When absent, current absolute behavior is unchanged. When present, the baseline applies only to static findings; database proof and coverage completeness remain absolute, fail-closed controls.

## Soundness rules

1. Baseline reports must be schemaVersion 1 RLSProof reports.
2. Baseline static coverage must be complete.
3. Baseline and current `scope.requestedEngines` must match exactly, preventing incomparable native/full scans from being treated as equivalent.
4. A regression is either:
   - a finding ID absent from the baseline; or
   - an existing finding whose severity increases.
5. Existing baseline findings at the same or lower severity remain visible but do not block a regression-mode release.
6. Current incomplete requested static coverage remains incomplete/fail-closed even when a baseline exists.
7. Current DB proof failures or required-but-incomplete DB proof remain blocking/incomplete regardless of baseline.
8. A missing, malformed, symlinked, or incompatible baseline fails the Action rather than silently falling back.
9. Baseline mode never edits the baseline file automatically.

## Outputs

Add:
- `baseline-mode`: `off` or `regression`
- `regressions`: count of new or severity-escalated static findings
- `resolved-findings`: count of baseline findings no longer present

Existing outputs remain stable.

## Exit semantics

- `2`: blocking security failure, including a high/critical regression or DB proof block.
- `3`: requested static coverage incomplete in full mode.
- `1`: configuration/runtime error, including an invalid baseline.
- `0`: clear/review state under the selected gate mode.

## Compatibility

Default remains absolute because `baseline-report` defaults to empty. No runtime dependency, hosted backend, paid API, or source upload is introduced.
