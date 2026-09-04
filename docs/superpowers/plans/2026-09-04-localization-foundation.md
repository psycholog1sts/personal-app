# Localization Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a strict English-first localization foundation that is safe for future Japanese, German, and Brazilian Portuguese publication without shipping partial translations or weakening static export, SEO, accessibility, or scanner semantics.

**Architecture:** Keep English at the root URL and treat it as the schema-defining source catalog. Add a small repository-owned i18n layer with a locale registry, strict dictionary validator, localized-path and SEO helpers, a terminology glossary, and CI/build gates. Migrate every human-facing string on the current public surface behind the English catalog while keeping machine/security identifiers invariant. Do not publish non-English routes yet; draft locales exist only in registry metadata until complete catalogs and market/legal review are ready.

**Tech Stack:** Next.js 16 App Router static export, React 19, Node 22 built-in test runner, repository-owned JavaScript utilities, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-04-localization-foundation-design.md`

## Global Constraints

- English (`en`) is the only published locale in this implementation.
- Registered draft locales are `ja`, `de`, and `pt-BR`; their URL slugs are `ja`, `de`, and `pt-br`.
- No automatic browser/IP language redirect.
- No runtime machine translation, paid localization API, middleware, cookies, rewrites, or remote dictionary fetch.
- No production fallback from a missing localized key to English.
- No new runtime dependency.
- Static GitHub Pages export must remain valid.
- Scanner rule IDs, severity enums, PASS/FAIL semantics, paths, commands, product names, and security decision logic remain invariant.
- Draft locales must not appear in sitemap, alternates, navigation, switchers, or generated locale routes.
- Translation strings are plain data and must never be rendered with `dangerouslySetInnerHTML`.

---

### Task 1: Add strict locale registry, path helpers, glossary, and validator

**Files:**
- Create: `i18n/config.js`
- Create: `i18n/get-localized-path.js`
- Create: `i18n/glossary.js`
- Create: `i18n/validate-locales.js`
- Test: `test/i18n.test.js`

**Interfaces:**
- `defaultLocale: 'en'`
- `localeRegistry: readonly locale[]`
- `getPublishedLocales(): locale[]`
- `getLocale(code): locale | undefined`
- `assertPublishedLocale(localeCode): locale`
- `getLocalizedPath(localeCode, pathname): string`
- `validateDictionary(source, candidate): { ok: boolean, errors: string[] }`

- [ ] **Step 1: Write failing tests** for registry status, path generation, missing/extra/empty/type/placeholder failures, and unknown locale rejection.
- [ ] **Step 2: Run the new test** and verify RED because the modules do not yet exist.
- [ ] **Step 3: Implement the registry and helpers** with `en` published and `ja`, `de`, `pt-BR` draft.
- [ ] **Step 4: Implement recursive dictionary validation** with exact key parity, type parity, non-empty strings, and exact `{placeholder}` token sets.
- [ ] **Step 5: Run targeted tests** and verify GREEN.
- [ ] **Step 6: Commit** with `feat: add strict locale registry and validation`.

### Task 2: Add canonical English catalog and strict loader

**Files:**
- Create: `i18n/dictionaries/en.js`
- Create: `i18n/get-dictionary.js`
- Modify: `i18n/validate-locales.js`
- Test: `test/i18n.test.js`

**Interfaces:**
- `englishDictionary: object`
- `getDictionary(localeCode): object` throws unless locale is registered, published, and complete.
- `validatePublishedDictionaries(): { ok: boolean, errors: string[] }`

- [ ] **Step 1: Extend failing tests** so English loads, draft/unknown locales reject, and incomplete published catalogs fail.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Create the English catalog** grouped by `meta`, `nav`, `hero`, `signals`, `proof`, `workflow`, `findings`, `coverage`, `evidence`, `scanner`, `methodology`, `install`, `pricing`, `faq`, `legal`, `footer`, and `a11y`.
- [ ] **Step 4: Implement the static loader** with no remote loading and no English fallback.
- [ ] **Step 5: Verify GREEN.**
- [ ] **Step 6: Commit** with `feat: add canonical english locale catalog`.

### Task 3: Migrate the complete public UI behind the English catalog

**Files:**
- Modify: `app/page.js`
- Modify: `app/components/SiteHeader.js`
- Modify: `app/components/HeroCommandCenter.js`
- Modify: `app/components/ReleaseConsole.js`
- Modify: `app/components/ProofMatrix.js`
- Modify: `app/components/WorkflowTimeline.js`
- Modify: `app/components/FindingsExplorer.js`
- Modify: `app/components/CoveragePanel.js`
- Modify: `app/components/EvidencePanel.js`
- Modify: `app/components/ScannerForm.js`
- Modify: `app/components/TrustMethodology.js`
- Modify: `app/components/InstallPanel.js`
- Modify: `app/components/PricingSection.js`
- Modify: `app/components/FaqSection.js`
- Modify: `app/privacy/page.js`
- Modify: `app/terms/page.js`
- Test: `test/i18n.test.js`
- Test: `test/product-v2-surface.test.js`

**Interfaces:**
- Server components receive a `copy` subtree or the page receives one immutable dictionary and passes explicit subtrees.
- `ScannerForm({ checkoutUrl, copy })` receives localized presentation copy while scan execution/result machine data stays unchanged.
- Technical values such as `RLS`, `PASS`, `FAIL`, `GitHub Actions`, commands, paths, status enums and sample IDs remain invariant data.

- [ ] **Step 1: Add a failing source-contract test** that detects known human-facing copy left hard-coded in migrated components and requires every component to consume explicit copy.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Refactor `app/page.js`** to load `getDictionary('en')` once and pass responsibility-specific copy to components.
- [ ] **Step 4: Refactor each server presentation component** to render from its copy subtree without changing DOM semantics, sample-data disclosure, accessibility hooks, or CSS classes.
- [ ] **Step 5: Refactor `ScannerForm` presentation strings only**; do not alter repository parsing, GitHub fetch, scanner normalization, severity, rule IDs, evidence, or checkout behavior.
- [ ] **Step 6: Refactor Privacy and Terms copy** to the legal catalog while preserving page URLs and meaning.
- [ ] **Step 7: Run product-surface and i18n tests** and verify GREEN.
- [ ] **Step 8: Commit** with `refactor: source public copy from english catalog`.

### Task 4: Add SEO/publication helpers and keep drafts invisible

**Files:**
- Create: `i18n/seo.js`
- Modify: `app/layout.js`
- Modify: `app/sitemap.js`
- Test: `test/i18n.test.js`

**Interfaces:**
- `buildPageMetadata({ locale, pathname, title, description, siteUrl }): object`
- `getAlternateLanguages(pathname, siteUrl): Record<string,string>` uses only published locales plus `x-default`.
- `getPublishedLocalizedUrls(pathname, siteUrl): string[]` uses only published locales.

- [ ] **Step 1: Add failing tests** proving drafts never appear in alternates/sitemap URL generation, English self-canonicalizes, and `x-default` points to English.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement SEO helpers** from registry + catalog metadata.
- [ ] **Step 4: Refactor root metadata and sitemap** to use the helpers while preserving `NEXT_PUBLIC_SITE_URL` and GitHub Pages behavior.
- [ ] **Step 5: Verify GREEN.**
- [ ] **Step 6: Commit** with `feat: gate locale seo publication`.

### Task 5: Add build-time locale gate

**Files:**
- Create: `scripts/validate-locales.js`
- Modify: `package.json`
- Test: `test/i18n.test.js`

**Interfaces:**
- `npm run i18n:check` exits 0 only when all published locale dictionaries are valid.
- `npm run build` invokes the validator via `prebuild`.

- [ ] **Step 1: Add a failing package-contract test** requiring `i18n:check` and `prebuild`.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement the CLI validator** and useful per-error output.
- [ ] **Step 4: Add package scripts** with no new dependency.
- [ ] **Step 5: Run `npm run i18n:check`, `npm test`, and `npm run build`.**
- [ ] **Step 6: Commit** with `ci: enforce locale completeness before build`.

### Task 6: Document the future publication workflow and implementation boundary

**Files:**
- Modify: `docs/superpowers/specs/2026-09-04-localization-foundation-design.md`
- Create: `docs/localization.md`

**Interfaces:** registry status is the sole publication switch after complete catalog + market/legal + responsive QA.

- [ ] **Step 1: Update design status** to implemented only after verification.
- [ ] **Step 2: Document locale codes/slugs, glossary rules, validator, legal/commercial review, SEO checks, responsive text-expansion QA, and no-fallback/no-partial-publication rules.**
- [ ] **Step 3: Review the branch diff** and confirm no draft locale route, language switcher, paid dependency, middleware, runtime translation, or scanner/security decision change exists.
- [ ] **Step 4: Run the full test/build suite again.**
- [ ] **Step 5: Commit** with `docs: document safe locale publication workflow`.

### Task 7: PR, exact-head CI, security review, and merge verification

**Files:** none beyond prior tasks.

- [ ] **Step 1: Open a PR** from `i18n-foundation-20260904` to `main` with architecture, migration boundary, and verification evidence.
- [ ] **Step 2: Verify exact PR-head CI** for tests, production build/static export, action-contract, and external-integration jobs.
- [ ] **Step 3: Review changed-file scope** for secrets, runtime dependency drift, hidden draft publication, unsafe HTML, or scanner/security logic changes.
- [ ] **Step 4: Merge only the exact green head.**
- [ ] **Step 5: Verify main CI and GitHub Pages deployment on the merge SHA.**
