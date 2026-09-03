import { redactEvidence } from './redact.js';
import { sha256Hex } from './sha256.js';

const SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);

export function makeFinding(input) {
  if (!input || typeof input !== 'object') throw new TypeError('finding input must be an object');
  if (!input.engine || !input.rule || !input.title || !input.remediation) {
    throw new TypeError('finding requires engine, rule, title, and remediation');
  }
  if (!SEVERITIES.has(input.severity)) throw new TypeError(`invalid severity: ${input.severity}`);

  const identity = [
    String(input.engine),
    String(input.rule),
    input.path ?? '',
    input.line ?? '',
    String(input.title),
  ].join('\u0000');

  const id = `gdn_${sha256Hex(identity).slice(0, 16)}`;

  return {
    id,
    engine: String(input.engine),
    rule: String(input.rule),
    severity: input.severity,
    title: String(input.title),
    path: input.path ?? null,
    line: Number.isInteger(input.line) ? input.line : null,
    evidence: redactEvidence(input.evidence),
    remediation: String(input.remediation),
    verification: input.verification ?? 'unverified',
  };
}
