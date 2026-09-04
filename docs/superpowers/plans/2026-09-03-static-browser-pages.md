# RLSProof Static Browser + GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Publish RLSProof on zero-cost GitHub Pages while keeping the CLI and browser Quick Scan on one deterministic rule engine.

**Architecture:** Extract security rules into a pure virtual-file scanner, keep the local filesystem scanner as an adapter, add a browser GitHub REST adapter, switch the UI to that adapter, then statically export Next.js and deploy `out/` with GitHub Pages Actions.

**Tech Stack:** Node 22, Next.js 16.3.4, React 19.2.8, GitHub REST API, GitHub Actions/Pages.

**Spec:** `docs/superpowers/specs/2026-09-03-static-browser-pages-design.md`

## Global Constraints
- No paid hosting, domain, API, or LLM dependency.
- No secrets/tokens in client bundles.
- Public GitHub repositories only for free Quick Scan.
- Keep findings normalized and secret-safe.
- Preserve CLI/full-audit behavior and external scanner CI.
- Quick Scan remains partial and never a security certification.

---

### Task 1: Pure virtual-file scan core
**Files:**
- Create: `src/native/content-scan.js`
- Modify: `src/native/scan.js`
- Create/Test: `test/content-scan.test.js`

**Interface:** `scanVirtualFiles(files)` consumes `{ path, text }[]` and returns sorted normalized findings.

- [ ] Add a failing test proving `scanVirtualFiles` detects the same vulnerable rules, leaves hardened input clean, and never returns fake secret material.
- [ ] Run the test in CI and confirm the failure is caused only by the missing behavior.
- [ ] Move rule logic into `content-scan.js`; make `runNativeScan()` only collect/read files and delegate.
- [ ] Run full tests and verify existing filesystem/CLI behavior remains green.

### Task 2: Browser GitHub Quick Scan
**Files:**
- Create: `src/remote/browser-quick-scan.js`
- Create/Test: `test/browser-quick-scan.test.js`

**Interface:** `browserQuickScanGithubRepo(input, { fetchImpl? })` returns the existing Quick Scan report schema without Node APIs or tokens.

- [ ] Add a failing injected-fetch test for metadata → tree → blobs → findings/report.
- [ ] Verify RED with existing tests still green.
- [ ] Implement bounded unauthenticated GitHub REST fetch, base64 decode using browser APIs, and in-memory virtual files.
- [ ] Test rate-limit/error normalization and verify no `node:` imports exist in the browser module dependency path.
- [ ] Run full tests.

### Task 3: Static web UI
**Files:**
- Modify: `app/components/ScannerForm.js`
- Delete: `app/api/scan/route.js`
- Delete: `app/api/health/route.js`
- Modify/Delete: `test/web-api.test.js` as replaced by browser-module coverage
- Create: `next.config.mjs`
- Modify: `.env.example`

- [ ] Add source/contract tests proving the form no longer calls `/api/scan` and static configuration uses `output: 'export'` with Pages base path.
- [ ] Verify RED.
- [ ] Call `browserQuickScanGithubRepo` directly in the client form.
- [ ] Remove Node-only route handlers.
- [ ] Add static export configuration and public checkout environment naming without adding a payment secret.
- [ ] Run tests and `npm run build`; require `out/` generation.

### Task 4: Privacy, terms, SEO, branding
**Files:**
- Modify: `app/privacy/page.js`
- Modify: `app/terms/page.js` if required
- Modify: `app/layout.js`, `app/robots.js`, `app/sitemap.js` as required by Pages base URL
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`

- [ ] Update privacy text to state public source is fetched directly by the browser from GitHub and not sent to an RLSProof server.
- [ ] Ensure metadata/robots/sitemap resolve correctly for the Pages origin/base path.
- [ ] Rename user/operations-visible Guardian CI labels to RLSProof while retaining intentionally stable internal compatibility identifiers only where needed.
- [ ] Build and inspect static output paths.

### Task 5: GitHub Pages deployment
**Files:**
- Create: `.github/workflows/pages.yml`

- [ ] Resolve current official release SHAs for `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.
- [ ] Add least-privilege workflow permissions: `contents: read`, `pages: write`, `id-token: write`.
- [ ] Test/build static `out/`, upload artifact, deploy to the `github-pages` environment.
- [ ] Merge only after normal CI is green.
- [ ] Verify Pages run on exact `main` SHA and retrieve its public URL.
- [ ] If GitHub requires a one-time repository UI enablement that no connected write tool exposes, reduce that to one ELI5 user action after all code/deployment work is otherwise complete.

### Task 6: Runtime verification
- [ ] Verify public home/privacy/terms URLs return success.
- [ ] Verify built/static assets load under `/personal-app`.
- [ ] Verify browser Quick Scan logic via deterministic tests against GitHub-compatible responses and perform a real public GitHub API/CORS probe where tooling allows.
- [ ] Re-run main CI and external integration on final SHA.
- [ ] Do not claim release-ready until all available evidence is green; explicitly report any unavoidable account-level Pages enablement blocker.
