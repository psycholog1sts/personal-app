# Guardian MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic CLI-first production-readiness scanner for AI-built web apps with normalized evidence, secret redaction, explainable scoring, safe external-tool adapters, and verification re-scans.

**Architecture:** A Node.js CLI orchestrates native checks plus optional external scanners and normalizes every result into one schema. Reports are deterministic and redact sensitive evidence before output; verification compares stable finding IDs across scans. GitHub Actions is the authoritative test runner for this branch.

**Tech Stack:** Node.js 22, built-in `node:test`, built-in `child_process.spawn`, JSON reports, GitHub Actions. External optional engines: Gitleaks CLI, Google OSV-Scanner, Opengrep; Trivy is deferred until the first three adapters are stable.

**Spec:** `docs/superpowers/specs/2026-09-03-guardian-mvp-design.md`

## Global Constraints
- No paid AI API is required for the core scanner.
- Never print discovered secret values.
- Never use shell interpolation for external engine invocation.
- Never scan third-party network targets in this MVP.
- `main` is untouched until the branch is fully verified.
- Missing external engines produce explicit capability warnings, never a fabricated PASS.
- Finding IDs are deterministic from normalized finding identity fields.

---

### Task 1: Core finding model, redaction, and score

**Files:**
- Create: `package.json`
- Create: `src/core/finding.js`
- Create: `src/core/redact.js`
- Create: `src/core/score.js`
- Test: `test/core.test.js`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `makeFinding(input) -> Finding`
- Produces: `redactEvidence(value) -> string|null`
- Produces: `scoreFindings(findings) -> { score, deductions }`

- [ ] Write failing tests for deterministic IDs, secret redaction, and transparent severity deductions.
- [ ] Push tests + CI and confirm GitHub Actions fails because the production modules do not exist.
- [ ] Implement the smallest production modules that satisfy the tests.
- [ ] Re-run CI and require all Task 1 tests to pass.

### Task 2: Safe target validation and native scanner

**Files:**
- Create: `src/core/target.js`
- Create: `src/native/scan.js`
- Test: `test/native-scan.test.js`
- Create: `test/fixtures/vulnerable/.env`
- Create: `test/fixtures/vulnerable/app.js`
- Create: `test/fixtures/vulnerable/supabase/migrations/001_bad.sql`
- Create: `test/fixtures/clean/app.js`
- Create: `test/fixtures/clean/supabase/migrations/001_good.sql`

**Interfaces:**
- Produces: `resolveScanTarget(path) -> absoluteDirectoryPath`
- Produces: `runNativeScan(root) -> Finding[]`

- [ ] Write failing tests that reject nonexistent/non-directory targets.
- [ ] Write failing fixture tests for tracked-env filename, `service_role` usage, `eval`, and public-table-without-RLS migration patterns.
- [ ] Implement target validation and conservative native checks.
- [ ] Require vulnerable fixture findings and clean fixture non-findings to pass in CI.

### Task 3: External command capability and adapter contract

**Files:**
- Create: `src/adapters/process.js`
- Create: `src/adapters/gitleaks.js`
- Create: `src/adapters/osv.js`
- Create: `src/adapters/opengrep.js`
- Test: `test/adapters.test.js`

**Interfaces:**
- Produces: `runTool(command, args, options) -> { ok, code, stdout, stderr, missing }`
- Produces: `scanWithGitleaks(root) -> { findings, capability }`
- Produces: `scanWithOsv(root) -> { findings, capability }`
- Produces: `scanWithOpengrep(root) -> { findings, capability }`

- [ ] Write failing tests proving command arguments are passed as arrays and malicious path strings are never evaluated by a shell.
- [ ] Write parser tests using stored fixture JSON only; no live network dependency.
- [ ] Implement capability detection and parsers.
- [ ] CI must pass whether optional binaries are present or absent.

### Task 4: Orchestrator, report persistence, and CLI

**Files:**
- Create: `src/scan.js`
- Create: `src/report.js`
- Create: `src/verify.js`
- Create: `src/cli.js`
- Test: `test/cli.test.js`

**Interfaces:**
- Produces: `scanProject(root, options) -> ScanReport`
- Produces: `writeReport(report, outputPath) -> outputPath`
- Produces: `verifyReport(previousReport, currentReport) -> VerificationReport`
- CLI: `guardian scan <path> [--json] [--out <file>]`
- CLI: `guardian report <file> [--json]`
- CLI: `guardian verify <report-file> <path> [--json]`

- [ ] Write failing end-to-end CLI tests against fixtures.
- [ ] Implement minimal orchestration and JSON/human output.
- [ ] Ensure secret values never appear in stdout or saved report.
- [ ] CI must prove scan/report/verify flows.

### Task 5: Documentation and self-scan gate

**Files:**
- Modify: `README.md`
- Create: `SECURITY.md`
- Create: `THREAT_MODEL.md`
- Create: `THIRD_PARTY_LICENSES.md`
- Create: `LICENSE`
- Modify: `.github/workflows/ci.yml`

- [ ] Document exact capabilities, limitations, and non-certification language.
- [ ] Record verified external engine names/licenses without vendoring their source.
- [ ] Add CI self-scan step that runs Guardian against its own repository after tests.
- [ ] Fail completion if the CLI crashes or leaks fixture secrets.

### Task 6: Pull request and verification evidence

**Files:** none unless fixes are required.

- [ ] Fetch branch HEAD and all workflow runs.
- [ ] If CI fails, use systematic-debugging before changing code.
- [ ] Re-run until the latest HEAD is green.
- [ ] Open a PR from `guardian-mvp-20260903` to `main` only after tests are green.
- [ ] Do not merge without a separate final review decision.
