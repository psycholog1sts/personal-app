import test from 'node:test';
import assert from 'node:assert/strict';

import { makeFinding } from '../src/core/finding.js';
import { buildSarif } from '../src/sarif.js';

function reportWith(findings) {
  return {
    schemaVersion: 1,
    target: '.',
    scope: { requestedEngines: ['native'] },
    coverage: { complete: true, capabilities: [{ engine: 'native', available: true, ok: true }] },
    readiness: { score: 88 },
    releaseGate: 'review',
    findings,
  };
}

test('finding fingerprint is stable across line movement while occurrence id remains exact', () => {
  const base = {
    engine: 'native',
    rule: 'dangerous-eval',
    severity: 'high',
    title: 'Dynamic code execution detected',
    path: 'src/app.js',
    evidence: 'eval(userInput)',
    remediation: 'Remove eval.',
    fingerprintSource: 'eval(userInput)',
  };

  const first = makeFinding({ ...base, line: 12 });
  const moved = makeFinding({ ...base, line: 47 });

  assert.notEqual(first.id, moved.id, 'exact finding id should continue to distinguish the concrete occurrence');
  assert.equal(first.fingerprint, moved.fingerprint, 'stable fingerprint must not depend on absolute line number');
  assert.match(first.fingerprint, /^gfp_[a-f0-9]{32}$/);
});

test('SARIF 2.1.0 output preserves rule identity, severity, location and GitHub fingerprint', () => {
  const finding = makeFinding({
    engine: 'native',
    rule: 'dangerous-eval',
    severity: 'high',
    title: 'Dynamic code execution detected',
    path: 'src/app.js',
    line: 12,
    evidence: 'eval(userInput)',
    remediation: 'Remove eval.',
    fingerprintSource: 'eval(userInput)',
  });

  const sarif = buildSarif(reportWith([finding]));

  assert.equal(sarif.version, '2.1.0');
  assert.match(sarif.$schema, /sarif-schema-2\.1\.0\.json$/);
  assert.equal(sarif.runs.length, 1);
  assert.equal(sarif.runs[0].tool.driver.name, 'RLSProof');
  assert.equal(sarif.runs[0].results.length, 1);

  const result = sarif.runs[0].results[0];
  assert.equal(result.ruleId, 'native/dangerous-eval');
  assert.equal(result.level, 'error');
  assert.equal(result.message.text, 'Dynamic code execution detected');
  assert.equal(result.locations[0].physicalLocation.artifactLocation.uri, 'src/app.js');
  assert.equal(result.locations[0].physicalLocation.region.startLine, 12);
  assert.equal(result.partialFingerprints.primaryLocationLineHash, finding.fingerprint);
  assert.equal(JSON.stringify(sarif).includes('eval(userInput)'), false, 'SARIF must not reproduce finding evidence by default');
});

test('SARIF keeps locationless findings without inventing a source location', () => {
  const finding = makeFinding({
    engine: 'native',
    rule: 'sensitive-env-file',
    severity: 'medium',
    title: 'Environment configuration needs review',
    path: null,
    line: null,
    evidence: 'secret material omitted',
    remediation: 'Review configuration.',
    fingerprintSource: 'environment-configuration',
  });

  const result = buildSarif(reportWith([finding])).runs[0].results[0];

  assert.equal(result.level, 'warning');
  assert.equal('locations' in result, false);
  assert.equal(result.partialFingerprints.primaryLocationLineHash, finding.fingerprint);
});

test('SARIF rejects traversal-like artifact paths instead of emitting unsafe URIs', () => {
  const finding = makeFinding({
    engine: 'native',
    rule: 'example',
    severity: 'low',
    title: 'Example',
    path: '../outside.js',
    line: 1,
    evidence: null,
    remediation: 'Fix.',
    fingerprintSource: 'example',
  });

  assert.throws(() => buildSarif(reportWith([finding])), /artifact path.*relative.*repository/i);
});
