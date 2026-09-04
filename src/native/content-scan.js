import { makeFinding } from '../core/finding.js';

const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

function normalizePath(value) {
  return String(value ?? '').replaceAll('\\', '/').replace(/^\.\/+/, '');
}

function basename(filePath) {
  const normalized = normalizePath(filePath);
  return normalized.split('/').at(-1) ?? normalized;
}

function extension(filePath) {
  const name = basename(filePath);
  const index = name.lastIndexOf('.');
  return index <= 0 ? '' : name.slice(index).toLowerCase();
}

function lineNumberFor(text, index) {
  return text.slice(0, index).split('\n').length;
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

function scanCodeFile(filePath, text) {
  const findings = [];
  const serviceRoleMatch = findServiceRoleUsage(text);

  if (serviceRoleMatch) {
    findings.push(makeFinding({
      engine: 'native',
      rule: 'supabase-service-role-client',
      severity: 'critical',
      title: 'Supabase service-role credential identifier found in application code',
      path: filePath,
      line: lineNumberFor(text, serviceRoleMatch.index ?? 0),
      evidence: 'service-role credential usage detected; value intentionally omitted',
      remediation: 'Keep Supabase service-role credentials server-side only and rotate any credential that may have been exposed to client code.',
    }));
  }

  const evalPattern = /\beval\s*\(/g;
  for (const match of text.matchAll(evalPattern)) {
    const line = lineNumberFor(text, match.index ?? 0);
    const rawLine = text.split(/\r?\n/)[line - 1]?.trim() ?? '<dynamic-code-execution>';
    findings.push(makeFinding({
      engine: 'native',
      rule: 'dangerous-eval',
      severity: 'high',
      title: 'Dynamic code execution detected',
      path: filePath,
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

function scanSqlSecurityPatterns(filePath, text) {
  const findings = [];
  const policyPattern = /create\s+policy\b[\s\S]*?;/gi;

  for (const match of text.matchAll(policyPattern)) {
    const statement = match[0];
    const line = lineNumberFor(text, match.index ?? 0);

    if (/\bauth\.role\s*\(\s*\)/i.test(statement)) {
      findings.push(makeFinding({
        engine: 'native',
        rule: 'supabase-policy-deprecated-auth-role',
        severity: 'medium',
        title: 'RLS policy uses deprecated auth.role()',
        path: filePath,
        line,
        evidence: 'RLS policy calls deprecated auth.role(); policy text intentionally omitted',
        remediation: 'Target Postgres roles with the policy TO clause (for example TO authenticated or TO anon) and keep authorization predicates separate.',
      }));
    }

    if (/auth\.jwt\s*\(\s*\)[\s\S]*?(?:user_metadata|raw_user_meta_data)/i.test(statement)) {
      findings.push(makeFinding({
        engine: 'native',
        rule: 'supabase-policy-user-metadata-authorization',
        severity: 'high',
        title: 'RLS policy may trust user-editable metadata for authorization',
        path: filePath,
        line,
        evidence: 'RLS policy references user-editable JWT metadata; policy text intentionally omitted',
        remediation: 'Move authorization claims to trusted app_metadata/raw_app_meta_data or a protected table and authorize with server-controlled data.',
      }));
    }
  }

  const functionHeaderPattern = /create\s+(?:or\s+replace\s+)?function\s+(?:(?:"?([a-zA-Z0-9_]+)"?)\.)?"?([a-zA-Z0-9_]+)"?\s*\(/gi;
  const functionHeaders = [...text.matchAll(functionHeaderPattern)];
  for (let index = 0; index < functionHeaders.length; index += 1) {
    const match = functionHeaders[index];
    const schema = match[1]?.toLowerCase() ?? null;
    if (schema !== 'public') continue;

    const start = match.index ?? 0;
    const end = functionHeaders[index + 1]?.index ?? text.length;
    const definition = text.slice(start, end);
    const bodyMarker = /\bas\s+(?:\$[a-zA-Z0-9_]*\$|')/i.exec(definition);
    const properties = bodyMarker ? definition.slice(0, bodyMarker.index) : definition;
    if (!/\bsecurity\s+definer\b/i.test(properties)) continue;

    const functionName = match[2];
    findings.push(makeFinding({
      engine: 'native',
      rule: 'supabase-public-security-definer',
      severity: 'high',
      title: `SECURITY DEFINER function is created in exposed public schema: ${functionName}`,
      path: filePath,
      line: lineNumberFor(text, start),
      evidence: `public.${functionName} is declared SECURITY DEFINER`,
      remediation: 'Move privileged helper functions to an unexposed schema, set a safe search_path, and revoke EXECUTE from roles that do not require access.',
    }));
  }

  const publicViewPattern = /create\s+(?:or\s+replace\s+)?view\s+"?public"?\."?([a-zA-Z0-9_]+)"?[\s\S]*?;/gi;
  for (const match of text.matchAll(publicViewPattern)) {
    const statement = match[0];
    if (/security_invoker\s*=\s*true/i.test(statement)) continue;

    const viewName = match[1];
    findings.push(makeFinding({
      engine: 'native',
      rule: 'supabase-public-view-without-security-invoker',
      severity: 'high',
      title: `Public view may bypass underlying RLS policies: ${viewName}`,
      path: filePath,
      line: lineNumberFor(text, match.index ?? 0),
      evidence: `create view public.${viewName} detected without security_invoker = true`,
      remediation: 'On PostgreSQL 15+, set security_invoker = true so the caller\'s RLS applies; otherwise revoke anon/authenticated access or move the view to an unexposed schema.',
    }));
  }

  return findings;
}

function collectSqlState(sqlFiles) {
  const created = new Map();
  const rlsEnabled = new Set();

  for (const { path: filePath, text } of sqlFiles) {
    const createPattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?"?public"?\."?([a-zA-Z0-9_]+)"?/gi;
    for (const match of text.matchAll(createPattern)) {
      const table = normalizeTableName(match[1]);
      if (!created.has(table)) {
        created.set(table, {
          path: filePath,
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

export function scanVirtualFiles(files) {
  if (!Array.isArray(files)) throw new TypeError('files must be an array');

  const findings = [];
  const sqlFiles = [];

  for (const file of files) {
    if (!file || typeof file !== 'object') continue;
    const filePath = normalizePath(file.path);
    if (!filePath) continue;
    const text = typeof file.text === 'string' ? file.text : '';
    const name = basename(filePath);

    if (/^\.env(?:\..+)?$/i.test(name)) {
      findings.push(makeFinding({
        engine: 'native',
        rule: 'sensitive-env-file',
        severity: 'high',
        title: 'Secret-bearing environment file is present in the scanned tree',
        path: filePath,
        line: null,
        evidence: `${filePath} exists; file contents were not included in evidence`,
        remediation: 'Keep environment files out of version control, use a secret manager or deployment environment variables, and rotate any exposed credentials.',
      }));
    }

    const ext = extension(filePath);
    if (ext === '.sql') {
      sqlFiles.push({ path: filePath, text });
      findings.push(...scanSqlSecurityPatterns(filePath, text));
    } else if (CODE_EXTENSIONS.has(ext)) {
      findings.push(...scanCodeFile(filePath, text));
    }
  }

  const { created, rlsEnabled } = collectSqlState(sqlFiles);
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
