# RLSProof Static Browser + GitHub Pages Design

## Goal
Publish RLSProof as a zero-cost static site while preserving the current bounded public-GitHub Quick Scan behavior and the same deterministic security rules used by the CLI.

## Constraints
- No paid hosting, domain, API, or LLM dependency.
- Free scan supports public GitHub repositories only.
- No GitHub token or secret may be shipped to the browser.
- Quick Scan remains explicitly partial and must not claim certification or deployment safety.
- Existing CLI/full-audit flow and external scanner CI must continue to work.
- One security-rule implementation must serve both filesystem and browser inputs to prevent drift.

## Architecture
### Pure native scan core
Extract the content inspection logic from `src/native/scan.js` into a browser-compatible module that accepts bounded virtual files shaped as `{ path, text }` and returns normalized findings. The existing filesystem scanner becomes an adapter that resolves/reads local files and passes them to the shared core.

### Browser Quick Scan
Add a browser-compatible remote scanner that reuses `parseGitHubRepository` and `selectCandidateFiles`, fetches public repository metadata/tree/blob JSON directly from `api.github.com`, decodes bounded base64 blobs in memory, and invokes the shared native scan core. It uses no token and therefore intentionally keeps the existing 18-file free limit. GitHub documents unauthenticated public REST requests as IP-bound with a 60 requests/hour primary limit and documents CORS support for AJAX requests from any origin.

### Static Next.js application
`ScannerForm` calls the browser Quick Scan directly rather than `/api/scan`. Remove Node route handlers that are incompatible with static export. Configure Next.js with `output: 'export'`; on GitHub Pages builds use `/personal-app` as `basePath`. Legal/privacy copy is updated to describe in-browser processing and GitHub network requests accurately.

### GitHub Pages deployment
Add a dedicated Pages workflow that tests, builds the static `out/` artifact, uploads it, and deploys it with Pages permissions. CI remains a separate quality gate and continues the checksum-verified Gitleaks, OSV-Scanner, and Opengrep integration test.

## Security model
- Public repository input remains strictly canonicalized to GitHub `owner/repo`.
- Browser fetches are restricted to URLs derived from validated GitHub repository metadata/tree entries; no arbitrary URL proxy exists.
- No private token is embedded in client bundles.
- Source contents stay in the user's browser memory and are not sent to an RLSProof application server.
- Findings continue to omit raw secrets/source payload fields.
- GitHub API quota/errors are surfaced as bounded user-facing errors.

## Error handling
Invalid repository input, missing/private repositories, truncated/oversized trees, file/total byte limits, malformed GitHub responses, unsupported blob encodings, and GitHub rate limiting use normalized Quick Scan errors. The UI preserves the previous safe generic error fallback.

## Testing
1. RED/GREEN test for virtual-file core parity with current vulnerable/clean findings.
2. RED/GREEN browser Quick Scan test using injected `fetch` and browser-compatible base64 decoding; no Node filesystem dependency.
3. Existing filesystem/CLI tests remain green, proving adapter parity.
4. Static Next.js production build must create `out/` successfully.
5. Existing external scanner integration remains green.
6. Pages workflow result and public site HTTP/runtime smoke checks are required before release-ready claims.

## Deployment acceptance
- Main CI: tests + production static build + external integration all green.
- Pages deploy workflow succeeds on the exact main SHA.
- Public home, privacy, and terms URLs return successful responses.
- Quick Scan behavior is covered by deterministic browser-module tests and GitHub REST/CORS assumptions are backed by current GitHub documentation.
