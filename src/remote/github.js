const SKIP_SEGMENTS = new Set([
  '.git',
  '.next',
  '.turbo',
  '.cache',
  'node_modules',
  'dist',
  'build',
  'coverage',
]);

const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.sql']);

function invalidRepository() {
  throw new TypeError('A valid GitHub repository is required (owner/repo or https://github.com/owner/repo).');
}

function validOwner(owner) {
  return typeof owner === 'string'
    && owner.length >= 1
    && owner.length <= 39
    && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(owner);
}

function validRepo(repo) {
  return typeof repo === 'string'
    && repo.length >= 1
    && repo.length <= 100
    && repo !== '.'
    && repo !== '..'
    && /^[A-Za-z0-9._-]+$/.test(repo);
}

export function parseGitHubRepository(input) {
  if (typeof input !== 'string') invalidRepository();
  const value = input.trim();
  if (!value) invalidRepository();

  let owner;
  let repo;

  if (value.includes('://')) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      invalidRepository();
    }

    if (
      parsed.protocol !== 'https:'
      || parsed.hostname.toLowerCase() !== 'github.com'
      || parsed.username
      || parsed.password
      || parsed.search
      || parsed.hash
    ) {
      invalidRepository();
    }

    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length !== 2) invalidRepository();
    [owner, repo] = parts;
  } else {
    const parts = value.split('/');
    if (parts.length !== 2 || parts.some((part) => !part)) invalidRepository();
    [owner, repo] = parts;
  }

  if (repo.endsWith('.git')) repo = repo.slice(0, -4);
  if (!validOwner(owner) || !validRepo(repo)) invalidRepository();

  return { owner, repo };
}

function extensionFor(repoPath) {
  const basename = repoPath.split('/').at(-1) ?? '';
  const dot = basename.lastIndexOf('.');
  return dot >= 0 ? basename.slice(dot).toLowerCase() : '';
}

function safeRepositoryPath(repoPath) {
  if (typeof repoPath !== 'string' || repoPath.length === 0 || repoPath.length > 1024) return false;
  if (repoPath.includes('\\') || repoPath.includes('\0') || repoPath.startsWith('/')) return false;
  const parts = repoPath.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) return false;
  if (parts.some((part) => SKIP_SEGMENTS.has(part))) return false;
  return true;
}

function candidate(entry, maxFileBytes) {
  if (!entry || entry.type !== 'blob' || entry.mode === '120000') return false;
  if (!safeRepositoryPath(entry.path)) return false;
  if (!Number.isFinite(entry.size) || entry.size < 0 || entry.size > maxFileBytes) return false;

  const basename = entry.path.split('/').at(-1) ?? '';
  if (/^\.env(?:\..+)?$/i.test(basename)) return true;
  return CODE_EXTENSIONS.has(extensionFor(entry.path));
}

export function selectCandidateFiles(tree, limits = {}) {
  const maxFiles = Number.isInteger(limits.maxFiles) && limits.maxFiles > 0 ? limits.maxFiles : 18;
  const maxFileBytes = Number.isInteger(limits.maxFileBytes) && limits.maxFileBytes > 0 ? limits.maxFileBytes : 128 * 1024;
  const maxTotalBytes = Number.isInteger(limits.maxTotalBytes) && limits.maxTotalBytes > 0 ? limits.maxTotalBytes : 1024 * 1024;

  const candidates = (Array.isArray(tree) ? tree : [])
    .filter((entry) => candidate(entry, maxFileBytes))
    .sort((a, b) => a.path.localeCompare(b.path));

  const files = [];
  let totalBytes = 0;
  let truncated = false;

  for (const entry of candidates) {
    if (files.length >= maxFiles || totalBytes + entry.size > maxTotalBytes) {
      truncated = true;
      continue;
    }
    files.push(entry);
    totalBytes += entry.size;
  }

  return { files, totalBytes, truncated };
}
