# Premium Security Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the current functional V2 page into a premium enterprise security command-center experience while preserving scanner semantics, deterministic release-gate behavior, static export and zero-paid-API constraints.

**Architecture:** Keep `app/page.js` as a server-rendered composition layer and split display-only product surfaces into focused server components under `app/components/`. Keep `ScannerForm.js` as the only existing interactive client surface and do not move security decisions into UI code. Keep CSS dependency-free and tokenized in `app/globals.css`.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, JavaScript, CSS, Node 22 test runner, GitHub Actions, static GitHub Pages export.

**Spec:** `docs/superpowers/specs/2026-09-04-premium-security-command-center-design.md`

## Global Constraints

- `RLSProof` remains a temporary codename; do not choose a final brand/domain.
- No paid API, hosting, scanner or design dependency.
- No new runtime package.
- Existing browser quick-scan logic and security/release-gate core behavior must remain unchanged.
- Static GitHub Pages export must remain valid.
- Sample data must be visibly labeled as sample/example.
- Skipped/unavailable security checks must never be represented as PASS.
- No fake logos, testimonials, certifications, customer counts or revenue claims.

---

### Task 1: RED product-surface contract

**Files:**
- Modify: `test/product-v2-surface.test.js`

**Interfaces:**
- Consumes: source files under `app/` as text, following the repository's existing contract-test pattern.
- Produces: a failing acceptance contract for the premium surface before production UI code exists.

- [ ] **Step 1: Extend the existing test first**

Add reads for the composition page, layout metadata and the intended component files. Assert that the final surface exposes:

```js
assert.match(page, /HeroCommandCenter/);
assert.match(page, /ProofMatrix/);
assert.match(page, /CoveragePanel/);
assert.match(page, /InstallPanel/);
assert.match(page, /TrustMethodology/);
assert.match(page, /FaqSection/);
assert.match(css, /--surface-1:/);
assert.match(css, /--text-primary:/);
assert.match(css, /prefers-reduced-motion/);
assert.match(layout, /release gate/i);
assert.match(coverage, /Executed/i);
assert.match(coverage, /Skipped/i);
assert.match(coverage, /Unavailable/i);
assert.match(coverage, /never a PASS/i);
assert.match(releaseConsole, /Sample/i);
assert.match(install, /db-proof/i);
assert.match(trust, /browser/i);
assert.match(trust, /not a security certification/i);
assert.match(faq, /production database/i);
```

Keep the existing recurring-value assertions (`every pull request`, `tenant isolation`, `policy drift`, `re-test`).

- [ ] **Step 2: Verify RED in CI**

Open/update a PR from the isolated branch to `main`. The `test` job must fail because the new component files/tokens do not exist yet. Confirm the failure is the expected product-surface contract failure, not YAML/install infrastructure.

- [ ] **Step 3: Do not change the test after a correct RED**

Implementation must satisfy this contract unless a test assertion is proven incorrect or unsafe.

---

### Task 2: Decompose the page into product components

**Files:**
- Create: `app/components/SiteHeader.js`
- Create: `app/components/HeroCommandCenter.js`
- Create: `app/components/ReleaseConsole.js`
- Create: `app/components/ProofMatrix.js`
- Create: `app/components/WorkflowTimeline.js`
- Create: `app/components/FindingsExplorer.js`
- Create: `app/components/CoveragePanel.js`
- Create: `app/components/EvidencePanel.js`
- Create: `app/components/InstallPanel.js`
- Create: `app/components/TrustMethodology.js`
- Create: `app/components/PricingSection.js`
- Create: `app/components/FaqSection.js`
- Modify: `app/page.js`

**Interfaces:**
- Consumes: `checkoutUrl` from `app/page.js` for scanner/pricing checkout state.
- Produces: server-renderable React components with no security decision logic and no new client boundary.

- [ ] **Step 1: Build presentation-only sample components**

Use static arrays colocated with each component. Mark illustrative release/findings data with visible `Sample`/`Example` labels. Use semantic elements (`section`, `article`, `table`, `ol`) rather than div-only layout.

- [ ] **Step 2: Make `app/page.js` composition-only**

It should import the components plus the existing `ScannerForm`, derive `checkoutUrl`, and render the spec order:

```jsx
<SiteHeader />
<HeroCommandCenter />
<ProofMatrix />
<WorkflowTimeline />
<FindingsExplorer />
<CoveragePanel />
<EvidencePanel />
<ScannerForm checkoutUrl={checkoutUrl} />
<TrustMethodology />
<InstallPanel />
<PricingSection checkoutUrl={checkoutUrl} />
<FaqSection />
```

Add the existing legal footer links without changing privacy/terms routes.

- [ ] **Step 3: Preserve scanner semantics**

Do not alter `browserQuickScanGithubRepo`, report scoring, release-gate values, repository parsing, source fetching or checkout behavior.

---

### Task 3: Premium design system and scanner presentation

**Files:**
- Modify: `app/globals.css`
- Modify: `app/components/ScannerForm.js` only for semantic/presentation copy and class structure if needed.

**Interfaces:**
- Consumes: class names from Task 2 and the scanner's existing state model.
- Produces: responsive graphite command-center visual system without runtime dependencies.

- [ ] **Step 1: Replace tokens with explicit design-system tokens**

Define at minimum:

```css
--bg: #05070a;
--surface-1: #0a0e14;
--surface-2: #0e141d;
--surface-3: #121a25;
--border: #202a38;
--border-strong: #314056;
--text-primary: #f5f7fa;
--text-secondary: #a8b3c2;
--text-tertiary: #738096;
--success: #79e2b4;
--warning: #f5c56b;
--danger: #ff7f7f;
--info: #8eb9ff;
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 20px;
--radius-xl: 28px;
--shadow-panel: 0 24px 70px rgba(0, 0, 0, .28);
--shadow-float: 0 34px 100px rgba(0, 0, 0, .38);
```

- [ ] **Step 2: Create hierarchy, not equal-card soup**

Make the release gate the headline product panel. Use bento grouping for proof/findings/coverage/evidence with one visually dominant item per section. Scanner is later in the page and remains highly usable.

- [ ] **Step 3: Accessibility states**

Add `:focus-visible` treatment for links/buttons/inputs, horizontal overflow for the proof matrix, mobile stacking under 900px/680px and:

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
```

- [ ] **Step 4: Scanner status clarity**

Retain the bounded/partial coverage warning. Do not turn zero findings into a security clearance. Keep `role="alert"` and `aria-live` behavior.

---

### Task 4: SEO/trust metadata

**Files:**
- Modify: `app/layout.js`

**Interfaces:**
- Consumes: optional `NEXT_PUBLIC_SITE_URL` canonical logic.
- Produces: metadata aligned to recurring Supabase authorization proof.

- [ ] **Step 1: Update title/description without finalizing brand**

Use wording that includes Supabase authorization, tenant isolation and release gate. Keep the codename but do not describe it as a certification.

Suggested description:

```text
Continuous Supabase authorization release proof for AI-built apps: test RLS and tenant isolation, expose coverage, block regressions, and re-test fixes before release.
```

- [ ] **Step 2: Preserve canonical/OpenGraph conditional behavior**

No new analytics, remote images or tracking.

---

### Task 5: GREEN CI and security review

**Files:**
- Review all changed files.

**Interfaces:**
- Produces: fresh CI evidence for tests/build/export/action contracts/external tools.

- [ ] **Step 1: Push implementation and verify the PR test job**

Expected required `test` steps: Install, Test, Production build, Verify static export — all successful.

- [ ] **Step 2: Verify unchanged security contracts**

Expected PR jobs: `action-contract` successful and `external-integration` successful.

- [ ] **Step 3: Review diff for security/regression risk**

Confirm no secrets, token values, new dependencies, production DB instructions, source-upload behavior, or PASS semantics were introduced.

- [ ] **Step 4: Verify requirement coverage**

Re-read the design spec and confirm every acceptance criterion represented in source or verification evidence.

---

### Task 6: Merge, Pages deploy and runtime QA

**Files:**
- No source change unless a runtime defect is found.

**Interfaces:**
- Consumes: green PR head SHA.
- Produces: exact main SHA + Pages deployment + runtime evidence.

- [ ] **Step 1: Merge only the verified PR head**

Use expected-head protection when merging so a moved branch cannot be merged accidentally.

- [ ] **Step 2: Verify main CI and Pages on the merge SHA**

Require `rlsproof-ci` and `pages` conclusions `success`.

- [ ] **Step 3: Browser runtime QA on staging**

Open `https://psycholog1sts.github.io/personal-app/` and verify desktop/mobile visual hierarchy, navigation anchors, scanner form presence, proof matrix, install code, pricing/FAQ, privacy/terms links, console/network errors and readable overflow behavior.

- [ ] **Step 4: Report actual state**

Report: what was found, what changed, fresh verification evidence, blockers if any, and exactly one owner action only if genuinely required. Do not call the product fully ready while final brand/domain/payment validation remain open.
