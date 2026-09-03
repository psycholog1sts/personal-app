# Guardian MVP

Guardian is a deterministic, local-first production-readiness scanner for JavaScript/TypeScript and Supabase-oriented source trees. It combines a small native rule set with optional external scanners and emits normalized findings, coverage metadata, a readiness score, and a release gate.

Guardian is not a formal security audit, penetration test, sandbox, or proof that an application is secure.

## What it checks

Native checks currently cover:

- Supabase service-role credential use in application code.
- Dynamic `eval(...)` execution.
- Secret-bearing `.env*` files in the scanned tree without reading their contents into evidence.
- `public` Supabase tables created without a matching `ENABLE ROW LEVEL SECURITY` statement in scanned SQL migrations.

Full mode can additionally run:

- Gitleaks for secret detection.
- OSV-Scanner for known dependency vulnerabilities.
- Opengrep with the repository's local `config/opengrep.yml` rule configuration.

## Requirements

- Node.js 22 (`>=22 <23`).
- For `--full` scans: `gitleaks`, `osv-scanner`, and `opengrep` available on `PATH`.

The CI integration currently validates Gitleaks 8.30.1, OSV-Scanner 2.5.1, and Opengrep 1.29.0. CI downloads exact release assets and verifies their SHA-256 digests before execution.

## Install

```bash
npm install --ignore-scripts --no-audit --no-fund
```

## Usage

Run the CLI directly from the repository:

```bash
node src/cli.js --help
```

Native-only scan:

```bash
node src/cli.js scan . --native-only
```

Full scan with the local Opengrep rules and a saved JSON report:

```bash
node src/cli.js scan . --full --opengrep-config config/opengrep.yml --json --out guardian-report.json
```

Render a previously saved report:

```bash
node src/cli.js report guardian-report.json
```

Verify a project against a previous report:

```bash
node src/cli.js verify guardian-report.json . --full --opengrep-config config/opengrep.yml
```

Add `--json` to `report` or `verify` for machine-readable output.

## Scan modes and coverage

Guardian defaults to native-only behavior unless `--full` is explicitly selected. In full mode, coverage is considered incomplete when a requested external engine is missing, fails, or Opengrep is not configured. Consumers should inspect `coverage.complete` and per-engine capability metadata instead of treating a high readiness score as proof that every engine ran.

OSV-Scanner exit status `1` is treated as a completed scan with vulnerabilities, not as an engine failure. A source tree with no supported package manifests is allowed in full mode so the other engines can still provide complete requested coverage.

## Security properties

- External tools are launched with `shell: false`; scan paths are passed as arguments rather than interpolated into shell commands.
- Tool execution has timeouts and an output-size safety limit.
- Native traversal skips symbolic links and large files over 1 MiB.
- Gitleaks secret and match values are not copied into normalized findings.
- CLI error output and finding evidence pass through redaction controls where applicable.
- CI GitHub Actions are pinned to immutable commit SHAs.
- External CI binaries are version-pinned and SHA-256 verified before execution.
- Opengrep CI uses a repository-local rule configuration rather than dynamically fetching rules.
- CI performs a Guardian source self-scan and requires requested external coverage plus no unresolved high/critical self-findings.

See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for trust boundaries, mitigations, and residual risks.

## Limitations

Guardian is intentionally narrow. It does not execute or sandbox the target application, probe running infrastructure, test authentication/authorization behavior, inspect cloud account configuration, perform dynamic application security testing, or guarantee detection of every secret or vulnerability. Native rules are pattern-based and can produce false positives or false negatives. Dependency coverage depends on what OSV-Scanner can infer from supported manifests and lockfiles. External scanner behavior and vulnerability databases can also change independently of Guardian.

Treat findings as evidence requiring engineering review, and treat a clean result as one signal in a broader secure-development process.

## Testing

```bash
npm test
```

The branch CI additionally installs the pinned external scanners and runs the external integration contract against a clean fixture, a known-vulnerable dependency fixture, and Guardian's own source tree.

## Licensing

This repository's Guardian package is private and marked `UNLICENSED`; no license grant is implied by repository visibility. Third-party scanners remain under their own licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
