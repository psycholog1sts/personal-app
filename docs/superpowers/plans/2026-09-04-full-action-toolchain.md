# Full GitHub Action Toolchain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose an opt-in checksum-verified full static scan in the existing RLSProof GitHub Action while preserving the native-only default and current DB-proof semantics.

**Architecture:** Add a `scan-mode` Action/runtime contract, extract the existing scanner download logic into one fail-closed installer, and route full mode through the already-existing `scanProject(..., { nativeOnly:false })` path with the repository Opengrep config. Full mode fails operationally on incomplete requested static coverage, while the report keeps the truthful `incomplete` semantic state.

**Tech Stack:** Node.js 22, GitHub composite Actions, Bash, Gitleaks 8.30.1, OSV-Scanner 2.5.1, Opengrep 1.29.0, Next.js 16 static export.

**Spec:** `docs/superpowers/specs/2026-09-04-full-action-toolchain-design.md`

## Global Constraints

- `scan-mode` default is `native`; existing users must not download external tools unless they opt into `full`.
- Full mode means native + Gitleaks 8.30.1 + OSV-Scanner 2.5.1 + Opengrep 1.29.0.
- External release assets remain fixed-version and SHA-256 verified.
- No paid service or new npm runtime dependency.
- Missing/failed requested full-mode engines remain `incomplete`, never PASS.
- Full-mode incomplete coverage must make the Action process fail with exit code `3`.
- Vulnerability blocking keeps exit code `2`; general runtime/config errors keep exit code `1`.
- DB proof remains independent and must not add production-database instructions.
- GitHub Pages static export and browser Quick Scan behavior must remain unchanged.

---

### Task 1: Lock the Action mode contract with failing tests

**Files:**
- Modify: `test/action.test.js`
- Modify: `test/action-db-proof.test.js` if the manifest contract is currently split there
- Create: `test/external-installer.test.js`

**Interfaces:**
- Consumes: existing `action.yml`, `src/action/run.js`, existing Node test harness.
- Produces: executable tests defining `scan-mode`, full-mode exit semantics and installer safety contract.

- [ ] **Step 1: Add manifest assertions before production code**

Add assertions that `action.yml` contains an input named `scan-mode`, defaults to `native`, exports `RLSPROOF_SCAN_MODE`, and exposes `scan-mode` plus `coverage-complete` outputs.

- [ ] **Step 2: Add runtime RED tests**

Add child-process tests that:

```js
const invalid = await runNode(['src/action/run.js', '--scan-mode', 'everything']);
assert.equal(invalid.code, 1);
assert.match(invalid.stderr, /scan-mode.*native.*full/i);
```

Add a native-mode report assertion:

```js
assert.deepEqual(reportJson.scope.requestedEngines, ['native']);
```

Add a full-mode capability-gap assertion by running full mode without the external binaries and expecting exit `3`, `releaseGate === 'incomplete'`, and all requested engine names in `scope.requestedEngines`.

- [ ] **Step 3: Add installer source-contract RED test**

Create `test/external-installer.test.js` asserting `scripts/install-external-scanners.sh` exists and includes all exact versions, committed digests, `set -euo pipefail`, `sha256sum --check --strict`, an OS/architecture guard, and no `curl ... | ...sh`/`eval` pattern.

- [ ] **Step 4: Run PR CI and record expected RED**

Expected failure: new tests fail because the Action input/runtime/installer do not exist yet. Existing action-contract/external code should otherwise remain unaffected.

---

### Task 2: Add the shared checksum-verified installer

**Files:**
- Create: `scripts/install-external-scanners.sh`
- Modify: `.github/workflows/ci.yml`
- Test: `test/external-installer.test.js`

**Interfaces:**
- Consumes: installation directory as `$1`.
- Produces: executable `gitleaks`, `osv-scanner`, and `opengrep` files in that directory or exits non-zero before a reduced-coverage run can begin.

- [ ] **Step 1: Implement fixed-platform validation**

The script must normalize `uname -s`/`uname -m` and accept only Linux + `x86_64|amd64`; otherwise print a clear unsupported-runner error and exit non-zero.

- [ ] **Step 2: Implement exact verified downloads**

Use the existing URLs/digests from `.github/workflows/ci.yml` exactly:

```text
Gitleaks 8.30.1
551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb

OSV-Scanner 2.5.1
f9f25499a2c8cc367b3af45df2ea7eeca7fbccceab9c35079968f4b3652194be

Opengrep 1.29.0
3365ef49d04893e01338d85d9bbd49b2bd5261ad4c9c0df0a6a0f8d44232ae13
```

Install with mode `0755`, verify the three executable versions, and clean temporary state in a trap.

- [ ] **Step 3: Replace CI's duplicated installer block**

Change the external-integration job to:

```bash
bin="$RUNNER_TEMP/rlsproof-bin"
./scripts/install-external-scanners.sh "$bin"
echo "$bin" >> "$GITHUB_PATH"
```

Keep the existing explicit version verification step as an independent CI assertion.

- [ ] **Step 4: Run tests and external integration**

Installer source-contract tests must turn green; external integration must still install exactly the same scanner versions.

---

### Task 3: Implement `scan-mode` in the Action runtime

**Files:**
- Modify: `src/action/run.js`
- Modify: `action.yml`
- Modify: `test/action.test.js`

**Interfaces:**
- Consumes: `--scan-mode native|full` / `RLSPROOF_SCAN_MODE`, existing `scanProject()` and `evaluateDbProof()`.
- Produces: report, `scan-mode` and `coverage-complete` outputs, exit codes `0|1|2|3`.

- [ ] **Step 1: Parse and validate scan mode**

Extend defaults with:

```js
scanMode: process.env.RLSPROOF_SCAN_MODE || 'native'
```

Accept `--scan-mode`; reject every value except `native` and `full`.

- [ ] **Step 2: Resolve the repository Opengrep config safely**

Use `GITHUB_ACTION_PATH` when present. For direct execution, derive the repo root from `import.meta.url`. Build the fixed path `config/opengrep.yml`; do not accept an Action input for arbitrary config in this iteration.

- [ ] **Step 3: Route static scanning by mode**

Use:

```js
const staticReport = await scanProject(target, scanMode === 'full'
  ? { nativeOnly: false, opengrepConfig }
  : { nativeOnly: true });
```

Do not alter `scanProject` release semantics.

- [ ] **Step 4: Add outputs and exit enforcement**

Write:

```text
scan-mode=<native|full>
coverage-complete=<true|false>
```

Return `2` when releaseGate is `blocked`; return `3` when `scanMode === 'full' && staticReport.coverage.complete !== true`; otherwise `0`.

- [ ] **Step 5: Update Action manifest**

Add `scan-mode` input default `native`, add outputs, pass `RLSPROOF_SCAN_MODE`, and add a conditional full-mode install step that calls the shared installer and writes its bin dir to `GITHUB_PATH`.

- [ ] **Step 6: Verify RED→GREEN runtime contract**

Run all Action tests; invalid mode, native default and full incomplete behavior must pass.

---

### Task 4: Prove the real full Action path with external scanners

**Files:**
- Modify: `test/external-integration.test.js`
- Modify: `.github/workflows/ci.yml` only if needed for the test environment

**Interfaces:**
- Consumes: installed pinned scanners and `src/action/run.js --scan-mode full`.
- Produces: integration evidence that the user-facing runtime emits full requested engines, complete coverage and a clean gate.

- [ ] **Step 1: Add full runtime integration test**

Spawn:

```text
node src/action/run.js --target test/fixtures/clean --report <temp-report> --scan-mode full
```

with the scanner bin directory on `PATH`.

Assert:

```js
assert.equal(result.code, 0);
assert.deepEqual(report.scope.requestedEngines, ['native', 'gitleaks', 'osv-scanner', 'opengrep']);
assert.equal(report.coverage.complete, true);
assert.equal(report.releaseGate, 'clear');
```

- [ ] **Step 2: Preserve existing adapter/self-scan assertions**

Do not remove the direct full scan, OSV vulnerable-lockfile, or source self-scan tests. The new test supplements rather than weakens them.

- [ ] **Step 3: Run the external-integration job**

All external scanners must install, version-check and execute successfully through both direct and Action runtime paths.

---

### Task 5: Align onboarding, notices and optional RLS test generation

**Files:**
- Modify: `app/components/InstallPanel.js`
- Modify: `i18n/dictionaries/en.js`
- Modify: `README.md`
- Modify: `THIRD_PARTY_NOTICES.md`
- Modify: `test/product-v2-surface.test.js` or `test/i18n.test.js` for the new public copy contract

**Interfaces:**
- Consumes: published English dictionary and the new Action inputs.
- Produces: truthful install guidance for full static coverage + separate DB proof.

- [ ] **Step 1: Update the website Action example**

The sample must contain both:

```yaml
scan-mode: full
db-proof: required
```

Explain that full static engines execute in the GitHub runner and DB proof remains a separate local/disposable/test database proof.

- [ ] **Step 2: Strengthen the coverage copy**

Add public copy stating that requested full coverage fails closed if an external engine cannot execute. Preserve the production-DB safety warning.

- [ ] **Step 3: Update README**

Document native/default versus full mode, fixed tool versions, full-mode Linux x64 support, exit code `3` for incomplete full coverage, and a minimal immutable-SHA Action example.

Add an optional interoperability section explaining that `rlsautotest`-generated pgTAP files under `supabase/tests/rls/` can be reviewed/committed and then executed by `db-proof: required`; explicitly state that generation/probing belongs on disposable/local/dedicated test databases and that RLSProof does not install `rlsautotest` automatically.

- [ ] **Step 4: Correct third-party notices**

Replace stale `Guardian` naming with RLSProof and state that the verified binaries may be invoked by CI/full Action mode without being vendored.

- [ ] **Step 5: Run localization/product tests**

English dictionary validation, static surface contracts and production build must remain green.

---

### Task 6: Final security/release verification

**Files:**
- No production file changes expected unless verification identifies a concrete defect.

**Interfaces:**
- Consumes: exact PR head.
- Produces: merge decision based on fresh evidence only.

- [ ] **Step 1: Review the diff for security regressions**

Confirm no secret, token, production DB URL, unpinned scanner URL/version, `eval`, `curl|sh`, user-controlled download target, or new npm dependency was introduced.

- [ ] **Step 2: Verify exact PR head CI**

Require success for:

```text
test
  Install
  Test
  Production build
  Verify static export

action-contract
  clean fixture
  vulnerable fixture

external-integration
  shared scanner installer
  pinned version verification
  external scanner integration contract
```

- [ ] **Step 3: Merge with expected-head SHA**

Use squash merge only after exact-head CI success so a moved PR head cannot be merged accidentally.

- [ ] **Step 4: Verify exact main merge SHA**

Require main CI success and GitHub Pages build/deploy success on the merge SHA.

- [ ] **Step 5: Report only verified outcomes**

Do not claim final brand/domain, payment activation, paid conversion, policy drift detection, live-app probing or hosted recurring history as complete; they remain separate product milestones.