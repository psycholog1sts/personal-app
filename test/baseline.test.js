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
