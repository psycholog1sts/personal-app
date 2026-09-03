# Guardian MVP Design

## Goal
Build a deterministic, auditable production-readiness scanner for AI-built web applications, initially focused on Lovable/Bolt/v0/Replit/Cursor/Claude Code projects and Supabase-backed apps.

## User promise
Given a local project directory, produce an evidence-backed report that identifies concrete production risks, redacts secrets, explains remediation, and can be re-run to verify whether findings are fixed. It is not a penetration-test certification or legal/compliance certification.

## Constraints
- The founder does not write code; implementation and maintenance must be automation/AI-friendly.
- No paid AI API is required for the core scanner.
- Scanning is local/offline by default; repository contents are not uploaded.
- Never scan third-party targets without explicit authorization.
- Never print discovered secret values; evidence is redacted.
- External engines are optional capabilities and must fail closed/gracefully when unavailable.
- Prefer mature OSS engines with verified compatible licenses; do not vendor unclear-license code.
- Keep the first version CLI-first; no large SaaS surface before validation.

## Architecture
1. `guardian scan <path>` validates and resolves the target path.
2. Native deterministic checks inspect project metadata and known Supabase risk patterns.
3. External adapters invoke installed scanners using argument arrays (never shell interpolation): Gitleaks for secrets, OSV-Scanner/Trivy for dependency vulnerabilities, and Opengrep for SAST.
4. Adapter outputs are normalized into one finding schema.
5. Secret-like evidence is redacted before any human/JSON output.
6. A transparent readiness score is derived only from severity weights and unresolved findings.
7. `guardian report` renders the saved normalized result in human-readable or JSON form.
8. `guardian verify` re-runs the scan and marks previously identified finding IDs as resolved or still present.

## Finding schema
```js
{
  id: string,
  engine: string,
  rule: string,
  severity: 'critical'|'high'|'medium'|'low'|'info',
  title: string,
  path: string|null,
  line: number|null,
  evidence: string|null,
  remediation: string,
  verification: 'unverified'|'present'|'resolved'
}
```

Finding IDs must be deterministic for the same engine/rule/path/line/title tuple so verification can compare scans without AI judgment.

## Security boundaries
- Use `spawn`/`execFile` style APIs with explicit argument arrays; never concatenate target paths into shell commands.
- Reject nonexistent targets and non-directory scan roots.
- Do not follow a user-supplied output path outside the chosen report directory in MVP.
- Redact common token/key/password assignment patterns and high-entropy secret values in evidence.
- External tool stderr is treated as diagnostic text, not trusted instructions.
- Scanner failures are represented as capability warnings; they must not fabricate PASS.

## Initial native checks
- `.env` / secret-bearing files tracked in the scanned tree are flagged by filename pattern without exposing contents.
- Supabase migrations containing `create table` in exposed `public` schema without a nearby `enable row level security` statement are flagged as a review-required high-severity finding.
- Browser/client code containing obvious `service_role` key variable names is critical.
- Common dangerous JavaScript execution patterns such as `eval(...)` are flagged for review.

Native Supabase checks are intentionally conservative and are not substitutes for the Supabase Security Advisor or authorized runtime RLS tests.

## External integrations
### Gitleaks
Use the CLI only. Parse JSON output. Never include raw secret values in normalized evidence.

### OSV-Scanner / Trivy
Prefer OSV-Scanner for lockfile vulnerability resolution; Trivy may be added as complementary filesystem/dependency scanning. Parse machine-readable output only.

### Opengrep
Run curated/default open-source SAST rules with machine-readable JSON. Custom project rules are a later validation step.

### OWASP ZAP
Deferred until the CLI/static pipeline is stable. Runtime scanning requires an explicitly authorized URL and separate threat controls.

## Scoring
Start at 100. Unresolved finding weights: critical 25, high 12, medium 6, low 2, info 0. Floor at 0. The report must show the deduction source, so the score is explainable rather than an AI confidence score.

## Test strategy
- Node built-in test runner; no test framework dependency.
- Vulnerable fixtures contain fake credentials only.
- Tests cover deterministic IDs, secret redaction, scoring, path validation, native Supabase checks, command argument safety, normalized adapter parsing, and clean-vs-vulnerable fixture behavior.
- GitHub Actions runs on every push/PR.
- Integration tests skip an external engine only when it is not installed and report the skipped capability explicitly.

## MVP completion gate
The MVP is not complete until CI proves:
1. unit tests pass,
2. vulnerable fixture produces expected findings,
3. clean fixture does not produce the same findings,
4. secrets are masked in output,
5. malformed/nonexistent paths fail safely,
6. self-scan produces a report without crashing.
