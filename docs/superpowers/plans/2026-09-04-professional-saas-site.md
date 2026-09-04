# Professional SaaS Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the public RLSProof site into a credible, lightweight developer-security SaaS experience without changing scanner/release-gate behavior.

**Architecture:** Keep the existing static Next.js structure and English dictionary as the source of public copy. Make changes through focused copy/component/CSS edits, preserve server-rendered marketing sections, and add regression tests that reject internal strategy language or unsupported trust claims.

**Tech Stack:** Next.js 16 static export, React 19, plain CSS, Node test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-04-professional-saas-site-design.md`

## Global Constraints

- Keep English as the only published locale for this pass.
- Do not add remote fonts, animation libraries, analytics, AdSense, paid APIs, or new runtime dependencies.
- Preserve browser-only Quick Scan privacy and all deterministic scanner/release-gate behavior.
- Do not fabricate customers, ratings, testimonials, certifications, company identifiers, payment approval, or checkout availability.
- If `AUDIT_CHECKOUT_URL` is absent, Launch Verification must remain unavailable with `Payment activation pending`.
- Keep GitHub Pages static export and current base-path SEO behavior working.
- Mobile must remain free of horizontal overflow at 320, 390, 768, and 1440 px.

---

### Task 1: Lock public-copy quality contracts

**Files:**
- Create: `test/site-professionalization.test.js`
- Read: `i18n/dictionaries/en.js`
- Read: `app/components/SiteHeader.js`
- Read: `app/page.js`

**Interfaces:**
- Consumes: the English dictionary and marketing component source as plain UTF-8 text.
- Produces: regression assertions that fail when internal strategy/prototype wording returns.

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('public English copy contains no internal strategy or temporary-brand labels', async () => {
  const dictionary = await read('i18n/dictionaries/en.js');
  assert.doesNotMatch(dictionary, /working name|Live acquisition surface|Pricing hypotheses|validation price|Acquisition|Beta pricing being validated/i);
  assert.match(dictionary, /Prove your Supabase data boundaries before release\./);
  assert.match(dictionary, /Payment activation pending/);
});

test('header and footer no longer render temporary working-name UI', async () => {
  const [header, page] = await Promise.all([
    read('app/components/SiteHeader.js'),
    read('app/page.js'),
  ]);
  assert.doesNotMatch(header, /workingName/);
  assert.doesNotMatch(page, /footer\.workingName/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/site-professionalization.test.js`
Expected: FAIL because the current dictionary/header/footer still expose internal wording.

- [ ] **Step 3: Commit the failing contract**

```bash
git add test/site-professionalization.test.js
git commit -m "test: lock professional public copy contract"
```

---

### Task 2: Replace prototype copy with buyer-facing product copy

**Files:**
- Modify: `i18n/dictionaries/en.js`
- Modify: `app/components/SiteHeader.js`
- Modify: `app/page.js`

**Interfaces:**
- Consumes: existing dictionary keys and component props.
- Produces: the same dictionary/component interfaces except `nav.workingName` and `footer.workingName` are removed and `footer.tagline` is used instead.

- [ ] **Step 1: Update metadata and hero copy**

Set the home title to `RLSProof — Supabase RLS & Tenant Isolation Checks` and use a concise description centered on Supabase RLS, tenant isolation, explicit coverage, and release evidence. Set hero title to `Prove your Supabase data boundaries before release.` and move `Can User B access User A’s data?` into the body/problem framing.

- [ ] **Step 2: Remove public internal-language strings**

Replace:
- `Live acquisition surface` → `Free browser Quick Scan`
- `Pricing hypotheses` → `Plans for every release stage`
- `Acquisition` badge → `Free`
- `Recurring proof` badge → `Private beta`
- `validation price` → `current launch price`
- `Beta pricing being validated` → `Join private beta`
- footer temporary-name text → `Authorization evidence for Supabase teams.`

Remove `nav.workingName` and stop rendering the header chip.

- [ ] **Step 3: Keep payment state truthful**

Keep Launch Verification at `$149`, preserve `Payment activation pending` when no checkout URL is configured, and do not add a fake waitlist form or subscription checkout.

- [ ] **Step 4: Run the focused copy test**

Run: `node --test test/site-professionalization.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add i18n/dictionaries/en.js app/components/SiteHeader.js app/page.js test/site-professionalization.test.js
git commit -m "feat: professionalize public SaaS copy"
```

---

### Task 3: Refine visual hierarchy without adding runtime weight

**Files:**
- Modify: `app/globals.css`
- Modify: `app/components/HeroCommandCenter.js` only if structure must change for semantics; otherwise leave JSX intact.

**Interfaces:**
- Consumes: current class names used by existing components.
- Produces: no JavaScript API changes; CSS-only visual refinement wherever possible.

- [ ] **Step 1: Update design tokens**

Use graphite surfaces close to `#070A0D`, `#0D1218`, `#10171F`, text `#F4F7F5`, secondary `#9AA5A1`, border `#202A30`, and emerald `#57E6A6`. Keep warning/danger states distinct.

- [ ] **Step 2: Reduce template-like decoration**

Remove or materially reduce fixed grid texture, large radial glow intensity, oversized shadows, and repeated floating effects. Keep the product console visually dominant rather than decorative background effects.

- [ ] **Step 3: Improve typography and rhythm**

Use system fonts only. Keep body text at readable sizes, hero H1 at a fluid 48–64 px desktop / ~38–44 px mobile range, section vertical rhythm near 96–112 px desktop and 64–80 px mobile, and 44 px minimum interactive controls.

- [ ] **Step 4: Preserve responsive behavior**

Keep existing mobile breakpoints but verify header navigation, hero, matrices, pricing cards, and scanner controls cannot force page-level horizontal scrolling.

- [ ] **Step 5: Run full tests/build**

Run: `npm test && npm run build`
Expected: all tests PASS and static export succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/components/HeroCommandCenter.js
git commit -m "feat: refine premium security visual system"
```

---

### Task 4: Strengthen SEO/accessibility contracts

**Files:**
- Create: `test/site-seo-a11y.test.js`
- Modify: `app/layout.js` only if needed by failing tests.
- Modify: `i18n/dictionaries/en.js` only if needed by failing tests.

**Interfaces:**
- Consumes: metadata/layout/page source.
- Produces: regression checks for one English root locale, concise metadata, no meta-keyword behavior, semantic main/header/footer structure, and visible focus styling.

- [ ] **Step 1: Add source-level SEO/accessibility regression tests**

Assert the layout uses `lang={locale.htmlLang}`, the page includes `<main>`, the header has navigation labeling, CSS contains `:focus-visible`, and metadata title/description do not use internal `AI-built apps` positioning.

- [ ] **Step 2: Run focused test and fix only observed failures**

Run: `node --test test/site-seo-a11y.test.js`
Expected: PASS after targeted metadata/copy corrections.

- [ ] **Step 3: Run production verification**

Run: `npm test && npm run build`
Expected: all tests PASS; `out/` contains the homepage, privacy, terms, robots and sitemap outputs expected by the current static export.

- [ ] **Step 4: Commit**

```bash
git add test/site-seo-a11y.test.js app/layout.js i18n/dictionaries/en.js
git commit -m "test: lock SEO and accessibility quality bar"
```

---

### Task 5: Review, PR, exact-head CI, and production verification

**Files:**
- Review all changed files against the spec.

**Interfaces:**
- Consumes: completed branch changes.
- Produces: a mergeable PR whose exact head has green CI and whose merged main deploy succeeds.

- [ ] **Step 1: Review the full diff**

Reject any new unsupported claims, payment promises, customer proof, dependency growth, client-side marketing JavaScript, or scanner behavior changes.

- [ ] **Step 2: Open the PR and wait for exact-head CI**

Required jobs: `test`, `action-contract`, `external-integration`. Do not merge if any required exact-head job is not green.

- [ ] **Step 3: Merge with expected head SHA**

Use squash merge only after exact-head CI is green.

- [ ] **Step 4: Verify main CI and GitHub Pages**

Confirm main `rlsproof-ci` push run succeeds; confirm Pages build/export succeeds and deploy completes. Verify the live homepage and `/privacy/` and `/terms/` routes render after deployment.