import { matchFindingSets } from '../core/match-findings.js';

const SEVERITY_RANK = new Map([
  ['info', 0],
  ['low', 1],
  ['medium', 2],
  ['high', 3],
  ['critical', 4],
]);

function assertReportShape(report, label) {
  if (!report || typeof report !== 'object' || report.schemaVersion !== 1 || !Array.isArray(report.findings)) {
    throw new TypeError(`${label} must be an RLSProof schemaVersion 1 report`);
  }
  if (!report.scope || !Array.isArray(report.scope.requestedEngines) || report.scope.requestedEngines.length === 0) {
    throw new TypeError(`${label} must declare a non-empty static engine scope`);
  }
}

function validateFindingIds(findings, label, { rejectResolved = false } = {}) {
  const ids = new Set();
  for (const finding of findings) {
    if (!finding || typeof finding !== 'object') throw new TypeError(`${label} contains an invalid finding`);
    if (typeof finding.id !== 'string' || finding.id.trim() === '') {
      throw new TypeError(`${label} contains a finding without a stable id`);
    }
    if (ids.has(finding.id)) throw new TypeError(`${label} contains duplicate finding id: ${finding.id}`);
    ids.add(finding.id);
    if (finding.fingerprint != null && (typeof finding.fingerprint !== 'string' || finding.fingerprint.trim() === '')) {
      throw new TypeError(`${label} contains an invalid finding fingerprint`);
    }
    if (!SEVERITY_RANK.has(finding.severity)) {
      throw new TypeError(`${label} contains unsupported severity: ${finding.severity}`);
    }
    if (rejectResolved && finding.verification === 'resolved') {
      throw new TypeError(`${label} contains a resolved finding and cannot represent an accepted current-state snapshot`);
    }
  }
}

function normalizeEngines(report, label) {
  const engines = report.scope.requestedEngines;
  if (engines.some((engine) => typeof engine !== 'string' || engine.trim() === '')) {
    throw new TypeError(`${label} contains an invalid static engine scope`);
  }
  const unique = new Set(engines);
  if (unique.size !== engines.length) throw new TypeError(`${label} contains duplicate static engines`);
  return [...unique].sort();
}

function sameArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assertCompleteBaselineCoverage(report, engines) {
  if (report.coverage?.complete !== true) {
    throw new TypeError('baseline static coverage must be complete');
  }
  if (!Array.isArray(report.coverage?.capabilities)) {
    throw new TypeError('baseline capabilities must prove complete static coverage');
  }

  const capabilities = new Map();
  for (const capability of report.coverage.capabilities) {
    if (!capability || typeof capability.engine !== 'string' || capability.engine.trim() === '') {
      throw new TypeError('baseline contains an invalid capability record');
    }
    if (capabilities.has(capability.engine)) {
      throw new TypeError(`baseline contains duplicate capability for engine: ${capability.engine}`);
    }
    capabilities.set(capability.engine, capability);
  }

  const capabilityEngines = [...capabilities.keys()].sort();
  if (!sameArray(capabilityEngines, engines)) {
    throw new TypeError('baseline capabilities must match the declared static engine scope');
  }

  for (const engine of engines) {
    const capability = capabilities.get(engine);
    if (!capability || capability.available !== true || capability.ok !== true || capability.configured === false) {
      throw new TypeError(`baseline capability for ${engine} must prove complete coverage`);
    }
  }
}

function determineRegressionGate(regressions, coverageComplete) {
  const severities = new Set(regressions.map((finding) => finding.severity));
  if (severities.has('critical') || severities.has('high')) return 'blocked';
  if (coverageComplete !== true) return 'incomplete';
  if (severities.has('medium') || severities.has('low')) return 'review';
  return 'clear';
}

export function evaluateRegressionBaseline(baselineReport, currentReport) {
  assertReportShape(baselineReport, 'baseline report');
  assertReportShape(currentReport, 'current report');
  if (baselineReport.type === 'verification') {
    throw new TypeError('baseline report must be a scan snapshot, not a verification report');
  }
  validateFindingIds(baselineReport.findings, 'baseline report', { rejectResolved: true });
  validateFindingIds(currentReport.findings, 'current report');

  const baselineEngines = normalizeEngines(baselineReport, 'baseline report');
  const currentEngines = normalizeEngines(currentReport, 'current report');
  if (!sameArray(baselineEngines, currentEngines)) {
    throw new TypeError('baseline report must use the same static engine scope as the current scan');
  }
  assertCompleteBaselineCoverage(baselineReport, baselineEngines);

  const { pairs, unmatchedPrevious, unmatchedCurrent } = matchFindingSets(
    baselineReport.findings,
    currentReport.findings,
  );
  const unmatchedCurrentSet = new Set(unmatchedCurrent);
  const regressionFindings = [];
  const regressionDetails = [];

  for (const finding of currentReport.findings) {
    if (unmatchedCurrentSet.has(finding)) {
      regressionFindings.push(finding);
      regressionDetails.push({ id: finding.id, reason: 'new' });
      continue;
    }

    const previous = pairs.get(finding);
    if (previous && SEVERITY_RANK.get(finding.severity) > SEVERITY_RANK.get(previous.severity)) {
      regressionFindings.push(finding);
      regressionDetails.push({
        id: finding.id,
        reason: 'severity-escalated',
        previousSeverity: previous.severity,
        currentSeverity: finding.severity,
      });
    }
  }

  const resolvedFindingIds = unmatchedPrevious.map((finding) => finding.id);
  const severityEscalations = regressionDetails.filter((detail) => detail.reason === 'severity-escalated').length;

  return {
    mode: 'regression',
    gate: determineRegressionGate(regressionFindings, currentReport.coverage?.complete === true),
    regressions: regressionFindings.length,
    resolvedFindings: resolvedFindingIds.length,
    acceptedExistingFindings: currentReport.findings.length - regressionFindings.length,
    severityEscalations,
    regressionFindings,
    regressionDetails,
    resolvedFindingIds,
  };
}
