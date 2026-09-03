import { scoreFindings } from '../core/score.js';
import { scanVirtualFiles } from '../native/content-scan.js';
import { parseGitHubRepository, selectCandidateFiles } from './github.js';

const DEFAULT_LIMITS = Object.freeze({
  maxFiles: 18,
  maxFileBytes: 128 * 1024,
  maxTotalBytes: 1024 * 1024,
  maxTreeEntries: 5000,
  maxRepositoryKb: 50_000,
});

export class BrowserQuickScanError extends Error {
  constructor(message, statusCode = 400, code = 'quick_scan_error') {
    super(message);
    this.name = 'BrowserQuickScanError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function effectiveLimits(overrides = {}) {
  return { ...DEFAULT_LIMITS, ...overrides };
}

async function fetchJson(url, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { accept: 'application/vnd.github+json' },
      redirect: 'error',
    });
  } catch (error) {
    throw new BrowserQuickScanError(`GitHub request failed: ${error?.message ?? error}`, 502, 'github_unreachable');
  }

  if (response.status === 404) {
    throw new BrowserQuickScanError('GitHub repository or object was not found.', 404, 'github_not_found');
  }

  const remaining = response.headers?.get?.('x-ratelimit-remaining');
  if ((response.status === 403 || response.status === 429) && remaining === '0') {
    throw new BrowserQuickScanError('GitHub API rate limit reached. Try again later.', 429, 'github_rate_limited');
  }

  if (!response.ok) {
    throw new BrowserQuickScanError(`GitHub API returned HTTP ${response.status}.`, 502, 'github_api_error');
  }

  try {
    return await response.json();
  } catch {
    throw new BrowserQuickScanError('GitHub returned malformed JSON.', 502, 'github_invalid_json');
  }
}

function decodeBase64Utf8(value, filePath, limits, actualBytes) {
  if (typeof value !== 'string') {
    throw new BrowserQuickScanError(`Unsupported GitHub blob encoding for ${filePath}.`, 502, 'github_blob_encoding');
  }

  let binary;
  try {
    binary = atob(value.replace(/\s+/g, ''));
  } catch {
    throw new BrowserQuickScanError(`GitHub returned invalid base64 for ${filePath}.`, 502, 'github_blob_encoding');
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);

  if (bytes.length > limits.maxFileBytes) {
    throw new BrowserQuickScanError(`Repository file exceeded the quick-scan size limit: ${filePath}.`, 413, 'file_too_large');
  }
  if (actualBytes + bytes.length > limits.maxTotalBytes) {
    throw new BrowserQuickScanError('Repository content exceeded the quick-scan byte budget.', 413, 'scan_budget_exceeded');
  }

  return {
    text: new TextDecoder('utf-8', { fatal: false }).decode(bytes),
    bytes: bytes.length,
  };
}

function releaseGate(findings) {
  const unresolved = findings.filter((finding) => finding?.verification !== 'resolved');
  return unresolved.some((finding) => finding.severity === 'critical' || finding.severity === 'high')
    ? 'blocked'
    : 'incomplete';
}

export async function browserQuickScanGithubRepo(input, options = {}) {
  const { owner, repo } = parseGitHubRepository(input);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new BrowserQuickScanError('A Fetch-compatible implementation is required.', 500, 'fetch_unavailable');
  }

  const limits = effectiveLimits(options.limits);
  const repoApi = `https://api.github.com/repos/${owner}/${repo}`;
  const metadata = await fetchJson(repoApi, fetchImpl);

  if (metadata?.private === true) {
    throw new BrowserQuickScanError('Quick scan supports public GitHub repositories only.', 403, 'private_repository');
  }
  if (!metadata?.default_branch || typeof metadata.default_branch !== 'string') {
    throw new BrowserQuickScanError('GitHub repository has no readable default branch.', 422, 'missing_default_branch');
  }
  if (Number.isFinite(metadata.size) && metadata.size > limits.maxRepositoryKb) {
    throw new BrowserQuickScanError('Repository is too large for the free quick scan.', 413, 'repository_too_large');
  }

  const branch = metadata.default_branch;
  const tree = await fetchJson(`${repoApi}/git/trees/${encodeURIComponent(branch)}?recursive=1`, fetchImpl);
  if (tree?.truncated === true) {
    throw new BrowserQuickScanError('Repository tree is too large for a reliable quick scan.', 413, 'tree_truncated');
  }
  if (!Array.isArray(tree?.tree)) {
    throw new BrowserQuickScanError('GitHub repository tree was unavailable.', 502, 'tree_unavailable');
  }
  if (tree.tree.length > limits.maxTreeEntries) {
    throw new BrowserQuickScanError('Repository contains too many files for the free quick scan.', 413, 'too_many_tree_entries');
  }

  const selected = selectCandidateFiles(tree.tree, limits);
  const virtualFiles = [];
  let actualBytes = 0;

  for (const entry of selected.files) {
    if (typeof entry?.sha !== 'string' || !entry.sha) {
      throw new BrowserQuickScanError(`GitHub tree entry was missing a blob identifier: ${entry?.path ?? 'unknown'}.`, 502, 'github_blob_missing');
    }

    const blob = await fetchJson(`${repoApi}/git/blobs/${encodeURIComponent(entry.sha)}`, fetchImpl);
    if (blob?.encoding !== 'base64') {
      throw new BrowserQuickScanError(`Unsupported GitHub blob encoding for ${entry.path}.`, 502, 'github_blob_encoding');
    }

    const decoded = decodeBase64Utf8(blob.content, entry.path, limits, actualBytes);
    actualBytes += decoded.bytes;
    virtualFiles.push({ path: entry.path, text: decoded.text });
  }

  const findings = scanVirtualFiles(virtualFiles);
  const readiness = scoreFindings(findings);
  const canonicalUrl = `https://github.com/${owner}/${repo}`;

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    target: canonicalUrl,
    repository: {
      owner,
      name: repo,
      defaultBranch: branch,
      htmlUrl: metadata.html_url ?? canonicalUrl,
    },
    scope: {
      mode: 'remote-quick',
      requestedEngines: ['native'],
      filesScanned: virtualFiles.length,
      bytesScanned: actualBytes,
      selectionTruncated: selected.truncated,
    },
    coverage: {
      complete: false,
      reason: 'Free quick scan is intentionally limited to bounded native static checks; full Gitleaks, OSV-Scanner and Opengrep coverage requires a full audit.',
      capabilities: [{ engine: 'native', available: true, ok: true }],
      limits: {
        maxFiles: limits.maxFiles,
        maxFileBytes: limits.maxFileBytes,
        maxTotalBytes: limits.maxTotalBytes,
        maxTreeEntries: limits.maxTreeEntries,
        maxRepositoryKb: limits.maxRepositoryKb,
      },
    },
    readiness,
    releaseGate: releaseGate(findings),
    findings,
  };
}
