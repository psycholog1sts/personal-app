# Premium Enterprise UI Design

## Goal
Transform the current product surface from a capable developer landing page into a premium, enterprise-grade security product experience that communicates recurring release-control value within seconds, while preserving the existing browser-only quick scan, GitHub Action release gate, static export, and Supabase DB-proof architecture.

## Non-negotiables
- Final product name and domain remain undecided; `RLSProof` stays an internal/staging codename only.
- No paid UI libraries, paid APIs, paid fonts, paid hosting, or unnecessary runtime dependencies.
- No fake customer logos, fabricated testimonials, invented usage metrics, or compliance claims.
- No claim of penetration testing, certification, or full coverage when only bounded checks ran.
- Preserve browser-only public-repository quick scan and static GitHub Pages deployment.
- Preserve accessibility, keyboard navigation, reduced-motion support, and responsive behavior.
- Do not weaken current security gates, external scanners, GitHub Action, or Supabase DB-proof behavior.

## Research-informed visual direction
Use 21st.dev as a pattern library, not as a finished product template. Recreate the useful ideas in original code:
- Conventional high-conversion hero structure inspired by Hero Section 9.
- Monochrome bento composition for capability explanation.
- One restrained spotlight treatment on featured dark cards; no React-state-per-frame animation.
- Dashboard/KPI card composition for product proof, not decorative mockups.
- Bento-style pricing/value comparison with clear plan boundaries.
- Terminal-inspired code snippets only where the command itself is useful and copyable.

Avoid WebGL, autoplay video, shader backgrounds, excessive glassmorphism, neon gradients, rotating words, and decorative motion that competes with trust or performance.

## Positioning
Primary message: continuous authorization proof for AI-built Supabase applications.

The product is not positioned as another generic vulnerability scanner. It combines mature commodity scanners with a differentiated workflow around:
1. PR/deploy release gating.
2. Supabase RLS and access-control proof.
3. Tenant A / tenant B negative controls.
4. Explicit coverage and skipped-test visibility.
5. Fix -> re-test -> release evidence.

## Information architecture
### 1. Header
- Compact sticky header.
- Codename wordmark without any visible “working name” badge.
- Navigation: Product, Proof, Pricing, FAQ.
- Primary CTA: Run free scan.
- Secondary text link: GitHub Action.

### 2. Hero
- Left: concise outcome-driven copy.
- Headline: “Ship Supabase changes with proof, not hope.”
- Subcopy explains cross-tenant leakage, PR/deploy gating, and verification.
- CTAs: Run free scan / See release proof.
- Right: realistic product console, not generic artwork.

### 3. Product console mockup
Show a single realistic release event with:
- PR number and commit SHA.
- Release gate state.
- Static scan status.
- DB proof state.
- Tenant-isolation matrix summary.
- Fix verification count.
- Coverage indicator.
- Activity timeline.

No metric is presented as a real customer metric; labels clearly indicate sample/demo state.

### 4. Proof strip
Use factual product properties instead of logos:
- Browser-only public scan.
- GitHub Action release gate.
- Supabase pgTAP DB proof.
- No source upload for quick scan.

### 5. Bento capability section
Four cards:
- PR release gate.
- Tenant isolation proof.
- Policy / schema drift signal.
- Fix and re-test verification.

One featured card can use a low-cost spotlight hover treatment. Remaining cards stay static.

### 6. Interactive scanner
Reframe the current scanner as “Quick assessment,” not the whole product.
- Clear public-repository constraint.
- Input + action at first glance.
- Loading state with progress copy.
- Result layout separates Risk, Coverage, Findings, and Next Action.
- Empty/clean result explicitly says bounded checks found no blocker, not “secure.”
- Findings remain normalized and redacted.

### 7. Release proof section
Display a readable access matrix with identity rows and SELECT/INSERT/UPDATE/DELETE columns.
- Strong DENY/ALLOW semantics.
- Coverage and commit context shown adjacent.
- “Skipped is not pass” callout retained.

### 8. Workflow section
Show the recurring loop:
Connect -> Prove -> Fix -> Re-test -> Gate.
This section explains retention: the product runs when code/database changes, not when a user remembers to visit.

### 9. Commercial section
Avoid cheap scanner positioning.
Use validation-oriented pricing:
- Quick Scan — $0.
- Launch Proof — $499 pilot: full scanner coverage, human-reviewed findings, DB-proof where in scope, and one verification pass.
- Fix + Verify — $990 pilot: includes scoped remediation of agreed critical/high findings and re-test.
- Continuous Guard — private beta only; do not sell or claim availability until private-repo/history/alerts exist.

Pricing is explicitly labeled pilot pricing and remains a hypothesis until real buyers validate it.

### 10. FAQ
Answer objections that affect conversion:
- What is actually checked?
- Does source code leave the browser?
- Is this a pentest or certification?
- Why use this if GitHub already scans dependencies/secrets?
- What does DB proof require?
- What happens when a test cannot run?

### 11. Footer
- Privacy, Terms, GitHub repository.
- Security-development-aid disclaimer.
- No final-brand/domain claim.

## Design system
### Color
- Neutral near-black background, not blue-black neon.
- Warm off-white primary text.
- Desaturated neutral secondary text.
- Green only for verified positive state.
- Amber only for incomplete/review state.
- Red only for blocked/high-risk state.
- One subtle cool accent for links/metadata if needed.

### Typography
- System font stack only for zero external requests and high performance.
- Large but disciplined hero type; no oversized novelty display text.
- Monospace only for commit hashes, paths, and command snippets.

### Surfaces
- Border-first hierarchy, low-opacity fills, restrained shadows.
- Radius 12-18px for product surfaces; avoid pill-shaped everything.
- Use whitespace and type hierarchy before decoration.

### Motion
- CSS-only hover/focus transitions.
- One optional spotlight interaction using CSS custom properties.
- Disable non-essential motion under `prefers-reduced-motion`.

## Technical architecture
Keep Next.js static export and plain CSS. Do not introduce Tailwind solely to reproduce 21st.dev components.

Component boundaries:
- `app/page.js`: composition and copy only.
- `app/components/ProductConsole.js`: sample release proof UI.
- `app/components/CapabilityBento.js`: product capability grid.
- `app/components/ScannerForm.js`: existing interactive quick scan, visually upgraded but behavior preserved.
- `app/components/PricingSection.js`: commercial value and pilot pricing.
- `app/components/FaqSection.js`: accessible details/summary FAQ.
- `app/globals.css`: design tokens, responsive layout, reduced motion, focus states.

## Conversion model
The page must answer, in order:
1. What painful failure is prevented?
2. Why is a generic scanner insufficient?
3. What proof does the product produce?
4. How does it fit into the release workflow?
5. Can I try something immediately?
6. What do I pay for beyond the free scan?

## Accessibility
- WCAG-conscious contrast for body copy and controls.
- Visible `:focus-visible` state on links, inputs, and buttons.
- Semantic headings in order.
- Table-like proof matrix includes accessible labels/roles.
- FAQ uses native `details`/`summary`.
- No hover-only critical information.
- Mobile layout preserves scanner usability without horizontal page scroll.

## Performance
- No new animation framework.
- No WebGL, video, or external hero media.
- No remote font requests.
- Keep client-side JS limited to the existing scanner and any tiny progressive-enhancement interaction.
- Static export remains mandatory in CI.

## SEO
Metadata should communicate continuous Supabase authorization proof rather than a generic free scanner. Structured copy must naturally include Supabase RLS, tenant isolation, GitHub Action, release gate, and AI-built apps without keyword stuffing.

## Success gates
- Existing unit/integration/security tests pass.
- New UI contract tests pass.
- Production static build succeeds and `out/` artifacts exist.
- External scanner integration remains GREEN.
- GitHub Action contract remains GREEN.
- No secret/source leakage regression.
- Responsive CSS includes mobile/tablet breakpoints.
- Reduced-motion and focus-visible rules are present.
- No final domain or final brand is committed.