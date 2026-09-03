import { resolveScanTarget } from './core/target.js';
import { scoreFindings } from './core/score.js';
import { redactEvidence } from './core/redact.js';
import { runNativeScan } from './native/scan.js';
import { scanWithGitleaks } from './adapters/gitleaks.js';
import { scanWithOsv } from './adapters/osv.js';
import { scanWithOpengrep } from './adapters/opengrep.js';

function sanitizeCapability(capability) {
  if (!capability || typeof capability !== 'object') return capability;
  const sanitized = { ...capability };
  if (sanitized.reason) sanitized.reason = redactEvidence(String(sanitized.reason));
  return sanitized;
}

async function safeAdapter(engine, fn) {
  try {
    const result = await fn();
    return {
      findings: Array.isArray(result?.findings) ? result.findings : [],
      capability: sanitizeCapability(result?.capability ?? { engine, available: true, ok: true }),
    };
  } catch (error) {
    return {
      findings: [],
      capability: {
        engine,
        available: null,
        ok: false,
        reason: redactEvidence(String(error?.message ?? error)),
      },
    };
  }
}

function determineReleaseGate(findings, coverageComplete) {
  const severities = new Set(findings.filter((item) => item.verification !== 'resolved').map((item) => item.severity));
  if (severities.has('critical') || severities.has('high')) return 'blocked';
  if (!coverageComplete) return 'incomplete';
  if (severities.has('medium') || severities.has('low')) return 'review';
  return 'clear';
}

export async function scanProject(inputRoot, options = {}) {
  const root = await resolveScanTarget(inputRoot);
  const nativeOnly = options.nativeOnly !== false;
  const nativeFindings = await runNativeScan(root);
  const capabilities = [{ engine: 'native', available: true, ok: true }];
  const findings = [...nativeFindings];

  if (!nativeOnly) {
    const [gitleaks, osv, opengrep] = await Promise.all([
      safeAdapter('gitleaks', () => scanWithGitleaks(root, options.gitleaks ?? {})),
      safeAdapter('osv-scanner', () => scanWithOsv(root, options.osv ?? {})),
      safeAdapter('opengrep', () => scanWithOpengrep(root, {
        ...(options.opengrep ?? {}),
        configPath: options.opengrepConfig ?? options.opengrep?.configPath,
      })),
    ]);

    for (const result of [gitleaks, osv, opengrep]) {
      findings.push(...result.findings);
      capabilities.push(result.capability);
    }
  }

  findings.sort((a, b) => a.id.localeCompare(b.id));
  const readiness = scoreFindings(findings);
  const coverageComplete = nativeOnly
    ? true
    : capabilities.slice(1).every((capability) => capability?.available === true && capability?.ok === true && capability?.configured !== false);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    target: root,
    scope: {
      mode: nativeOnly ? 'native-only' : 'full',
      requestedEngines: nativeOnly ? ['native'] : ['native', 'gitleaks', 'osv-scanner', 'opengrep'],
    },
    coverage: {
      complete: coverageComplete,
      capabilities,
    },
    readiness,
    releaseGate: determineReleaseGate(findings, coverageComplete),
    findings,
  };
}
