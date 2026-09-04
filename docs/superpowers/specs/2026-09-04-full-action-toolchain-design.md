# Full GitHub Action Toolchain Design

Status: implementation-authorized by the standing autonomous engineering directive.

## Goal

Turn the existing GitHub composite Action from a native-only recurring gate into an optionally complete static release gate that can execute the same checksum-verified Gitleaks, OSV-Scanner and Opengrep engines already validated by RLSProof CI, without weakening the current deterministic coverage model or introducing a paid service.

## Why this is the next change

The CLI already supports a full scan, and CI already downloads and verifies all three external engines, but the user-facing composite Action currently calls `scanProject(..., { nativeOnly: true })`. That means the recurring product surface does less than the full engine proven by repository integration tests.

The highest-value low-risk improvement is therefore to connect those already-vetted pieces before adding a new scanner, hosted backend, live-site probe or persistence subsystem.

## External reference analysis

Two current open-source Postgres/RLS projects were reviewed as architecture references:

- `pgrls/pgrls` (MIT) demonstrates useful ideas such as explicit partial/full coverage, semantic RLS diffing, PR-native reporting and fail-closed CI behavior. Directly installing it now would add Python/PyPI transitive dependencies and would not match RLSProof's current checksum-verified external-tool supply-chain standard.
- `unitautogen/rlsautotest` (Apache-2.0) demonstrates deterministic generation of tenant-isolation pgTAP suites and a strong rule that unprovable cells must not become green. Its generated tests are already structurally compatible with RLSProof's recursive `supabase/tests` DB-proof discovery. It must only be used against disposable/local/dedicated test databases because its probes execute real statements even when transactions roll back.

Near-term conclusion: copy neither project and add neither as an automatic runtime dependency. Reuse their soundness and coverage ideas while keeping RLSProof's existing verified toolchain. Document optional interoperability with `rlsautotest` rather than installing it automatically.

## User-facing Action contract

Add one input:

```text
scan-mode: native | full
```

Default remains `native` for backward compatibility.

### `native`

- Exact existing behavior.
- Runs repository-owned native checks only.
- Does not install external scanners.
- Existing action consumers remain unchanged.

### `full`

- Runs native + Gitleaks + OSV-Scanner + Opengrep.
- Uses the repository-owned `config/opengrep.yml` automatically.
- Installs exact, repository-pinned external scanner versions through one shared installer.
- A missing, failed or unconfigured requested engine remains `coverage.complete=false`.
- Full mode may never exit successfully when requested static coverage is incomplete.

The report's semantic release state remains distinct:

- vulnerability finding => normal `blocked` / `review` logic,
- capability gap => `incomplete`, never falsely rewritten as `blocked` or `clear`.

The composite Action process exit code adds an operational enforcement rule: in `full` mode, `releaseGate=incomplete` returns non-zero so CI fails closed even though the report still truthfully says `incomplete` rather than `blocked`.

## Installer architecture

Create a repository-owned shell script:

```text
scripts/install-external-scanners.sh
```

It is the single source of truth for:

- Gitleaks 8.30.1 Linux x64 release URL and SHA-256,
- OSV-Scanner 2.5.1 Linux x64 release URL and SHA-256,
- Opengrep 1.29.0 Linux x64 release URL and SHA-256,
- installation into a caller-provided binary directory,
- version verification.

The script must:

- use `set -euo pipefail`,
- reject unsupported OS/architecture before downloading,
- use fixed URLs, versions and digests rather than user-controlled versions,
- use `curl --fail --location --silent --show-error --retry 3`,
- use `sha256sum --check --strict`,
- install executable files with mode `0755`,
- clean its temporary directory with a trap,
- not use `eval`, shell interpolation of untrusted values, or remote install scripts.

Initial supported Action runner: Linux x86_64 / amd64. Unsupported platforms fail explicitly rather than silently reducing coverage.

The script accepts one installation directory argument. The composite Action creates a directory under `RUNNER_TEMP`, calls the installer in `full` mode only, then appends that directory to `GITHUB_PATH`.

## CI reuse

Replace the duplicated binary-download block in `.github/workflows/ci.yml` with the shared installer script.

The external-integration job must test the real user-facing full Action path, not only direct library calls. It therefore:

1. installs scanners through the shared script,
2. verifies versions,
3. retains the existing adapter/full-scan integration tests,
4. invokes `src/action/run.js --scan-mode full` against the clean fixture and proves requested engines and complete coverage in the emitted report.

The existing `action-contract` job remains dependency-light and exercises default native mode so backward compatibility is continuously checked.

## Action runtime changes

`src/action/run.js` gains:

```text
--scan-mode native|full
RLSPROOF_SCAN_MODE
```

Parsing rejects every other value.

Mapping:

```text
native -> scanProject(target, { nativeOnly: true })
full   -> scanProject(target, {
  nativeOnly: false,
  opengrepConfig: <action-root>/config/opengrep.yml
})
```

The action root is derived from `GITHUB_ACTION_PATH` when running as a composite Action and falls back to the repository root when `src/action/run.js` is executed directly in tests/development.

The normalized report gains no schema-version bump because `scope.requestedEngines`, `coverage.capabilities`, and `releaseGate` already represent the necessary information. An additional top-level Action-specific field is unnecessary.

Action outputs add:

```text
scan-mode
coverage-complete
```

This makes downstream workflows able to enforce or display the mode without parsing JSON.

## Exit semantics

- `blocked` => exit `2` (existing behavior).
- `full` + incomplete requested static coverage => exit `3`.
- all other valid states => exit `0`.
- argument/setup/runtime exceptions => exit `1` through the existing error path.

This preserves a machine-distinguishable capability failure instead of conflating it with vulnerability blocking.

## DB-proof relationship

Static full coverage and DB proof remain orthogonal dimensions.

Examples:

- `scan-mode: full`, `db-proof: off` => complete static engines, no DB proof requested.
- `scan-mode: full`, `db-proof: required` => complete static engines plus required pgTAP DB proof.
- any required DB proof failure => existing blocking behavior.
- any full static engine capability gap => Action fails with incomplete coverage regardless of DB-proof status.

DB proof continues to use `supabase test db`; no production database connection or destructive linked reset is introduced.

## Optional `rlsautotest` interoperability

Documentation may show an optional workflow for teams that want generated tenant-isolation tests:

1. Use `rlsautotest` separately on a disposable/local/dedicated test Supabase/Postgres environment.
2. Review generated SQL.
3. Commit generated tests under `supabase/tests/rls/`.
4. Let RLSProof `db-proof: required` execute them through `supabase test db`.

RLSProof does not install, execute or redistribute `rlsautotest` in this change, so there is no new runtime dependency or bundled-license obligation.

## Website onboarding

Update the install example so the primary recurring security workflow demonstrates:

```yaml
scan-mode: full
db-proof: required
```

Copy must make the distinction explicit:

- full mode runs the pinned external static engines in the GitHub runner,
- DB proof is separate and must run only against disposable/local/dedicated test environments,
- missing requested coverage is not PASS.

Do not claim that enabling `db-proof: required` provisions a Supabase test stack automatically.

## Naming cleanup in touched paths

Any user-visible stale `Guardian` references encountered in files touched by this work must become `RLSProof`. Internal temp prefixes that do not affect product behavior may remain to avoid unrelated churn.

`THIRD_PARTY_NOTICES.md` currently describes the CI integration with the stale `Guardian` name; update it because the same third-party binaries will now also be invoked by the public composite Action.

## Security invariants

- No source upload to a RLSProof backend.
- No new secrets required by the Action.
- No `curl | sh` installation.
- External executables remain exact-version and checksum verified.
- User inputs never control executable download URLs or versions.
- External commands continue to run through `runTool` with `shell: false`, timeouts and output bounds.
- Capability error text remains redacted by the existing scan adapter sanitizer.
- Missing external engines in `full` mode cannot produce Action success.
- DB authorization fixtures must never be pointed at production by RLSProof instructions.

## Performance and dependency constraints

- No new npm runtime dependency.
- No paid service.
- Native default Action path should not download external binaries.
- Full-mode download/setup cost is accepted because it is explicitly requested and provides materially broader coverage.
- Avoid a cache Action in this version; adding another privileged supply-chain component is not justified yet.

## TDD and verification requirements

Required RED-before-GREEN tests:

1. Action manifest exposes `scan-mode` with default `native` and outputs `scan-mode` + `coverage-complete`.
2. Runtime rejects invalid scan mode.
3. Native mode retains native-only requested engines.
4. Full mode passes `nativeOnly:false` and the repository Opengrep config to `scanProject` through a testable runtime seam.
5. Full mode returns exit `3` when requested external coverage is incomplete.
6. Full mode returns `0` for a complete clean full scan.
7. Installer source contract proves fixed versions/digests, fail-closed platform guard and strict checksum verification.
8. CI calls the shared installer rather than maintaining a second checksum list.
9. Website install surface shows both `scan-mode: full` and `db-proof: required` with the production-DB safety warning.
10. Existing DB-proof, static scanner, browser scan, product, localization, action-contract, external-integration and build tests remain green.

Final PR head must pass:

- `npm test`,
- `npm run build`,
- static export verification,
- composite clean/vulnerable action contract,
- checksum-verified external scanner integration.

After exact-head merge, repeat CI and GitHub Pages verification on the exact main merge SHA before claiming completion.

## Acceptance criteria

The work is complete when a repository owner can opt into `scan-mode: full` in the existing RLSProof Action and receive a fail-closed, checksum-verified native + Gitleaks + OSV + Opengrep gate without a new paid dependency, while default `native` behavior, DB-proof semantics, static web deployment and deterministic coverage truth remain intact.