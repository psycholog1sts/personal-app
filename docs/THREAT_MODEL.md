# Guardian Threat Model

## Scope

Guardian statically scans a caller-selected source directory and produces normalized security/readiness findings. It may invoke Gitleaks, OSV-Scanner, and Opengrep as local subprocesses when full mode is requested.

Assets Guardian should protect:

- Secrets and credentials present in or near scanned source.
- Source-code confidentiality on the developer workstation or CI runner.
- Integrity of findings, readiness scores, release-gate decisions, and coverage metadata.
- Integrity of reviewed regression baselines used to ratchet mature repositories.
- Integrity of the Guardian process and the CI supply chain used to test it.

## Trust boundaries

1. **Scan target boundary** — file names, paths, file contents, manifests, and SQL in the target are untrusted input.
2. **Subprocess boundary** — external scanner executables and their stdout/stderr are outside Guardian's codebase and can fail, hang, emit malformed data, or change behavior across versions.
3. **Report boundary** — normalized findings may be written to disk or CI logs and therefore must not unnecessarily reproduce secret material.
4. **CI network boundary** — release binaries downloaded from GitHub are network-supplied artifacts and must not be trusted solely because a download succeeded.
5. **Rule/configuration boundary** — changing local detection rules can materially change coverage and release-gate results.
6. **Regression-baseline boundary** — a committed baseline is security-sensitive repository input because modifying it changes which existing static findings are accepted by the ratcheting gate.

## Threats and mitigations

### Command injection through hostile paths or arguments

**Threat:** A target path containing shell metacharacters could execute unintended commands if interpolated into a shell command.

**Mitigation:** External tools are launched with Node's `spawn` using `shell: false`, and arguments are passed as an array. Regression tests exercise hostile-looking arguments and verify they are not shell-expanded.

### Secret leakage in findings or logs

**Threat:** A scanner can identify a real credential and Guardian could accidentally echo the raw secret into JSON, terminal output, or CI logs.

**Mitigation:** Gitleaks `Secret` and `Match` values are intentionally excluded from normalized findings. Native service-role findings report only that credential usage was detected. CLI error output and evidence pass through redaction controls where applicable. Tests use fake secret material and assert that it is absent from output.

### Symlink traversal and unexpected filesystem reach

**Threat:** A crafted source tree could use symbolic links to make the native scanner read outside the intended tree, or a baseline symlink could redirect the gate to an unintended report.

**Mitigation:** Native directory traversal skips symbolic links. Report loading uses `lstat`, rejects symbolic links and requires a normal file before parsing a baseline.

### Resource exhaustion

**Threat:** Very large files, excessive subprocess output, or a hung external scanner could consume excessive memory or runner time.

**Mitigation:** Native file reads are limited to files of at most 1 MiB. External subprocesses have execution timeouts and a bounded combined stdout/stderr capture. Processes exceeding the output limit or timeout are terminated and reported as incomplete capability coverage.

### Malformed or misleading external-scanner output

**Threat:** A scanner can return invalid JSON or use non-zero exit codes for domain outcomes rather than execution failures.

**Mitigation:** Each adapter owns scanner-specific parsing and capability semantics. Invalid structured output is treated as an engine failure. OSV-Scanner exit status `1` is explicitly modeled as a completed scan with vulnerabilities, while other unexpected non-zero statuses remain failures. OSV's official `--allow-no-lockfiles` behavior is used so a source tree without package manifests does not incorrectly disable the other full-scan coverage.

### External tool absence or partial coverage

**Threat:** A report could appear healthy even though one or more requested scanners never ran.

**Mitigation:** Reports expose per-engine capability records and a `coverage.complete` flag. Full-mode CI asserts that Gitleaks, OSV-Scanner, and Opengrep are installed and complete successfully. A readiness score must not be interpreted independently of coverage state.

### Baseline tampering or incomparable evidence

**Threat:** A developer could edit a baseline to hide new findings, claim complete coverage that did not execute, compare a native-only baseline against a full scan, introduce ambiguous duplicate finding IDs, or configure the current report to overwrite the accepted baseline.

**Mitigation:** Baseline mode validates schema version, stable unique finding IDs and severities, requires complete baseline coverage backed by successful capability records, and requires the same static engine scope as the current scan. New IDs and severity increases remain regressions. The baseline and output paths must differ. DB proof and current coverage are evaluated independently and are never suppressed by the baseline. Baseline files should be protected by ordinary code review and branch protection because RLSProof does not currently cryptographically attest repository-owned baseline files.

### Supply-chain compromise or version drift

**Threat:** Mutable GitHub Actions references or silently changed scanner binaries could alter CI behavior or execute unreviewed code.

**Mitigation:** GitHub Actions are pinned to immutable commit SHAs. CI downloads exact scanner versions and verifies hard-coded SHA-256 digests before installation. Scanner versions are printed before the integration contract runs. Opengrep uses the repository-local `config/opengrep.yml` instead of dynamically downloading a rule pack.

### Scanner self-detection and false release blocks

**Threat:** Guardian's own detection regexes or example strings can be mistaken for vulnerable code, causing a false high/critical release block.

**Mitigation:** Native self-scan regression tests cover service-role and dangerous-eval self-detection. Full external integration scans Guardian's own source and requires complete requested coverage with no unresolved high/critical findings.

### False negatives

**Threat:** Pattern-based rules and third-party engines can miss vulnerabilities, secrets, semantic authorization errors, or runtime-only behavior.

**Mitigation:** Findings are presented as evidence, not as a security guarantee. The README explicitly documents scope and limitations. Guardian combines multiple engines but does not claim completeness.

## Residual risks and non-goals

- Guardian does not sandbox the target application or the external scanner binaries.
- Guardian does not execute application code as part of analysis, but external scanners are executable dependencies and inherit the privileges of the Guardian/CI process.
- Native rules are intentionally small and pattern-based; obfuscation, generated code, unsupported languages, or unusual syntax can evade them or create false positives.
- Native scanning currently focuses on selected JavaScript/TypeScript-family extensions and SQL; it is not a universal file-content scanner.
- OSV coverage depends on supported manifests/lockfiles and the vulnerability data available to OSV-Scanner.
- Guardian does not test live Supabase policies, cloud IAM, network exposure, deployed environment variables, authentication flows, SSRF, XSS, SQL injection through runtime data paths, or other dynamic behavior unless a configured static rule happens to detect a source pattern.
- A correct `coverage.complete` value means the requested engines completed according to their adapter contracts; it does not mean every security-relevant class was tested.
- SHA-256 verification protects against accidental/malicious artifact substitution only relative to the pinned digest already committed to this repository. Compromise of the upstream release process before digest review remains a supply-chain risk.
- A committed regression baseline is not signed or externally attested. Repository permissions, review policy, and branch protection therefore remain part of the trust model for any team using baseline mode.
- Accepted baseline findings remain real security debt. Baseline mode is an adoption ratchet, not evidence that those findings are safe.

## Security gate used by CI

The external integration job verifies exact pinned scanner versions, validates a clean fixture, validates OSV vulnerability-exit semantics with a known vulnerable dependency fixture, and scans Guardian's own source. The self-scan must have complete external coverage and no unresolved high/critical findings before the job passes.