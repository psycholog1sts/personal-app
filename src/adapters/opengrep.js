import { makeFinding } from '../core/finding.js';
import { runTool } from './process.js';

function mapSeverity(value) {
  const normalized = String(value ?? '').toUpperCase();
  if (normalized === 'CRITICAL') return 'critical';
  if (normalized === 'ERROR' || normalized === 'HIGH') return 'high';
  if (normalized === 'WARNING' || normalized === 'MEDIUM' || normalized === 'MODERATE') return 'medium';
  if (normalized === 'INFO' || normalized === 'LOW') return 'low';
  return 'medium';
}

export function parseOpengrepJson(raw) {
  const parsed = JSON.parse(raw || '{}');
  const findings = [];

  for (const result of parsed?.results ?? []) {
    const rule = String(result?.check_id ?? 'unknown-opengrep-rule');
    const message = String(result?.extra?.message ?? 'Static analysis finding');
    findings.push(makeFinding({
      engine: 'opengrep',
      rule,
      severity: mapSeverity(result?.extra?.severity),
      title: message,
      path: result?.path ? String(result.path) : null,
      line: Number.isInteger(result?.start?.line) ? result.start.line : null,
      evidence: message,
      remediation: 'Review the flagged code path, apply the rule-specific secure coding fix, and re-run RLSProof verification before release.',
    }));
  }

  return findings;
}

export async function scanWithOpengrep(root, options = {}) {
  if (!options.configPath) {
    return {
      findings: [],
      capability: { engine: 'opengrep', available: null, configured: false, reason: 'local-rule-config-required' },
    };
  }

  const result = await runTool(options.command ?? 'opengrep', [
    'scan',
    '--json',
    '--config', options.configPath,
    root,
  ], { cwd: root, timeoutMs: options.timeoutMs ?? 180_000 });

  if (result.missing) {
    return { findings: [], capability: { engine: 'opengrep', available: false, configured: true, reason: 'executable-not-found' } };
  }
  if (!result.ok) {
    return { findings: [], capability: { engine: 'opengrep', available: true, configured: true, ok: false, reason: result.stderr || `exit-${result.code}` } };
  }

  return { findings: parseOpengrepJson(result.stdout), capability: { engine: 'opengrep', available: true, configured: true, ok: true } };
}
