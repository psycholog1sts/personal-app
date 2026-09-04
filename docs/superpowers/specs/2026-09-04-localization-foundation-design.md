# Localization Foundation Design

Status: approved direction in chat; written design pending owner review before implementation.

## Goal

Build an English-first, localization-ready architecture for the static Next.js product site that can safely add high-value languages later without partial translations, mixed-language pages, broken metadata, silent English fallbacks, or accidental publication of unfinished locales.

English is the canonical source language and the only language published in the first implementation. Japanese, German, and Brazilian Portuguese are registered as future locales but remain unpublished until they pass the same strict content and build gates as English.

## Non-goals

- Do not publish Japanese, German, or Brazilian Portuguese in this implementation.
- Do not use browser or IP geolocation to redirect visitors automatically.
- Do not use runtime machine translation.
- Do not add a paid translation API or localization SaaS dependency.
- Do not localize prices into another currency unless the payment provider can actually charge that currency and the commercial terms have been approved.
- Do not change deterministic scanner/security decision logic.
- Do not change the final brand/domain decision; `RLSProof` remains a temporary working name.

## Locale strategy

Canonical source locale:

- `en` — English — published — no URL prefix.

Registered future locales:

- `ja` — Japanese — draft — `/ja/...` when published.
- `de` — German — draft — `/de/...` when published.
- `pt-BR` — Brazilian Portuguese — draft — `/pt-br/...` when published.

Each locale has separate machine-facing code and URL slug so BCP 47 metadata can use `pt-BR` while public paths remain normalized as `/pt-br/`.

The locale registry contains at least:

- `code`
- `slug`
- `status` (`published` or `draft`)
- `htmlLang`
- `ogLocale`
- `label`
- `dir`

Only `status: published` locales may participate in route generation, sitemap output, `hreflang`, canonical alternates, or the language switcher.

## Routing architecture

The site remains a static export hosted by GitHub Pages.

To ensure the `<html lang>` attribute is correct for every language, the implementation will use multiple App Router root-layout branches rather than a single hard-coded top-level `app/layout.js`.

Planned shape:

```text
app/
  (source)/
    layout.js
    page.js
    privacy/page.js
    terms/page.js
  (localized)/
    [locale]/
      layout.js
      page.js
      privacy/page.js
      terms/page.js
  components/
```

Route groups do not change public URLs.

English remains:

```text
/
/privacy
/terms
```

A published Japanese locale would become:

```text
/ja/
/ja/privacy
/ja/terms
```

The dynamic locale branch must export `generateStaticParams()` using only published non-source locales and must reject unspecified locale segments with `dynamicParams = false`. This preserves compatibility with static export and prevents unknown locale URLs from being generated on demand.

If the build proves that an empty non-source locale parameter set is not stable under the repository's exact Next.js configuration, the localized route branch will be created only when the first non-English locale is published. The content registry, validator, link helpers, metadata model, and CI gates are still implemented now. No workaround may leave an incorrect `html lang` value on future localized pages.

## Canonical content model

All user-visible product copy moves behind an explicit locale dictionary interface. English is the schema-defining dictionary.

Translatable content includes:

- page titles and descriptions
- navigation labels
- headings and body copy
- CTA labels
- form labels and instructions
- scanner UI errors and status messages
- accessibility labels and descriptions
- FAQ copy
- pricing labels/descriptions
- legal-page copy
- footer copy
- metadata and social-share copy

Technical identifiers that must not drift through translation remain invariant data rather than free-form translated text where practical, including:

- `RLS`
- `Supabase`
- `PostgreSQL`
- `GitHub Actions`
- CLI flags
- repository paths
- environment-variable names
- commit IDs
- machine status values

Display labels for statuses may be localized, while the underlying status enum remains stable.

## Dictionary structure

The source dictionary uses stable nested keys grouped by product surface rather than one flat file. Example responsibility groups:

```text
i18n/
  config.js
  get-dictionary.js
  get-localized-path.js
  validate-locales.js
  glossary.js
  dictionaries/
    en.js
```

Future complete dictionaries are added as:

```text
i18n/dictionaries/ja.js
i18n/dictionaries/de.js
i18n/dictionaries/pt-BR.js
```

Draft locale files are not required to exist. A locale cannot be marked published unless its dictionary exists and passes validation.

The dictionary groups mirror site responsibilities, for example:

```text
meta
nav
hero
proof
workflow
findings
coverage
evidence
scanner
methodology
install
pricing
faq
legal
footer
a11y
```

Components receive copy through explicit props or a page-level dictionary object. Presentation components must not reach into a global mutable translation store.

## No-fallback rule

There is no production fallback from a missing localized key to English.

`getDictionary(locale)` must:

1. verify that the locale is registered,
2. verify that the locale is published for public rendering,
3. load its dictionary,
4. throw on missing/invalid content.

A missing translation is a build failure, not an English fallback.

This is the core quality rule that prevents mixed-language pages.

## Strict locale validation

English defines the canonical schema.

For every published non-English locale, the validator must enforce:

- exact recursive key parity with English,
- matching primitive/container types,
- no missing keys,
- no unexpected stale keys,
- no empty or whitespace-only strings,
- matching interpolation-token sets such as `{repo}` or `{count}`,
- matching stable list item IDs where lists represent product concepts,
- locale is valid in the registry,
- required metadata fields exist,
- required legal and accessibility groups exist.

Arrays containing copy should use objects with stable IDs where possible so translators cannot silently reorder or drop semantic items.

The validator must return a non-zero process status on failure.

## Terminology discipline

`i18n/glossary.js` defines protected product/security terminology and translation policy.

The first version records at least:

- Row Level Security / RLS
- tenant isolation
- authorization
- release gate
- policy
- finding
- verification
- coverage
- re-test
- Supabase
- PostgreSQL
- GitHub Actions

The glossary distinguishes protected product names/initialisms from terms that may be translated. Future locale reviews must use this glossary so the same security concept is not translated differently across pages.

## Localized links

All internal site links used by localized surfaces go through one path helper.

Conceptual interface:

```js
getLocalizedPath(locale, '/pricing')
```

Expected behavior:

```text
en + /pricing    -> /pricing
ja + /pricing    -> /ja/pricing
pt-BR + /privacy -> /pt-br/privacy
```

The helper normalizes leading/trailing slashes and never accepts arbitrary unregistered locale slugs.

The language switcher is rendered only when at least two locales are published. It links to equivalent localized routes; it never changes language via client-side text replacement.

## SEO and international targeting

Each published page must have:

- a self-referencing canonical URL,
- localized title and description,
- localized Open Graph copy,
- correct `html lang`,
- alternate-language annotations for every published equivalent page,
- `x-default` pointing to the English equivalent,
- sitemap entries only for actually published locale URLs.

No draft locale appears in:

- HTML alternates,
- sitemap,
- navigation,
- language switcher,
- static output.

English remains the canonical source for content management, but localized pages self-canonicalize; they do not canonicalize to the English page.

The implementation follows Google's multilingual-site guidance: separate URLs, explicit language annotations, no automatic language redirects, and fully translated primary content.

## Static export constraints

The repository currently uses Next.js App Router with static export and GitHub Pages. Localization must preserve that deployment model.

Dynamic locale routes, when present, must use build-time parameters only. No request headers, cookies, geo-detection, server middleware, or runtime rewrite is allowed for locale selection.

The implementation must remain compatible with the current Next.js 16 static export rules.

## Scanner/UI localization boundary

The browser Quick Scan behavior and deterministic security output semantics remain unchanged.

Only human-facing scanner presentation text moves into the English dictionary, including:

- field labels
- helper text
- button text
- validation messages
- loading/status copy
- result explanations
- accessibility text

Machine finding IDs, severity enums, scanner rule IDs, file paths, technical evidence, and PASS/FAIL semantics remain stable data.

## Legal content rule

A locale cannot be published if any legal page exposed by the English site is missing from that locale.

Translation of legal/commercial terms must be reviewed as market-specific content before publication. A mechanical translation is not sufficient evidence that a locale is commercially ready.

Until such review exists, that locale remains draft and receives no public route.

## Pricing/currency rule

Language and billing currency are independent.

Publishing Japanese copy does not automatically create JPY pricing. Prices stay in the actually supported checkout currency until a payment provider, tax treatment, and commercial decision support another currency.

No client-side live exchange-rate conversion is introduced by the localization foundation.

## CI and test gates

No new paid service is required.

The existing Node test workflow will gain localization coverage. Required tests include:

1. Source dictionary validation passes.
2. Published locale registry contains English and no accidental draft locale.
3. A synthetic missing-key locale fails validation.
4. A synthetic extra-key locale fails validation.
5. Empty localized strings fail validation.
6. Placeholder-token mismatch fails validation.
7. `getDictionary()` never falls back silently.
8. `getLocalizedPath()` returns the expected English, Japanese, German, and Brazilian Portuguese path forms using registry metadata.
9. Only published locales are eligible for static routes, alternates, sitemap entries, and switcher items.
10. English root output retains `lang="en"` and English canonical metadata.
11. Production `next build` and static export remain green.
12. Existing scanner, action-contract, DB-proof, external-integration, and product-surface tests remain green.

A dedicated command will also be available for local/CI checks, conceptually:

```text
npm run i18n:check
```

The exact script will call the repository-owned validator and require no localization vendor.

## Publication workflow for a future locale

A future language is published only through an explicit reviewable change:

1. Add the complete dictionary.
2. Run locale validation.
3. Review terminology against the glossary.
4. Review legal/commercial content for that market.
5. Run unit tests.
6. Run production static build.
7. Inspect generated localized metadata, `html lang`, canonical, and `hreflang`.
8. Perform responsive visual QA for text expansion/wrapping.
9. Change registry status from `draft` to `published` only after all earlier steps pass.
10. Merge only with CI green.

The registry status change is the publication switch. There is no hidden environment toggle that can expose an incomplete locale.

## Performance and dependency constraints

- No runtime translation API.
- No paid localization service.
- Prefer no new runtime dependency; repository-owned locale utilities are sufficient for the current site size.
- Dictionaries are statically imported/build-time resolved where possible.
- No locale bundle for an unpublished language is shipped to users.
- No automatic locale-detection JavaScript is added.
- Existing static-first rendering strategy remains intact.

## Security constraints

- No locale mechanism may weaken scanner/security checks.
- Translation content is data, never executable HTML.
- Do not render translation strings through `dangerouslySetInnerHTML`.
- Do not fetch dictionaries from arbitrary remote URLs at runtime.
- Do not use user-controlled locale values without registry validation.
- Do not expose secrets or environment values in localized copy.

## Accessibility constraints

- `html lang` must match the rendered language.
- Future right-to-left locale support must use registry `dir`; no RTL language is published in the initial roadmap.
- Accessible names, labels, errors, and instructions are part of locale completeness validation.
- The language switcher, when enabled, uses language names and explicit links rather than flag-only controls.

## Acceptance criteria

The localization foundation is complete when:

1. English remains the only public locale and every visible product string in the supported public surface is sourced consistently through the localization model or explicitly classified as invariant technical data.
2. No missing-key production fallback to English exists.
3. Draft `ja`, `de`, and `pt-BR` locales are registered but produce no public pages or SEO annotations.
4. A strict validator proves that a locale cannot be published with missing, extra, empty, or placeholder-incompatible content.
5. Localized path generation, publication filtering, and metadata alternate generation are tested.
6. Static export remains green.
7. Existing deterministic scanner/action/DB-proof behavior remains unchanged.
8. The site does not automatically redirect users based on location or browser language.
9. Future locale publication requires an explicit reviewed registry change and complete dictionary.
10. The implementation introduces no paid dependency or runtime translation service.

## Reference constraints

The design is based on current official platform behavior:

- Google Search multilingual guidance: localized equivalents should use distinct URLs and explicit language annotations; incomplete translation of only navigation/boilerplate is not treated as a proper localized primary-content page.
- Next.js App Router: dynamic locale segments intended for static output must be enumerated at build time with `generateStaticParams()`; dynamic routes without build-time params are not supported by static export.
- Next.js metadata remains generated through the Metadata API and static files/routes already used by the repository.
