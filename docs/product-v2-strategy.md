# Product V2 Strategy — Brand TBD

Status: product direction for the next build. **RLSProof is a temporary codename only.** The final product name, domain, and public URL require explicit owner approval before they are treated as final.

## Problem

AI-built apps ship quickly, but authorization, tenant isolation, secrets, and deployment security regress as code changes. A one-time public-repo scanner is easy to copy and does not create strong retention.

## Product thesis

Build a **continuous release gate for AI-built Supabase applications** rather than another generic scanner.

Core promise:

> Before every release, prove that one tenant cannot access another tenant's data, catch dangerous Supabase/security regressions, show the exact evidence, generate a fix, and re-run the proof before the change ships.

## Target user

Primary:
- Solo founders and small teams building SaaS with Lovable, Bolt, Cursor, Claude Code, Replit, v0, Next.js and Supabase.
- Users who can ship code but are not security specialists.

Secondary:
- Agencies shipping multiple AI-built client apps.
- Engineering teams that need lightweight Supabase-specific release evidence.

## Why users return

The product must attach to recurring events rather than rely on manual visits:

1. **Every pull request** — scan changed code and SQL migrations.
2. **Every deploy** — run a release gate and store the result.
3. **Scheduled monitoring** — re-check production-facing posture and policy drift.
4. **Database change drift** — detect dashboard/manual RLS changes that are missing from migrations.
5. **Regression history** — show what became safer or riskier over time.

The website is therefore the control plane and acquisition surface; the recurring product lives in GitHub/CI and scheduled checks.

## Why users pay

Free tier:
- Public repository quick scan.
- Limited static Supabase checks.
- No account required.

Paid hypotheses (must be validated, not assumed):
- Private repositories.
- Continuous PR/deploy security gate.
- Real tenant-isolation proof using disposable identities/test database.
- RLS/policy drift monitoring.
- Storage/Realtime isolation checks.
- Security history and regression alerts.
- AI-editor-ready remediation prompts/patches.
- Automatic re-test after remediation.
- Human-reviewed Launch Audit / Fix & Verify service for nontechnical founders.

## Defensible wedge

Do not compete as a generic SAST/security scanner. GitHub, VibeProof, VibeSec, Assurly, Reeve and other products already cover broad scanning.

Differentiate on **Supabase authorization proof**:
- Access matrix across anon / tenant A / tenant B / role identities.
- Read and write isolation, not only pattern matching.
- Negative controls so a vacuous PASS cannot be reported.
- RLS policy drift between migrations and the real database.
- Storage and Realtime tenant isolation.
- Deterministic evidence and re-test after fixes.
- Explicit coverage: skipped/inapplicable checks are never shown as PASS.

## Referral loop

Referral must come from useful artifacts, not marketing gimmicks:
- Shareable scoped report with commit SHA, date and coverage.
- GitHub PR check that teammates see automatically.
- Optional README badge such as `Access-control checks: passing on <commit>` — never a security certification.
- One-click copy of a finding/fix prompt into Lovable/Cursor/Claude Code.
- Agency/client report export that naturally exposes the product name.

## Product UX direction

The current landing page is below launch quality. Replace it with a trust-oriented product experience:

1. Hero answers one concrete question: **"Can User B access User A's data?"**
2. Two free entry points: `Scan live app` and `Scan GitHub repo`.
3. Interactive sample tenant-isolation matrix.
4. Real sample report with critical/high findings and fix/retest states.
5. Explain deterministic proof vs generic AI scanner.
6. Product flow diagram: Connect -> Prove -> Fix -> Re-test -> Gate release.
7. GitHub/CI integration section for recurring use.
8. Methodology and limitations section for trust.
9. Pricing shown only as hypotheses until buyer validation/payment evidence is collected.

## Brand / domain rule

- `RLSProof` = temporary codename.
- `psycholog1sts.github.io/personal-app` = staging/development URL only.
- No paid domain has been purchased.
- Final brand and domain must be selected only after owner approval, trademark/domain checks, and positioning validation.

## Next implementation sequence

1. Redesign web UX around continuous release proof, not a one-off scanner.
2. Add live-app URL scan entry point with safe read-only checks.
3. Add tenant-isolation proof engine against disposable/local/test Postgres/Supabase only.
4. Add GitHub Action / PR check integration.
5. Add policy-drift detection.
6. Add report history/alerts only after a real recurring-user signal exists.
7. Validate paid conversion before building broad enterprise features.
