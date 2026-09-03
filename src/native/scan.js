import path from 'node:path';
import { lstat, readFile, readdir } from 'node:fs/promises';

import { makeFinding } from '../core/finding.js';
import { resolveScanTarget } from '../core/target.js';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', '.cache']);
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.sql']);
const MAX_FILE_BYTES = 1024 * 1024;

function toRelative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function lineNumberFor(text, index) {
  return text.slice(0, index).split('\n').length;
}

async function collectFiles(root) {
  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      files.push(fullPath);
    }
  }

  return files;
}

async function readSmallTextFile(filePath) {
  const stats = await lstat(filePath);
  if (stats.size > MAX_FILE_BYTES) return null;
  return readFile(filePath, 'utf8');
}

function findServiceRoleUsage(text) {
  const patterns = [
    /\b(?:const|let|var)\s+(?:SUPABASE_)?SERVICE_ROLE(?:_KEY)?\b\s*=/i,
    /\bprocess\.env\.(?:SUPABASE_)?SERVICE_ROLE(?:_KEY)?\b/i,
    /\bimport\.meta\.env\.(?:VITE_)?(?:SUPABASE_)?SERVICE_ROLE(?:_KEY)?\b/i,
    /\bDeno\.env\.get\(\s*['"](?:SUPABASE_)?SERVICE_ROLE(?:_KEY)?['"]\s*\)/i,
  ];

  let earliest = null;
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    if (!earliest || match.index < earliest.index) earliest = match;
  }
  return earliest;
}

function scanCodeFile(root, filePath, text) {
  const findings = [];
  const relative = toRelative(root, filePath);

  const serviceRoleMatch = findServiceRoleUsage(text);
  if (serviceRoleMatch) {
    findings.push(makeFinding({
      engine: 'native',
      rule: 'supabase-service-role-client',
      severity: 'critical',
      title: 'Supabase service-role credential identifier found in application code',
      path: relative,
      line: lineNumberFor(text, serviceRoleMatch.index ?? 0),
      evidence: 'service-role credential usage detected; value intentionally omitted',
      remediation: 'Keep Supabase service-role credentials server-side only and rotate any credential that may have been exposed to client code.',
    }));
  }

  const evalPattern = /\beval\s*\(/g;
  for (const match of text.matchAll(evalPattern)) {
    const line = lineNumberFor(text, match.index ?? 0);
    const rawLine = text.split(/\r?\n/)[line - 1]?.trim() ?? 'eval(...)';
    findings.push(makeFinding({
      engine: 'native',
      rule: 'dangerous-eval',
      severity: 'high',
      title: 'Dynamic code execution detected',
      path: relative,
      line,
      evidence: rawLine,
      remediation: 'Remove eval and use a constrained parser or explicit data transformation instead.',
    }));
  }

  return findings;
}

function normalizeTableName(name) {
  return name.replaceAll('"', '').toLowerCase();
}

function collectSqlState(root, sqlFiles) {
  const created = new Map();
  const rlsEnabled = new Set();

  for (const { filePath, text } of sqlFiles) {
    const relative = toRelative(root, filePath);
    const createPattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?"?public"?\."?([a-zA-Z0-9_]+)"?/gi;
    for (const match of text.matchAll(createPattern)) {
      const table = normalizeTableName(match[1]);
      if (!created.has(table)) {
        created.set(table, {
          path: relative,
          line: lineNumberFor(text, match.index ?? 0),
        });
      }
    }

    const rlsPattern = /alter\s+table\s+(?:if\s+exists\s+)?"?public"?\."?([a-zA-Z0-9_]+)"?\s+enable\s+row\s+level\s+security/gi;
    for (const match of text.matchAll(rlsPattern)) {
      rlsEnabled.add(normalizeTableName(match[1]));
    }
  }

  return { created, rlsEnabled };
}

export async function runNativeScan(inputRoot) {
  const root = await resolveScanTarget(inputRoot);
  const files = await collectFiles(root);
  const findings = [];
  const sqlFiles = [];

  for (const filePath of files) {
    const basename = path.basename(filePath);
    const relative = toRelative(root, filePath);

    if (/^\.env(?:\..+)?$/i.test(basename)) {
      findings.push(makeFinding({
        engine: 'native',
        rule: 'sensitive-env-file',
        severity: 'high',
        title: 'Secret-bearing environment file is present in the scanned tree',
        path: relative,
        line: null,
        evidence: `${relative} exists; file contents were not included in evidence`,
        remediation: 'Keep environment files out of version control, use a secret manager or deployment environment variables, and rotate any exposed credentials.',
      }));
    }

    const extension = path.extname(filePath).toLowerCase();
    if (!TEXT_EXTENSIONS.has(extension)) continue;

    let text;
    try {
      text = await readSmallTextFile(filePath);
    } catch {
      continue;
    }
    if (text === null) continue;

    if (extension === '.sql') {
      sqlFiles.push({ filePath, text });
    } else {
      findings.push(...scanCodeFile(root, filePath, text));
    }
  }

  const { created, rlsEnabled } = collectSqlState(root, sqlFiles);
  for (const [table, location] of created) {
    if (rlsEnabled.has(table)) continue;
    findings.push(makeFinding({
      engine: 'native',
      rule: 'supabase-public-table-without-rls',
      severity: 'high',
      title: `Public Supabase table may be created without Row Level Security: ${table}`,
      path: location.path,
      line: location.line,
      evidence: `create table public.${table} detected without a matching ENABLE ROW LEVEL SECURITY statement in scanned SQL migrations`,
      remediation: `Enable RLS for public.${table} and define least-privilege policies before exposing the table through the Supabase Data API.`,
    }));
  }

  return findings.sort((a, b) => a.id.localeCompare(b.id));
}
