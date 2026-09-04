# Localization Operations

RLSProof uses an English-first localization model designed to prevent partial or mixed-language releases.

## Published and draft locales

| Locale | URL slug | Status | Direction |
| --- | --- | --- | --- |
| `en` | root (`/`) | published | LTR |
| `ja` | `/ja/` | draft | LTR |
| `de` | `/de/` | draft | LTR |
| `pt-BR` | `/pt-br/` | draft | LTR |

Only locales marked `published` in `i18n/config.js` are eligible for public SEO metadata and sitemap output. A draft registry entry does not create a route, language switcher item, `hreflang` target, or sitemap URL.

## Source of truth

`i18n/dictionaries/en.js` is the canonical content schema. Public presentation components consume explicit dictionary subtrees rather than maintaining independent copies of product prose.

Technical identifiers remain invariant where translation would damage reproducibility or product semantics. Examples include `RLS`, `Supabase`, `PostgreSQL`, `GitHub Actions`, CLI flags, file paths, commit IDs, SQL operation names, machine status enums, and scanner rule/evidence data.

Terminology policy lives in `i18n/glossary.js`. Future translations must use that glossary so authorization concepts do not drift between pages.

## Hard quality gates

The validator rejects a published locale when any of the following occurs:

- a source key is missing;
- an unexpected stale key exists;
- a value has the wrong container or primitive type;
- a translated string is empty or whitespace-only;
- an interpolation token such as `{repo}` is missing, renamed, or added;
- an array changes its required length;
- a stable list item ID changes;
- an invariant `id`, `href`, or commercial price value changes;
- the locale registry contains invalid, duplicate, or incomplete metadata.

There is no production fallback from a missing localized key to English. A broken published catalog is a build failure.

Run the gates locally with:

```bash
npm run i18n:check
npm test
npm run build
```

`npm run build` invokes `npm run i18n:check` through `prebuild`, so production static export cannot bypass locale validation accidentally.

## Publishing a future language

A locale remains `draft` until every step below is complete:

1. Add a complete dictionary matching the English schema.
2. Run `npm run i18n:check` and resolve every structural error.
3. Review security terminology against `i18n/glossary.js`.
4. Review legal, privacy, pricing, refund/service-delivery, and commercial language for the target market. Mechanical translation alone is not market approval.
5. Run the full unit and integration suite.
6. Run the production static build.
7. Add the localized static route branch only when the locale is ready to publish, using build-time route enumeration compatible with Next.js static export.
8. Verify the rendered page has the correct `html lang`, self-referencing canonical URL, localized metadata, and alternate-language annotations.
9. Verify the sitemap exposes only real published equivalents.
10. Perform responsive visual QA at narrow mobile, tablet, and desktop widths. Check text expansion, wrapping, controls, tables, code blocks, and accessible labels.
11. Verify scanner behavior, PASS/FAIL semantics, DB-proof behavior, and GitHub Action contracts are unchanged.
12. Change that locale's registry status from `draft` to `published` only after all previous checks pass.
13. Merge only with exact-head CI green, then verify the Pages deployment on the merge SHA.

The registry status change is the publication switch. There is no hidden environment flag that can expose an incomplete locale.

## International SEO rules

Each published localized page must use its own URL and self-canonicalize. Equivalent published pages are connected with language alternates and an `x-default` pointing to the English equivalent. Draft locales are excluded from alternates and sitemap output.

The site does not automatically redirect by IP, geography, or browser language. Locale selection is explicit through URLs. English remains unprefixed at the root.

## Static export and performance

Localization is build-time/static-first. The foundation adds no runtime translation service, localization SaaS, middleware, cookie-based routing, remote dictionary fetch, or automatic language-detection JavaScript. Unpublished locale dictionaries are not required and are not shipped to users.

If future content requires complex plural/select grammar, evaluate ICU-message tooling at that time and preserve these publication gates. Do not add a runtime localization framework merely to expose an unfinished language.

## Currency and payment

Language and billing currency are independent. Publishing Japanese, German, or Brazilian Portuguese must not automatically create JPY, EUR, or BRL prices. A localized currency becomes valid only when the payment provider, tax treatment, refund terms, and commercial decision genuinely support charging that currency.

## Security boundary

Localization must never alter scanner/security decisions. Do not translate or mutate machine finding IDs, severity enums, rule IDs, repository paths, evidence payloads, `PASS`/`FAIL` decision semantics, or CI/DB-proof execution logic.

Dictionary strings are plain data. Do not render them through `dangerouslySetInnerHTML`, evaluate them as code, or load them from user-controlled remote URLs.
