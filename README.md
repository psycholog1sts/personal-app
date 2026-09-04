# RLSProof

RLSProof is a deterministic, local-first Supabase-focused production-readiness scanner for JavaScript/TypeScript applications, plus a bounded browser-only public-GitHub Quick Scan for inbound validation.

RLSProof is **not** a formal security audit, penetration test, compliance certification, sandbox, or proof that an application is secure.

## Product surfaces

### Free web Quick Scan

The static Next.js web app accepts a public GitHub repository (`owner/repo` or a canonical GitHub URL). The user's browser requests a bounded allow-list of eligible public source files directly from the GitHub API, scans the selected content in browser memory with RLSProof's deterministic native checks, and renders normalized findings locally. RLSProof does not run an application server for the free Quick Scan and does not intentionally receive or persist repository source.

Quick Scan is intentionally partial:

- Public GitHub repositories only.
- Bounded repository/tree/file/byte budgets.
- Native RLSProof checks only.
- `coverage.complete` is always `false` for Quick Scan.
- A clean Quick Scan is **not** a release approval or security certification.

Run locally:

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run dev
```

Build the static site:

```bash
npm run build
```

The production export is written to `out/`.

### CLI / full audit engine

Native checks currently cover:

- Supabase service-role credential use in application code.
- Dynamic `eval(...)` execution.
- Secret-bearing `.env*` files without reproducing secret contents in evidence.
- `public` Supabase tables created without a matching `ENABLE ROW LEVEL SECURITY` statement in scanned SQL migrations.
- Selected Supabase policy/function/view patterns that can weaken authorization or RLS behavior.

Full mode can additionally run:

- Gitleaks for secret detection.
- OSV-Scanner for known dependency vulnerabilities.
- Opengrep with the repository-local `config/opengrep.yml` configuration.

The CI integration validates Gitleaks 8.30.1, OSV-Scanner 2.5.1, and Opengrep 1.29.0. Exact release assets are downloaded and SHA-256 verified before execution.

CLI examples:

```bash
node src/cli.js --help
node src/cli.js scan . --native-only
node src/cli.js scan . --full --opengrep-config config/opengrep.yml --json --out rlsproof-report.json
node src/cli.js report rlsproof-report.json
node src/cli.js verify rlsproof-report.json . --full --opengrep-config config/opengrep.yml
```

## Build-time environment

The public web build does not require a GitHub token or Stripe secret key.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUDIT_CHECKOUT_URL` | Optional until payments are enabled | Public Stripe-hosted Payment Link for the $149 Launch Audit CTA. |
| `NEXT_PUBLIC_SITE_URL` | Recommended in production | Canonical site URL used for metadata, robots and sitemap. |

If `AUDIT_CHECKOUT_URL` is absent, the Launch Audit button remains visibly disabled rather than presenting a fake checkout.

## Security properties

- Browser Quick Scan accepts only canonical GitHub repository identifiers/URLs and rejects foreign hosts and nested GitHub paths.
- Only explicitly eligible file types are selected; unsafe or irrelevant paths are excluded.
- Repository size, tree entry count, file count, per-file bytes and total scanned bytes are bounded.
- Public source contents remain in browser memory for the free scan and are not sent to an RLSProof application server.
- No GitHub token or Stripe secret is embedded in the client bundle.
- Findings intentionally omit raw secret values/source payload fields.
- External CLI tools run with `shell: false`, bounded output and timeouts.
- Native filesystem traversal skips symbolic links and oversized files.
- GitHub Actions are pinned to immutable commit SHAs.
- CI scanner binaries are version-pinned and SHA-256 verified.
- CI runs unit/integration tests, the production static build, and the external scanner integration contract.

See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) for trust boundaries, mitigations and residual risks.

## Scan modes and release gate

RLSProof separates **score** from **coverage**. Consumers must inspect `coverage.complete` and per-engine capability metadata instead of treating a high score as proof every engine ran.

OSV-Scanner exit status `1` is treated as a completed scan with vulnerabilities, not an engine failure. A tree with no supported package manifests can still allow the other engines to complete their requested coverage.

## Testing

```bash
npm test
npm run build
```

CI additionally installs checksum-verified external scanners and runs their integration contract against clean, intentionally vulnerable, and self-scan fixtures.

## Deployment

The web app is a static Next.js export deployed with GitHub Pages Actions.

1. Merge release changes to `main`.
2. The Pages workflow tests and builds `out/` with the repository base path.
3. `NEXT_PUBLIC_SITE_URL` is set to the GitHub Pages canonical URL during the Pages build.
4. When a live Stripe Payment Link exists, expose only that public URL through `AUDIT_CHECKOUT_URL`; never add Stripe secret keys to the static build.
5. Verify `/`, `/privacy/`, `/terms/`, static assets, and a real public-repository Quick Scan after deployment.

No database or application server is required for the free validation MVP.

## Limitations

RLSProof does not execute or sandbox the target application, probe third-party infrastructure, test live authentication/authorization behavior, inspect cloud account configuration, perform DAST, or guarantee detection of every secret or vulnerability. Native rules are pattern-based and can produce false positives or false negatives. External scanner databases and behavior can change independently of RLSProof.

Treat findings as engineering evidence requiring review and a clean result as one signal in a broader secure-development process.

## Licensing

RLSProof's npm package is private and marked `UNLICENSED`; repository visibility does not grant a license. Third-party scanners retain their own licenses. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
