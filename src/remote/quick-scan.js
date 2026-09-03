import os from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';

import { scoreFindings } from '../core/score.js';
import { runNativeScan } from '../native/scan.js';
import { parseGitHubRepository, selectCandidateFiles } from './github.js';

const DEFAULT_LIMITS = Object.freeze({
  maxFiles: 18,
  maxFileBytes: 128 * 1024,
  maxTotalBytes: 1024 * 1024,
  maxTreeEntries: 5000,
  maxRepositoryKb: 50_000,
});

export class QuickScanError extends Error {
  constructor(message, statusCode = 400, code = 'quick_scan_error') {
    super(message);
    this.name = 'QuickScanError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function effectiveLimits(overrides = {}, token) {
  return {
    ...DEFAULT_LIMITS,
    maxFiles: token ? 60 : DEFAULT_LIMITS.maxFiles,
    ...overrides,
  };
}

function headersFor(token) {
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'guardian-quick-scan/0.2',
    'x-github-api-version': '2022-11-28',
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

async function fetchJson(url, { fetchImpl, headers }) {
  let response;
  try {
    response = await fetchImpl(url, { headers, redirect: 'error' });
  } catch (error) {
    throw new QuickScanError(`GitHub request failed: ${error?.message ?? error}`, 502, 'github_unreachable');
  }

  if (response.status === 404) {
    throw new QuickScanError('GitHub repository or object was not found.', 404, 'github_not_found');
  }

  const remaining = response.headers.get('x-ratelimit-remaining');
  if ((response.status === 403 || response.status === 429) && remaining === '0') {
    throw new QuickScanError('GitHub API rate limit reached. Try again later.', 429, 'github_rate_limited');
  }

  if (!response.ok) {
    throw new QuickScanError(`GitHub API returned HTTP ${response.status}.`, 502, 'github_api_error');
  }

  try {
    return await response.json();
  } catch {
    throw new QuickScanError('GitHub returned malformed JSON.', 502, 'github_invalid_json');
  }
}

function safeDestination(root, repoPath) {
  const normalized = repoPath.replaceAll('\\', '/');
  const parts = normalized.split('/');
  if (
    normalized.startsWith('/')
    || parts.some((part) => !part || part === '.' || part === '..')
  ) {
    throw new QuickScanError('Repository contained an unsafe file path.', 400, 'unsafe_repository_path');
  }

  const destination = path.resolve(root, ...parts);
  const prefix = `${path.resolve(root)}${path.sep}`;
  if (!destination.startsWith(prefix)) {
    throw new QuickScanError('Repository file escaped the temporary scan directory.', 400, 'unsafe_repository_path');
  }
  return destination;
}

async function materializeFiles(root, files, context, limits) {
  let actualBytes = 0;
  let filesWritten = 0;

  for (const entry of files) {
    const blob = await fetchJson(entry.url, context);
    if (blob?.encoding !== 'base64' || typeof blob?.content !== 'string') {
      throw new QuickScanError(`Unsupported GitHub blob encoding for ${entry.path}.`, 502, 'github_blob_encoding');
    }

    const bytes = Buffer.from(blob.content.replace(/\s+/g, ''), 'base64');
    if (bytes.length > limits.maxFileBytes) {
      throw new QuickScanError(`Repository file exceeded the quick-scan size limit: ${entry.path}.`, 413, 'file_too_large');
    }
    if (actualBytes + bytes.length > limits.maxTotalBytes) {
      throw new QuickScanError('Repository content exceeded the quick-scan byte budget.', 413, 'scan_budget_exceeded');
    }

    const destination = safeDestination(root, entry.path);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes, { mode: 0o600 });
    actualBytes += bytes.length;
    filesWritten += 1;
  }

  return { actualBytes, filesWritten };
}

function releaseGate(findings) {
  const unresolved = findings.filter((finding) => finding?.verification !== 'resolved');
  return unresolved.some((finding) => finding.severity === 'critical' || finding.severity === 'high')
    ? 'blocked'
    : 'incomplete';
}

export async function quickScanGithubRepo(input, options = {}) {
  const { owner, repo } = parseGitHubRepository(input);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new QuickScanError('A Fetch-compatible implementation is required.', 500, 'fetch_unavailable');
  }

  const token = options.token ?? process.env.GITHUB_TOKEN ?? '';
  const limits = effectiveLimits(options.limits, token);
  const headers = headersFor(token);
  const context = { fetchImpl, headers };
  const repoApi = `https://api.github.com/repos/${owner}/${repo}`;

  const metadata = await fetchJson(repoApi, context);
  if (metadata?.private === true) {
    throw new QuickScanError('Quick scan supports public GitHub repositories only.', 403, 'private_repository');
  }
  if (!metadata?.default_branch || typeof metadata.default_branch !== 'string') {
    throw new QuickScanError('GitHub repository has no readable default branch.', 422, 'missing_default_branch');
  }
  if (Number.isFinite(metadata.size) && metadata.size > limits.maxRepositoryKb) {
    throw new QuickScanError('Repository is too large for the free quick scan.', 413, 'repository_too_large');
  }

  const branch = metadata.default_branch;
  const tree = await fetchJson(`${repoApi}/git/trees/${encodeURIComponent(branch)}?recursive=1`, context);
  if (tree?.truncated === true) {
    throw new QuickScanError('Repository tree is too large for a reliable quick scan.', 413, 'tree_truncated');
  }
  if (!Array.isArray(tree?.tree)) {
    throw new QuickScanError('GitHub repository tree was unavailable.', 502, 'tree_unavailable');
  }
  if (tree.tree.length > limits.maxTreeEntries) {
    throw new QuickScanError('Repository contains too many files for the free quick scan.', 413, 'too_many_tree_entries');
  }

  const selected = selectCandidateFiles(tree.tree, limits);
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'guardian-remote-'));

  try {
    const materialized = await materializeFiles(tempRoot, selected.files, context, limits);
    const findings = await runNativeScan(tempRoot);
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
        filesScanned: materialized.filesWritten,
        bytesScanned: materialized.actualBytes,
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
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}
