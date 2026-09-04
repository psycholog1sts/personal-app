# Localization Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a strict English-first localization foundation that is safe for future Japanese, German, and Brazilian Portuguese publication without shipping partial translations or weakening static export, SEO, accessibility, or scanner semantics.

**Architecture:** Keep English at the root URL and treat it as the schema-defining source catalog. Add a small repository-owned i18n layer with a locale registry, strict dictionary validator, localized-path and SEO helpers, a terminology glossary, and CI/build gates. Do not publish non-English routes yet; draft locales exist only in registry metadata until complete catalogs and market/legal review are ready.

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
- `getLocalizedPath(localeCode, pathname): string`
- `validateDictionary(source, candidate, options?): { ok: boolean, errors: string[] }`
- `assertPublishedLocale(localeCode): locale`

- [ ] **Step 1: Write failing tests** for registry status, expected path generation, synthetic missing/extra/empty/type/placeholder failures, and no silent acceptance of unknown locales.
- [ ] **Step 2: Run `npm test -- --test-name-pattern=i18n`** and verify the new tests fail because the i18n modules do not exist.
- [ ] **Step 3: Implement the registry and helpers** with `en` published and `ja`, `de`, `pt-BR` draft; normalize source-locale paths to root and localized future paths to their registered slugs.
- [ ] **Step 4: Implement recursive validation** that enforces exact keys, container/primitive type equality, non-empty strings, and exact `{placeholder}` token sets.
- [ ] **Step 5: Run the i18n tests** and verify they pass.
- [ ] **Step 6: Commit** with `feat: add strict locale registry and validation`.

### Task 2: Add canonical English catalog and safe dictionary loader

**Files:**
- Create: `i18n/dictionaries/en.js`
- Create: `i18n/get-dictionary.js`
- Modify: `i18n/validate-locales.js`
- Test: `test/i18n.test.js`

**Interfaces:**
- `englishDictionary: object`
- `getDictionary(localeCode): object` throws unless locale is registered, published, and complete.
- `validatePublishedDictionaries(): { ok: boolean, errors: string[] }`

- [ ] **Step 1: Extend failing tests** so `getDictionary('en')` succeeds, `getDictionary('ja')` rejects while draft, unknown locales reject, and a published synthetic incomplete dictionary fails validation.
- [ ] **Step 2: Run targeted tests** and verify RED.
- [ ] **Step 3: Create the English catalog** grouped by `meta`, `nav`, `hero`, `scanner`, `pricing`, `faq`, `legal`, `footer`, and `a11y`, including the site-wide strings required by the current public routes.
- [ ] **Step 4: Implement a static dictionary map** with no runtime remote loading and no fallback behavior.
- [ ] **Step 5: Run targeted tests** and verify GREEN.
- [ ] **Step 6: Commit** with `feat: add canonical english locale catalog`.

### Task 3: Add SEO/publication helpers and keep drafts invisible

**Files:**
- Create: `i18n/seo.js`
- Modify: `app/layout.js`
- Modify: `app/sitemap.js`
- Test: `test/i18n.test.js`

**Interfaces:**
- `buildPageMetadata({ locale, pathname, title, description, siteUrl }): object`
- `getAlternateLanguages(pathname, siteUrl): Record<string,string>` using only published locales plus `x-default`.
- `getPublishedLocalizedUrls(pathname, siteUrl): string[]` using only published locales.

- [ ] **Step 1: Add failing tests** asserting draft locales never appear in alternates or sitemap URL generation, English self-canonicalizes, and `x-default` points to English.
- [ ] **Step 2: Run targeted tests** and verify RED.
- [ ] **Step 3: Implement SEO helpers** from the registry and source dictionary metadata.
- [ ] **Step 4: Refactor root metadata and sitemap** to consume those helpers while preserving current GitHub Pages base URL behavior.
- [ ] **Step 5: Run targeted tests** and verify GREEN.
- [ ] **Step 6: Commit** with `feat: gate locale seo publication`.

### Task 4: Add build-time locale gate and CI integration

**Files:**
- Create: `scripts/validate-locales.js`
- Modify: `package.json`
- Test: `test/i18n.test.js`

**Interfaces:**
- `npm run i18n:check` exits `0` only when every published locale dictionary is valid.
- `npm run build` invokes the validator through `prebuild`.

- [ ] **Step 1: Add a failing source-contract test** that requires `i18n:check` and `prebuild` to exist in `package.json`.
- [ ] **Step 2: Run the test** and verify RED.
- [ ] **Step 3: Implement `scripts/validate-locales.js`** so failures print each validation error and set non-zero exit status.
- [ ] **Step 4: Add `i18n:check` and `prebuild` scripts** without changing runtime dependencies.
- [ ] **Step 5: Run `npm run i18n:check`, `npm test`, and `npm run build`** and verify GREEN.
- [ ] **Step 6: Commit** with `ci: enforce locale completeness before build`.

### Task 5: Document publication workflow and review the implementation boundary

**Files:**
- Modify: `docs/superpowers/specs/2026-09-04-localization-foundation-design.md`
- Create: `docs/localization.md`

**Interfaces:**
- Documentation defines the exact future-locale publication sequence and states that registry status is the publication switch.

- [ ] **Step 1: Update the design status** to implemented after verification and remove the obsolete owner-review wording.
- [ ] **Step 2: Document locale codes, URL slugs, glossary discipline, validation command, legal/commercial review requirement, responsive visual QA, and the prohibition on partial publication/fallbacks.**
- [ ] **Step 3: Review the branch diff** and confirm scanner/security runtime files are untouched except presentation/metadata integration explicitly required by this plan.
- [ ] **Step 4: Run the full test/build suite again.**
- [ ] **Step 5: Commit** with `docs: document safe locale publication workflow`.

### Task 6: PR, exact-head CI, and merge verification

**Files:** none beyond prior tasks.

- [ ] **Step 1: Open a PR** from `i18n-foundation-20260904` to `main` with architecture, risk controls, and verification summary.
- [ ] **Step 2: Verify exact PR-head CI** for tests, production build/static export, action-contract, and external-integration jobs.
- [ ] **Step 3: Review changed-file scope** and confirm no draft dictionary, locale route, language switcher, paid dependency, middleware, runtime translation, or security-core change slipped in.
- [ ] **Step 4: Merge only the exact green head.**
- [ ] **Step 5: Verify main CI and Pages deployment on the merge SHA.**
