const WEIGHTS = Object.freeze({
  critical: 25,
  high: 12,
  medium: 6,
  low: 2,
  info: 0,
});

export function scoreFindings(findings) {
  if (!Array.isArray(findings)) throw new TypeError('findings must be an array');

  const deductions = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };

  for (const finding of findings) {
    if (finding?.verification === 'resolved') continue;
    const weight = WEIGHTS[finding?.severity];
    if (weight === undefined) throw new TypeError(`invalid severity: ${finding?.severity}`);
    deductions[finding.severity] += weight;
    deductions.total += weight;
  }

  return {
    score: Math.max(0, 100 - deductions.total),
    deductions,
  };
}
