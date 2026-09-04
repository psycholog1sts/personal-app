# Premium Security Command Center Design

Status: approved product-surface direction for the current build. **RLSProof remains a temporary codename.** Final brand and domain remain owner decisions after the product is genuinely ready.

## Goal

Transform the functional V2 landing page into a premium enterprise developer-security product experience without changing the deterministic security core, browser quick-scan behavior, GitHub Action contract, Supabase DB-proof behavior, static GitHub Pages deployment, or zero-paid-API constraint.

The surface should feel like a security control plane for AI-built Supabase applications, not a generic scanner landing page.

## Product hierarchy

The page answers one question first:

> Can User B access User A's data?

Then it demonstrates the answer as a release-control workflow:

1. Pull request or deploy starts a gate.
2. Static engines and Supabase checks execute.
3. Tenant-isolation proof reports an access matrix.
4. Coverage states show what executed, passed, failed, skipped, or was unavailable.
5. Findings become remediation tasks.
6. The same proof is re-run after the fix.
7. Only executed checks can contribute to PASS.

The free browser scanner remains an acquisition entry point, but it must be visually subordinate to the recurring release-gate product.

## Visual direction

Use an original A+ hybrid inspired by enterprise dashboards and current 21st.dev dashboard/bento/display-card patterns:

- Graphite / near-black background.
- Controlled security green for verified states.
- Amber for incomplete/review states and red for blockers.
- Dense but legible product panels with strong hierarchy.
- Crisp borders, restrained shadows and low-amplitude spotlight effects.
- Monospace only for commit IDs, policy names, paths and commands.
- No generic neon cyberpunk, excessive glassmorphism, random gradients, Three.js, WebGL, particle effects or heavy animation.
- Motion is limited to CSS hover/focus/status affordances and must respect `prefers-reduced-motion`.

## Page architecture

`app/page.js` becomes composition-only. New presentation components live under `app/components/` and contain no scanner/security decision logic.

Components:

- `SiteHeader.js` — sticky premium navigation and working-name status.
- `HeroCommandCenter.js` — headline, trust properties and product console.
- `ReleaseConsole.js` — clearly marked sample release-gate dashboard with headline gate, coverage summary and timeline.
- `ProofMatrix.js` — sample tenant access matrix with semantic table markup.
- `WorkflowTimeline.js` — PR -> static checks -> RLS proof -> fix -> re-test -> release narrative.
- `FindingsExplorer.js` — sample findings with severity/category filters represented as non-interactive display controls; never fake live customer data.
- `CoveragePanel.js` — executed/passed/failed/skipped/unavailable proof states and the rule that skipped is never PASS.
- `EvidencePanel.js` — reproducibility fields such as commit, scope, tool versions and verification chain.
- `InstallPanel.js` — GitHub Action and DB-proof setup snippets using the existing action interface (`uses: ./` as repository-local example and `db-proof: required` where appropriate).
- `TrustMethodology.js` — deterministic decision model, privacy boundaries and limitations.
- `PricingSection.js` — Free / Continuous / Launch Verification packaging. Prices remain hypotheses; unavailable payment remains clearly disabled.
- `FaqSection.js` — technical objections around source privacy, DB proof, AI and PASS semantics.
- `ScannerForm.js` — existing browser scan logic remains intact; presentation may be refined without changing scan semantics.

## Information architecture

Order:

1. Header
2. Hero + product release console
3. Proof/coverage signal strip
4. Tenant isolation proof matrix
5. PR/deploy/drift workflow
6. Findings + remediation/evidence bento
7. Live Quick Scan
8. Methodology / privacy / limitations
9. GitHub Action + DB-proof install
10. Pricing
11. FAQ
12. Footer

Pricing must not appear before the user sees product depth, proof, evidence and install workflow.

## Sample-data rules

All product-console values are illustrative and must be labeled `Sample` or `Example` in visible UI or accessible text.

Do not display fake customer logos, testimonials, adoption counts, certifications, scan volumes or revenue claims.

## Design system

Keep one global stylesheet to avoid unnecessary build/dependency complexity, but organize it into explicit sections with tokens.

Required tokens:

- surfaces: `--bg`, `--surface-1`, `--surface-2`, `--surface-3`
- borders: `--border`, `--border-strong`
- text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- states: `--success`, `--warning`, `--danger`, `--info`
- radii: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`
- shadows: `--shadow-panel`, `--shadow-float`

## Accessibility

- Semantic landmarks and heading order.
- Proof matrix uses actual `<table>` semantics.
- Visible keyboard focus for links, buttons and inputs.
- Scanner error uses `role="alert"`; result container remains live-region compatible.
- Contrast should remain readable on dark surfaces.
- Horizontal overflow for dense matrices on narrow screens instead of clipped content.
- `prefers-reduced-motion: reduce` disables non-essential transitions/scroll behavior.
- Decorative status dots/icons are hidden from assistive tech; text carries state.

## SEO and metadata

Metadata should describe recurring Supabase authorization proof rather than only a free scanner.

Primary concepts:

- Supabase RLS security
- Supabase RLS testing
- tenant isolation
- Supabase authorization
- release security gate
- AI-built / vibe-coded Supabase app security

No keyword stuffing and no unverified claims.

## Performance constraints

- No new runtime dependency.
- No client component except where interaction already requires it (`ScannerForm`).
- No external image/font dependency.
- No WebGL/Three.js/motion package.
- Static export remains valid.

## Security constraints

- Security core and release-gate code are out of scope for redesign unless a regression is discovered.
- No secret/token values in source, UI or test fixtures.
- Scanner source handling remains browser-side for public quick scan.
- Sample commands must not encourage testing against production databases.

## Acceptance criteria

1. Existing unit/integration/action-contract tests remain green.
2. A new product-surface contract test verifies the premium sections, coverage states, sample-data disclosure, install flow, privacy/methodology language and accessibility hooks.
3. Production build and static export remain green.
4. GitHub Pages deploy succeeds from main after merge.
5. Browser runtime has no obvious rendering/network/console failures on the staging URL.
6. Desktop and mobile layouts preserve readable hierarchy, usable scanner controls and matrix access.
7. Final brand/domain are not selected or presented as final.
