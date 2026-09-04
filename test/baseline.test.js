import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateRegressionBaseline } from '../src/action/baseline.js';

function finding(id, severity = 'medium', overrides = {}) {
  return {
    id,
    engine: 'native',
    rule: `rule-${id}`,
    severity,
    title: `Finding ${id}`,
    path: 'app.js',
    line: 1,
    verification: 'unverified',
    ...overrides,
  };
}

function report(findings, overrides = {}) {
  return {
    schemaVersion: 1,
    scope: { mode: 'native-only', requestedEngines: ['native'] },
    coverage: {
      complete: true,
      capabilities: [{ engine: 'native', available: true, ok: true }],
    },
    findings,
    ...overrides,
  };
}

test('baseline evaluator emits inspectable new, escalated and resolved classifications without mutating inputs', () => {
  const baseline = report([
    finding('same', 'medium'),
    finding('escalated', 'medium'),
    finding('resolved', 'low'),
  ]);
  const current = report([
    finding('same', 'medium'),
    finding('escalated', 'high'),
    finding('new', 'high'),
  ]);
  const beforeBaseline = structuredClone(baseline);
  const beforeCurrent = structuredClone(current);

  const result = evaluateRegressionBaseline(baseline, current);

  assert.equal(result.gate, 'blocked');
  assert.equal(result.regressions, 2);
  assert.equal(result.resolvedFindings, 1);
  assert.equal(result.severityEscalations, 1);
  assert.deepEqual(result.regressionDetails, [
    { id: 'escalated', reason: 'severity-escalated', previousSeverity: 'medium', currentSeverity: 'high' },
    { id: 'new', reason: 'new' },
  ]);
  assert.deepEqual(result.resolvedFindingIds, ['resolved']);
  assert.deepEqual(baseline, beforeBaseline);
  assert.deepEqual(current, beforeCurrent);
});

test('stable fingerprints prevent line-only movement from becoming a regression', () => {
  const baseline = report([
    finding('old-line-id', 'high', { fingerprint: 'gfp_same', line: 12, rule: 'dangerous-eval' }),
  ]);
  const current = report([
    finding('new-line-id', 'high', { fingerprint: 'gfp_same', line: 47, rule: 'dangerous-eval' }),
  ]);

  const result = evaluateRegressionBaseline(baseline, current);

  assert.equal(result.gate, 'clear');
  assert.equal(result.regressions, 0);
  assert.equal(result.resolvedFindings, 0);
  assert.equal(result.acceptedExistingFindings, 1);
});

test('fingerprint matching is count-aware so an added duplicate occurrence is still new', () => {
  const baseline = report([
    finding('old', 'medium', { fingerprint: 'gfp_repeat', line: 10, rule: 'dangerous-eval' }),
  ]);
  const current = report([
    finding('moved', 'medium', { fingerprint: 'gfp_repeat', line: 20, rule: 'dangerous-eval' }),
    finding('added', 'high', { fingerprint: 'gfp_repeat', line: 30, rule: 'dangerous-eval' }),
  ]);

  const result = evaluateRegressionBaseline(baseline, current);

  assert.equal(result.gate, 'blocked');
  assert.equal(result.regressions, 1);
  assert.deepEqual(result.regressionDetails, [{ id: 'added', reason: 'new' }]);
  assert.equal(result.resolvedFindings, 0);
});

test('legacy baseline reports without fingerprints retain id-based compatibility', () => {
  const baseline = report([finding('legacy', 'medium')]);
  const current = report([finding('legacy', 'medium', { line: 99 })]);

  const result = evaluateRegressionBaseline(baseline, current);

  assert.equal(result.regressions, 0);
  assert.equal(result.resolvedFindings, 0);
});

test('baseline evaluator rejects verification reports and resolved historical findings', () => {
  assert.throws(
    () => evaluateRegressionBaseline(report([], { type: 'verification' }), report([])),
    /baseline.*verification report/i,
  );
  assert.throws(
    () => evaluateRegressionBaseline(report([finding('old', 'low', { verification: 'resolved' })]), report([])),
    /baseline.*resolved finding/i,
  );
});

test('baseline evaluator rejects ambiguous capability records', () => {
  const baseline = report([], {
    coverage: {
      complete: true,
      capabilities: [
        { engine: 'native', available: true, ok: true },
        { engine: 'native', available: true, ok: true },
      ],
    },
  });

  assert.throws(
    () => evaluateRegressionBaseline(baseline, report([])),
    /baseline.*duplicate capability/i,
  );
});
