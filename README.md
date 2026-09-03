# Guardian

Guardian is a deterministic, local-first production-readiness scanner for JavaScript/TypeScript and Supabase-oriented applications, plus a bounded public-GitHub Quick Scan web surface for inbound validation.

Guardian is **not** a formal security audit, penetration test, compliance certification, sandbox, or proof that an application is secure.

## Product surfaces

### Free web Quick Scan

The Next.js web app accepts a public GitHub repository (`owner/repo` or a canonical GitHub URL), downloads only a bounded allow-list of eligible source files into a temporary directory, runs Guardian's native checks, returns normalized findings, and deletes the temporary directory after the request.

Quick Scan is intentionally partial:

- Public GitHub repositories only.
- Bounded repository/tree/file/byte budgets.
- Native Guardian checks only.
- `coverage.complete` is always `false` for Quick Scan.
- A clean Quick Scan is **not** a release approval.

Run locally:

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Health endpoint:

```text
GET /api/health
```

### CLI / full audit engine

Native checks currently cover:

- Supabase service-role credential use in application code.
- Dynamic `eval(...)` execution.
- Secret-bearing `.env*` files without reproducing secret contents in evidence.
- `public` Supabase tables created without a matching `ENABLE ROW LEVEL SECURITY` statement in scanned SQL migrations.

Full mode can additionally run:

- Gitleaks for secret detection.
- OSV-Scanner for known dependency vulnerabilities.
- Opengrep with the repository-local `config/opengrep.yml` configuration.

The CI integration validates Gitleaks 8.30.1, OSV-Scanner 2.5.1, and Opengrep 1.29.0. Exact release assets are downloaded and SHA-256 verified before execution.

CLI examples:

```bash
node src/cli.js --help
node src/cli.js scan . --native-only
node src/cli.js scan . --full --opengrep-config config/opengrep.yml --json --out guardian-report.json
node src/cli.js report guardian-report.json
node src/cli.js verify guardian-report.json . --full --opengrep-config config/opengrep.yml
```

## Environment

Copy `.env.example` to an environment-specific secret store; do not commit populated secrets.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | Optional | Increases GitHub API quota for public Quick Scan. Use least privilege. |
| `AUDIT_CHECKOUT_URL` | Optional until payments are enabled | Stripe-hosted Payment Link for the $149 Launch Audit CTA. |
| `NEXT_PUBLIC_SITE_URL` | Recommended in production | Canonical site URL used for metadata, robots and sitemap. |

The application must still work without `GITHUB_TOKEN`; anonymous GitHub API quotas are simply lower. The Launch Audit button remains visibly disabled if `AUDIT_CHECKOUT_URL` is absent rather than presenting a fake checkout.

## Security properties

- Remote Quick Scan accepts only canonical GitHub repository identifiers/URLs and rejects foreign hosts and nested GitHub paths.
- Only explicitly eligible file types are selected; build output, dependencies, symlinks and unsafe paths are rejected.
- Repository size, tree entry count, file count, per-file bytes and total scanned bytes are bounded.
- Remote source is materialized only in an OS temporary directory and removed in `finally`.
- API request bodies are size-limited and responses are `no-store`.
- API rate limiting is best-effort/in-memory for the validation MVP; it is not a durable distributed abuse-control system.
- External tools run with `shell: false`, bounded output and timeouts.
- Gitleaks secret/match values are not copied into normalized findings.
- Native traversal skips symbolic links and files over 1 MiB.
- GitHub Actions are pinned to immutable commit SHAs.
- CI scanner binaries are version-pinned and SHA-256 verified.
- CI runs unit/integration tests, production `next build`, and the external scanner integration contract.

See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) for trust boundaries, mitigations and residual risks.

## Scan modes and release gate

Guardian separates **score** from **coverage**. Consumers must inspect `coverage.complete` and per-engine capability metadata instead of treating a high score as proof every engine ran.

OSV-Scanner exit status `1` is treated as a completed scan with vulnerabilities, not an engine failure. A tree with no supported package manifests can still allow the other engines to complete their requested coverage.

## Testing

```bash
npm test
npm run build
```

CI additionally installs checksum-verified external scanners and runs their integration contract against clean, intentionally vulnerable, and Guardian self-scan fixtures.

## Deployment

The web app is a standard Next.js 16 Node-runtime application. For a production deployment:

1. Deploy the repository from `main`.
2. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS URL.
3. Optionally set a least-privilege `GITHUB_TOKEN` for higher public API quota.
4. Set `AUDIT_CHECKOUT_URL` after the live Stripe Payment Link is created.
5. Verify `/`, `/privacy`, `/terms`, `/api/health`, and a real public-repository Quick Scan.

No database is required for the free validation MVP, and Quick Scan intentionally does not persist repository source or reports server-side.

## Limitations

Guardian does not execute or sandbox the target application, probe third-party infrastructure, test live authentication/authorization behavior, inspect cloud account configuration, perform DAST, or guarantee detection of every secret or vulnerability. Native rules are pattern-based and can produce false positives or false negatives. External scanner databases and behavior can change independently of Guardian.

Treat findings as engineering evidence requiring review and a clean result as one signal in a broader secure-development process.

## Licensing

Guardian's npm package is private and marked `UNLICENSED`; repository visibility does not grant a license. Third-party scanners retain their own licenses. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
