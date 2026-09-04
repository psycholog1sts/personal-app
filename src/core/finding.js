import { redactEvidence } from './redact.js';
import { sha256Hex } from './sha256.js';

const SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);

function normalizeFingerprintPath(value) {
  return String(value ?? '').replaceAll('\\', '/').replace(/^\.\/+/, '');
}

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
  const evidence = redactEvidence(input.evidence);
  const fingerprintSource = redactEvidence(
    input.fingerprintSource ?? evidence ?? input.title,
  ) ?? String(input.title);
  const fingerprintIdentity = [
    String(input.engine),
    String(input.rule),
    normalizeFingerprintPath(input.path),
    String(fingerprintSource),
  ].join('\u0000');
  const fingerprint = `gfp_${sha256Hex(fingerprintIdentity).slice(0, 32)}`;

  return {
    id,
    fingerprint,
    engine: String(input.engine),
    rule: String(input.rule),
    severity: input.severity,
    title: String(input.title),
    path: input.path ?? null,
    line: Number.isInteger(input.line) ? input.line : null,
    evidence,
    remediation: String(input.remediation),
    verification: input.verification ?? 'unverified',
  };
}
