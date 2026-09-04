import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyReport } from '../src/verify.js';

function finding(id, fingerprint, line, severity = 'medium') {
  return {
    id,
    ...(fingerprint ? { fingerprint } : {}),
    engine: 'native',
    rule: 'dangerous-eval',
    severity,
    title: 'Dynamic code execution detected',
    path: 'src/app.js',
    line,
    evidence: 'redacted evidence',
    remediation: 'Remove eval.',
    verification: 'unverified',
  };
}

function report(findings) {
  return {
    schemaVersion: 1,
    target: '.',
    scope: { requestedEngines: ['native'] },
    coverage: { complete: true, capabilities: [{ engine: 'native', available: true, ok: true }] },
    readiness: { score: 90 },
    releaseGate: 'review',
    findings,
  };
}

test('verification follows a fingerprinted finding across line movement', () => {
  const previous = report([finding('old-id', 'gfp_same', 10)]);
  const current = report([finding('new-id', 'gfp_same', 40)]);

  const result = verifyReport(previous, current);

  assert.equal(result.resolvedCount, 0);
  assert.equal(result.presentCount, 1);
  assert.equal(result.newCount, 0);
  assert.equal(result.findings[0].verification, 'present');
});

test('verification is count-aware for duplicate fingerprints', () => {
  const previous = report([finding('old', 'gfp_repeat', 10)]);
  const current = report([
    finding('moved', 'gfp_repeat', 20),
    finding('added', 'gfp_repeat', 30),
  ]);

  const result = verifyReport(previous, current);

  assert.equal(result.presentCount, 1);
  assert.equal(result.resolvedCount, 0);
  assert.equal(result.newCount, 1);
  assert.equal(result.newFindings[0].id, 'added');
});

test('verification preserves exact-id compatibility with legacy reports that predate fingerprints', () => {
  const previous = report([finding('legacy', null, 10)]);
  const current = report([finding('legacy', 'gfp_new', 10)]);

  const result = verifyReport(previous, current);

  assert.equal(result.presentCount, 1);
  assert.equal(result.resolvedCount, 0);
  assert.equal(result.newCount, 0);
});
