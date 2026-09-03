import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { makeFinding } from '../core/finding.js';
import { runTool } from './process.js';

export function parseGitleaksJson(raw) {
  const parsed = JSON.parse(raw || '[]');
  if (!Array.isArray(parsed)) throw new TypeError('Gitleaks JSON must be an array');

  return parsed.map((item) => {
    const rule = String(item?.RuleID || 'unknown-secret');
    const description = String(item?.Description || 'Potential secret detected');
    return makeFinding({
      engine: 'gitleaks',
      rule,
      severity: 'critical',
      title: description,
      path: item?.File ? String(item.File) : null,
      line: Number.isInteger(item?.StartLine) ? item.StartLine : null,
      evidence: `Potential secret detected by Gitleaks rule ${rule}; secret value omitted`,
      remediation: 'Remove the secret from source and history where applicable, rotate the exposed credential, and store credentials in a deployment secret manager.',
    });
  });
}

export async function scanWithGitleaks(root, options = {}) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'guardian-gitleaks-'));
  const reportPath = path.join(tempDir, 'report.json');
  try {
    const result = await runTool(options.command ?? 'gitleaks', [
      'dir',
      '--no-banner',
      '--no-color',
      '--redact=100',
      '--report-format=json',
      '--report-path', reportPath,
      '--exit-code=0',
      root,
    ], { cwd: root, timeoutMs: options.timeoutMs ?? 120_000 });

    if (result.missing) {
      return { findings: [], capability: { engine: 'gitleaks', available: false, reason: 'executable-not-found' } };
    }
    if (!result.ok) {
      return { findings: [], capability: { engine: 'gitleaks', available: true, ok: false, reason: result.stderr || `exit-${result.code}` } };
    }

    let raw = '[]';
    try {
      raw = await readFile(reportPath, 'utf8');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    return { findings: parseGitleaksJson(raw), capability: { engine: 'gitleaks', available: true, ok: true } };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
