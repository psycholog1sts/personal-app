# Premium Enterprise UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public product surface into a premium enterprise-security experience without changing the final brand/domain decision or weakening the existing scan/release-gate architecture.

**Architecture:** Keep the app as a Next.js static export. Preserve the existing browser-only scanner and security core, while decomposing the page into focused presentational components and replacing the current generic landing-page styling with an original 21st-inspired enterprise console system. No new animation framework, UI framework, or paid dependency is introduced.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, plain CSS, existing Node test runner, existing GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-04-premium-enterprise-ui-design.md`

## Global Constraints
- Final product name and domain remain undecided; `RLSProof` is staging/codename only.
- No paid UI libraries, paid APIs, paid fonts, or paid hosting.
- No fake logos, fabricated testimonials, usage metrics, or compliance claims.
- Preserve browser-only public-repository quick scan and static export.
- Preserve GitHub Action release gate and Supabase DB-proof behavior.
- No new motion runtime, WebGL, autoplay video, or remote font dependency.
- Pilot pricing shown in UI: Quick Scan $0, Launch Proof $499, Fix + Verify $990; Continuous Guard stays private beta only.

---

### Task 1: Premium surface contract

**Files:**
- Create: `test/premium-enterprise-ui.test.js`
- Read: `app/page.js`
- Read: `app/components/ScannerForm.js`
- Read: `app/globals.css`

**Interfaces:**
- Consumes: rendered/source structure of the existing static product surface.
- Produces: regression contract that later UI tasks must satisfy.

- [ ] **Step 1: Write the failing UI contract test**

Create a Node test that reads `app/page.js`, `app/globals.css`, `app/layout.js`, and component sources. Require the following strings/structures:

```js
assert.match(page, /Ship Supabase changes with proof, not hope\./);
assert.match(page, /Launch Proof/);
assert.match(page, /Fix \+ Verify/);
assert.match(page, /Private beta/);
assert.doesNotMatch(page, /working name/i);
assert.match(css, /:focus-visible/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /@media \(max-width:/);
assert.match(layout, /tenant isolation/i);
```

Also require component imports for `ProductConsole`, `CapabilityBento`, `PricingSection`, and `FaqSection`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`
Expected: existing tests pass; new premium UI contract fails because the new components/copy do not exist yet.

- [ ] **Step 3: Commit the RED contract**

Commit message: `test: define premium enterprise product surface`

---

### Task 2: Product console and page decomposition

**Files:**
- Create: `app/components/ProductConsole.js`
- Create: `app/components/CapabilityBento.js`
- Create: `app/components/PricingSection.js`
- Create: `app/components/FaqSection.js`
- Modify: `app/page.js`
- Test: `test/premium-enterprise-ui.test.js`

**Interfaces:**
- `ProductConsole()` returns the realistic sample release event surface.
- `CapabilityBento()` returns four capability cards.
- `PricingSection({ checkoutUrl })` renders $0 / $499 / $990 / private-beta commercial framing.
- `FaqSection()` renders native `details`/`summary` FAQ items.

- [ ] **Step 1: Implement `ProductConsole`**

Include clearly labeled sample/demo content only:
- PR `#184`
- commit `8f31c9a`
- gate `PASS`
- static checks `complete`
- DB proof `complete`
- tenant isolation `12/12`
- cross-tenant leaks `0`
- fixes verified `3`
- coverage `complete`
- sample activity timeline

Use semantic sections/lists and no client JavaScript.

- [ ] **Step 2: Implement `CapabilityBento`**

Cards:
1. Pull request release gate.
2. Tenant isolation proof.
3. Drift signal.
4. Fix and re-test.

Add one featured card class for restrained spotlight styling; keep all critical information visible without hover.

- [ ] **Step 3: Implement `PricingSection`**

Render:
- Quick Scan — `$0`.
- Launch Proof — `$499 pilot` with full scanners, human review, scoped DB proof, one verification pass.
- Fix + Verify — `$990 pilot` with agreed critical/high remediation plus re-test.
- Continuous Guard — `Private beta`, explicitly not yet sold.

If `checkoutUrl` is missing, show a disabled payment-pending control instead of a broken link.

- [ ] **Step 4: Implement `FaqSection`**

Native FAQ topics:
- What is checked?
- Does source leave the browser?
- Is this a pentest/certification?
- Why not only GitHub security scanning?
- What is DB proof?
- What if a check cannot run?

- [ ] **Step 5: Rewrite `app/page.js` as composition-only**

Required order:
1. sticky header
2. hero + ProductConsole
3. factual proof strip
4. CapabilityBento
5. scanner section
6. release-proof access matrix
7. recurring workflow
8. PricingSection
9. FaqSection
10. footer

Keep `ScannerForm` functionality unchanged in this task.

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: premium surface source assertions now progress; remaining CSS/scanner/metadata assertions may still fail.

- [ ] **Step 7: Commit**

Commit message: `feat: build premium release-proof product surface`

---

### Task 3: Upgrade scanner UX without changing scan semantics

**Files:**
- Modify: `app/components/ScannerForm.js`
- Test: `test/premium-enterprise-ui.test.js`
- Existing regression tests: `test/browser-core.test.js`, `test/remote-github.test.js`

**Interfaces:**
- Consumes: `browserQuickScanGithubRepo(repository)` existing report contract.
- Produces: same scan behavior, reorganized presentation.

- [ ] **Step 1: Add presentation assertions**

Require source strings for:
- `Quick assessment`
- `Risk posture`
- `Coverage`
- `Findings`
- `Next action`
- explicit bounded-check disclaimer

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`
Expected: scanner presentation assertions fail while scan engine tests remain GREEN.

- [ ] **Step 3: Refactor scanner presentation only**

Keep `browserQuickScanGithubRepo()` call, loading/error lifecycle, redacted findings, and report contract unchanged.

Render result hierarchy:
1. Risk posture card with score/gate.
2. Coverage card with files/bytes and bounded reason.
3. Findings list.
4. Next-action panel for Launch Proof.

Clean state copy must say: `No blocker found by the bounded checks` and never say `secure`, `safe`, or `certified`.

- [ ] **Step 4: Run targeted and full tests**

Run: `npm test`
Expected: scanner UX tests and all existing scan-engine tests PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: upgrade quick assessment experience`

---

### Task 4: Enterprise design system and responsive/a11y hardening

**Files:**
- Modify: `app/globals.css`
- Test: `test/premium-enterprise-ui.test.js`

**Interfaces:**
- Consumes: class names from Task 2 and Task 3 components.
- Produces: all visual hierarchy, responsive behavior, focus states, reduced-motion behavior.

- [ ] **Step 1: Add CSS contract assertions**

Require:
```js
assert.match(css, /--surface-raised:/);
assert.match(css, /--state-pass:/);
assert.match(css, /--state-review:/);
assert.match(css, /--state-blocked:/);
assert.match(css, /:focus-visible/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /@media \(max-width: 980px\)/);
assert.match(css, /@media \(max-width: 680px\)/);
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test`
Expected: new CSS token/behavior assertions fail.

- [ ] **Step 3: Replace visual system**

Implement:
- near-black neutral page background
- warm off-white text
- neutral surfaces and border hierarchy
- pass/review/blocked state colors
- compact sticky header
- conventional high-conversion hero layout
- realistic console surface
- monochrome bento cards
- restrained featured-card spotlight using pseudo-elements/CSS variables only
- scanner result cards
- access matrix states
- commercial cards
- FAQ accordion styles
- footer

Do not add remote assets, remote fonts, animation packages, or WebGL.

- [ ] **Step 4: Add accessibility styles**

Add visible `:focus-visible` outlines to interactive controls. Under `@media (prefers-reduced-motion: reduce)`, disable smooth scroll and non-essential transitions.

- [ ] **Step 5: Add responsive behavior**

At <=980px collapse hero/product console and split sections to one column. At <=680px collapse navigation, pricing, bento, matrix presentation, scanner input/action, and ensure no horizontal page overflow.

- [ ] **Step 6: Run tests and production build**

Run: `npm test && npm run build`
Expected: PASS and static export generated.

- [ ] **Step 7: Commit**

Commit message: `style: ship premium enterprise design system`

---

### Task 5: SEO, conversion copy, and commercial integrity

**Files:**
- Modify: `app/layout.js`
- Modify: `app/page.js` only if final copy corrections are needed
- Test: `test/premium-enterprise-ui.test.js`

**Interfaces:**
- Produces: metadata aligned to recurring authorization proof, not a generic scanner.

- [ ] **Step 1: Add metadata assertions**

Require title/description language that includes:
- Supabase
- tenant isolation
- release gate

Require absence of `security certification` claims in metadata.

- [ ] **Step 2: Run tests and verify RED if metadata is stale**

Run: `npm test`

- [ ] **Step 3: Update metadata**

Use codename only as temporary title prefix. Description should state continuous Supabase authorization proof for AI-built applications and GitHub release gating.

- [ ] **Step 4: Commercial truth review**

Check page source for unsupported claims. Keep pilot pricing language. Continuous Guard must remain visibly unavailable/private beta.

- [ ] **Step 5: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: sharpen enterprise positioning and metadata`

---

### Task 6: Final security, quality, and release verification

**Files:**
- Review all changed files.
- No implementation change unless a verified defect is found.

**Interfaces:**
- Produces: merge-ready PR with exact-head evidence.

- [ ] **Step 1: Run complete CI-equivalent test suite**

Run: `npm test`
Expected: all non-external tests PASS; external tests that require installed binaries remain handled by their dedicated CI job.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected static export with `out/index.html`, privacy, terms, robots, and sitemap.

- [ ] **Step 3: Verify GitHub CI**

Require exact-head success for:
- `test`
- `action-contract`
- `external-integration`

- [ ] **Step 4: Review diff**

Verify:
- no secret/token committed
- no final domain chosen
- no final brand decision encoded
- no fake logos/testimonials/metrics
- no regression in scanner or Action behavior
- no unnecessary dependency added

- [ ] **Step 5: Merge only exact green HEAD**

Create/update PR from `premium-enterprise-ui-20260904` to `main`, mark ready only after all gates are GREEN, and merge using the exact verified head SHA.

- [ ] **Step 6: Verify `main` CI and Pages deployment**

Confirm merged `main` commit passes CI and GitHub Pages publishes successfully before calling the redesign complete.