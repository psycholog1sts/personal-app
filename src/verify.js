function assertReport(report, label) {
  if (!report || typeof report !== 'object' || report.schemaVersion !== 1 || !Array.isArray(report.findings)) {
    throw new TypeError(`${label} must be a Guardian schemaVersion 1 report`);
  }
}

export function verifyReport(previousReport, currentReport) {
  assertReport(previousReport, 'previous report');
  assertReport(currentReport, 'current report');

  const currentById = new Map(currentReport.findings.map((finding) => [finding.id, finding]));
  const previousIds = new Set(previousReport.findings.map((finding) => finding.id));

  const findings = previousReport.findings.map((finding) => ({
    ...finding,
    verification: currentById.has(finding.id) ? 'present' : 'resolved',
  }));

  const newFindings = currentReport.findings
    .filter((finding) => !previousIds.has(finding.id))
    .map((finding) => ({ ...finding, verification: 'present' }));

  const resolvedCount = findings.filter((finding) => finding.verification === 'resolved').length;
  const presentCount = findings.filter((finding) => finding.verification === 'present').length;

  return {
    schemaVersion: 1,
    type: 'verification',
    verifiedAt: new Date().toISOString(),
    previousTarget: previousReport.target ?? null,
    currentTarget: currentReport.target ?? null,
    scope: currentReport.scope,
    coverage: currentReport.coverage,
    readiness: currentReport.readiness,
    releaseGate: currentReport.releaseGate,
    resolvedCount,
    presentCount,
    newCount: newFindings.length,
    findings,
    newFindings,
  };
}
