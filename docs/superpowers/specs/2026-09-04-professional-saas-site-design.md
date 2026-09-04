# Professional SaaS Site Design Specification

## Goal

Turn the current static RLSProof marketing site into a credible, human-designed developer-security SaaS site that is easy to understand, fast, accessible, search-friendly, conversion-focused, and truthful about current product maturity.

## Product position

RLSProof is a Supabase authorization release gate for developers shipping multi-tenant applications. The primary promise is evidence: detect RLS and tenant-isolation risks, expose coverage, block regressions, and re-test fixes before release. The site must not imply formal certification, guaranteed security, customer adoption, regulatory approval, or payment availability that does not exist.

## Audience and language

The primary published experience remains English because the target audience is global developers, technical founders, security engineers, and engineering leads. Turkish payment/legal content can be added only when the required real-world business/payment facts are available and reviewed. Draft ja/de/pt-BR content must remain unpublished until complete and validated.

## Visual direction

Use a premium security-infrastructure direction rather than a generic neon AI landing page. Keep a dark graphite foundation, but reduce decorative glow, card repetition, tiny text, and dense dashboard styling in marketing sections. Use emerald only for primary actions, positive status, and proof signals; use amber/coral only for warning/blocked states.

Recommended tokens:

- Canvas: `#070A0D`
- Raised surface: `#0D1218`
- Panel: `#10171F`
- Primary text: `#F4F7F5`
- Secondary text: `#9AA5A1`
- Hairline: `#202A30`
- Emerald accent: `#57E6A6`
- Emerald deep: `#173D30`
- Warning: `#F3C969`
- Critical: `#FF7A7A`

Use the existing system font stack; do not add remote fonts. Desktop hero text should scale fluidly around 48–64 px and mobile around 38–44 px. Body copy should normally remain 16–18 px with comfortable line-height. Content width should stay around 1200–1240 px, with 24–32 px desktop gutters and 18–20 px mobile gutters.

## 21st.dev usage rule

Use 21st.dev as a component and interaction reference, not as a template to clone. Borrow patterns only when they improve hierarchy, focus, data legibility, keyboard behavior, responsive behavior, or proof presentation. Do not add animation libraries, heavy client-side components, or decorative UI that harms Core Web Vitals.

## Information architecture

The homepage should follow this narrative:

1. Sticky, compact navigation with product name and clear anchors.
2. Editorial hero: one precise value proposition, one supporting paragraph, primary Quick Scan CTA, secondary evidence CTA, and one product-proof panel.
3. Proof strip explaining deterministic checks, explicit coverage, and browser-side Quick Scan privacy.
4. Tenant-isolation proof section showing the core User A/User B boundary problem in a readable matrix.
5. Workflow section explaining scan → review → fix → re-test → gate.
6. Findings/evidence section with one strong product artifact instead of multiple repetitive cards.
7. Live Quick Scan as the primary interactive acquisition surface, described in user-facing language only.
8. Methodology/trust section covering deterministic behavior, bounded scope, fail-closed incomplete coverage, and limitations.
9. Install/integration section with concise CLI/GitHub Action examples.
10. Pricing section with truthful current states: Quick Scan Free; Launch Verification $149 current validation price with payment activation pending when checkout is unavailable; Continuous Guard Private Beta with no fake subscription checkout.
11. FAQ for user questions only; no claim of FAQ rich-result eligibility.
12. Professional footer with product, resources, legal, repository, and current project status without internal strategy jargon.

## Public copy rules

Remove internal/prototype language such as `working name`, `Live acquisition surface`, `pricing hypotheses`, and similar strategy notes from public UI. Do not expose internal validation terminology when a user-facing alternative exists. Keep statements short, specific, and technically verifiable.

Preferred hero direction:

- Eyebrow: `Supabase authorization release gate`
- H1: `Prove your Supabase data boundaries before release.`
- Supporting copy: explain that RLSProof checks authorization risks, makes coverage explicit, and gives teams repeatable evidence before merging or deploying.
- Primary CTA: `Run a free Quick Scan`
- Secondary CTA: `See example release evidence`

The existing provocative question `Can User B access User A's data?` should remain as a supporting problem statement, not the main H1.

## SEO and Google requirements

Follow Google Search Central people-first guidance. Content must be readable, unique, useful, current, and written for the actual developer-security audience rather than keyword density. Do not add meta keywords, keyword stuffing, hidden text, doorway pages, mass-generated thin pages, or fake ratings/reviews.

Metadata must use concise, page-specific titles and descriptions. Canonical URLs, robots, and sitemap must remain environment-aware and correct for the production base path. Add truthful structured data only where supported by real facts; do not invent aggregate ratings or reviews to qualify for SoftwareApplication rich results.

Create durable, high-value informational pages only when they are based on actual RLSProof methodology, for example methodology/security and future technical guides. Do not create a blog solely for AdSense or SEO volume.

## Performance and Core Web Vitals

Keep the site static-first. Avoid new runtime dependencies unless there is a measurable user need. Prefer server components, semantic HTML, CSS, and tiny focused client components. No remote web fonts. Optimize for field thresholds of LCP <= 2.5 s, INP <= 200 ms, and CLS <= 0.1 at the 75th percentile, while targeting Lighthouse 95–100 in Performance/Accessibility/Best Practices and 100 SEO where technically feasible.

Do not promise permanent 100 scores because field data depends on device/network/user conditions.

## Accessibility

Provide semantic landmarks, one H1, logical heading order, visible `:focus-visible`, keyboard-safe navigation, 44 px touch targets, sufficient text contrast, non-color-only status communication, reduced-motion support, and `aria-live` behavior for asynchronous Quick Scan state/results. Prevent horizontal overflow at 320, 390, 768, and 1440 px viewports.

## Security and privacy

Preserve browser-only processing for Quick Scan and never embed GitHub/payment secrets. Preserve deterministic release-gate semantics and the rule that skipped/unavailable requested coverage is never represented as PASS. Do not weaken safe external scanner pinning/checksums, DB-proof safety, or secret redaction.

GitHub Pages limits configurable response headers. Do not claim a perfect external security-header score while hosted there. If later security-header requirements need HSTS/CSP/frame controls that GitHub Pages cannot provide, treat custom-domain/CDN hosting as a separate deployment architecture task rather than faking header support in HTML.

## Payment and trust presentation

Payment-provider approval is external. If no active checkout URL exists, paid CTA state must remain visibly unavailable with `Payment activation pending`. Do not fabricate company, tax, MERSIS, certification, testimonial, logo, customer count, or review data.

AdSense should not be placed on the SaaS conversion page. Policy readiness and ad monetization are separate goals; ads would currently weaken security-product trust and conversion focus.

## Acceptance criteria

The implementation is acceptable when:

- no internal strategy/prototype copy remains in public UI;
- hero and sections have clear visual hierarchy on desktop and mobile;
- existing Quick Scan and release-gate behavior is unchanged;
- mobile overflow tests pass at 320/390/768/1440 widths;
- production static build/export succeeds;
- CI and external integration contracts stay green;
- metadata/robots/sitemap remain valid for GitHub Pages base path;
- no fake trust/payment/legal claims are introduced;
- the site remains lightweight and does not add remote font or animation dependencies;
- Pages deployment succeeds and the live site is checked after merge.