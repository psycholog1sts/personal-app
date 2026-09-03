import test from 'node:test';
import assert from 'node:assert/strict';

import { makeFinding } from '../src/core/finding.js';
import { redactEvidence } from '../src/core/redact.js';
import { scoreFindings } from '../src/core/score.js';

test('makeFinding creates deterministic ids from identity fields', () => {
  const input = {
    engine: 'native',
    rule: 'dangerous-eval',
    severity: 'high',
    title: 'Dynamic code execution detected',
    path: 'src/app.js',
    line: 12,
    evidence: 'eval(userInput)',
    remediation: 'Remove eval and use a typed parser.',
  };

  const a = makeFinding(input);
  const b = makeFinding({ ...input, evidence: 'eval(otherInput)' });

  assert.equal(a.id, b.id);
  assert.match(a.id, /^gdn_[a-f0-9]{16}$/);
  assert.equal(a.verification, 'unverified');
});

test('redactEvidence masks assigned secrets without exposing the original value', () => {
  const secret = 'sk-test-THIS_IS_A_FAKE_SECRET_1234567890';
  const redacted = redactEvidence(`OPENAI_API_KEY=${secret}`);

  assert.equal(redacted.includes(secret), false);
  assert.match(redacted, /OPENAI_API_KEY=\[REDACTED\]/);
});

test('redactEvidence masks bearer tokens', () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.fake.payload.signature';
  const redacted = redactEvidence(`Authorization: Bearer ${token}`);

  assert.equal(redacted.includes(token), false);
  assert.match(redacted, /Bearer \[REDACTED\]/);
});

test('scoreFindings transparently deducts unresolved severity weights', () => {
  const findings = [
    makeFinding({ engine: 'native', rule: 'a', severity: 'critical', title: 'A', path: null, line: null, evidence: null, remediation: 'fix' }),
    makeFinding({ engine: 'native', rule: 'b', severity: 'high', title: 'B', path: null, line: null, evidence: null, remediation: 'fix' }),
    makeFinding({ engine: 'native', rule: 'c', severity: 'medium', title: 'C', path: null, line: null, evidence: null, remediation: 'fix' }),
    makeFinding({ engine: 'native', rule: 'd', severity: 'low', title: 'D', path: null, line: null, evidence: null, remediation: 'fix' }),
    { ...makeFinding({ engine: 'native', rule: 'e', severity: 'critical', title: 'E', path: null, line: null, evidence: null, remediation: 'fix' }), verification: 'resolved' },
  ];

  const result = scoreFindings(findings);

  assert.equal(result.score, 55);
  assert.deepEqual(result.deductions, {
    critical: 25,
    high: 12,
    medium: 6,
    low: 2,
    info: 0,
    total: 45,
  });
});
