import { makeFinding } from '../core/finding.js';
import { runTool } from './process.js';

function mapSeverity(value) {
  const normalized = String(value ?? '').toUpperCase();
  if (normalized === 'CRITICAL') return 'critical';
  if (normalized === 'HIGH') return 'high';
  if (normalized === 'MODERATE' || normalized === 'MEDIUM') return 'medium';
  if (normalized === 'LOW') return 'low';
  return 'high';
}

export function parseOsvJson(raw) {
  const parsed = JSON.parse(raw || '{}');
  const findings = [];

  for (const result of parsed?.results ?? []) {
    const sourcePath = result?.source?.path ? String(result.source.path) : null;
    for (const packageResult of result?.packages ?? []) {
      const pkg = packageResult?.package ?? {};
      const packageName = String(pkg.name ?? 'unknown-package');
      const version = String(pkg.version ?? 'unknown-version');
      for (const vulnerability of packageResult?.vulnerabilities ?? []) {
        const id = String(vulnerability?.id ?? 'unknown-vulnerability');
        findings.push(makeFinding({
          engine: 'osv-scanner',
          rule: id,
          severity: mapSeverity(vulnerability?.database_specific?.severity),
          title: vulnerability?.summary ? String(vulnerability.summary) : `Known dependency vulnerability: ${id}`,
          path: sourcePath,
          line: null,
          evidence: `${packageName}@${version} affected by ${id}`,
          remediation: `Upgrade ${packageName} to a non-vulnerable version supported by the advisory, then re-run dependency tests and Guardian verification.`,
        }));
      }
    }
  }

  return findings;
}

export async function scanWithOsv(root, options = {}) {
  const result = await runTool(options.command ?? 'osv-scanner', [
    'scan',
    '--format', 'json',
    '--allow-no-lockfiles',
    root,
  ], { cwd: root, timeoutMs: options.timeoutMs ?? 180_000 });

  if (result.missing) {
    return { findings: [], capability: { engine: 'osv-scanner', available: false, reason: 'executable-not-found' } };
  }
  if (!result.ok) {
    return { findings: [], capability: { engine: 'osv-scanner', available: true, ok: false, reason: result.stderr || `exit-${result.code}` } };
  }

  return { findings: parseOsvJson(result.stdout), capability: { engine: 'osv-scanner', available: true, ok: true } };
}
