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

function validateFindingIds(findings, label) {
  const ids = new Set();
  for (const finding of findings) {
    if (!finding || typeof finding !== 'object') throw new TypeError(`${label} contains an invalid finding`);
    if (typeof finding.id !== 'string' || finding.id.trim() === '') {
      throw new TypeError(`${label} contains a finding without a stable id`);
    }
    if (ids.has(finding.id)) throw new TypeError(`${label} contains duplicate finding id: ${finding.id}`);
    ids.add(finding.id);
    if (!SEVERITY_RANK.has(finding.severity)) {
      throw new TypeError(`${label} contains unsupported severity: ${finding.severity}`);
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

function assertCompleteBaselineCoverage(report, engines) {
  if (report.coverage?.complete !== true) {
    throw new TypeError('baseline static coverage must be complete');
  }
  if (!Array.isArray(report.coverage?.capabilities)) {
    throw new TypeError('baseline capabilities must prove complete static coverage');
  }

  const capabilities = new Map();
  for (const capability of report.coverage.capabilities) {
    if (!capability || typeof capability.engine !== 'string') continue;
    capabilities.set(capability.engine, capability);
  }

  for (const engine of engines) {
    const capability = capabilities.get(engine);
    if (!capability || capability.available !== true || capability.ok !== true || capability.configured === false) {
      throw new TypeError(`baseline capability for ${engine} must prove complete coverage`);
    }
  }
}

function sameArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
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
  validateFindingIds(baselineReport.findings, 'baseline report');
  validateFindingIds(currentReport.findings, 'current report');

  const baselineEngines = normalizeEngines(baselineReport, 'baseline report');
  const currentEngines = normalizeEngines(currentReport, 'current report');

  if (!sameArray(baselineEngines, currentEngines)) {
    throw new TypeError('baseline report must use the same static engine scope as the current scan');
  }

  assertCompleteBaselineCoverage(baselineReport, baselineEngines);

  const baselineById = new Map(baselineReport.findings.map((finding) => [finding.id, finding]));
  const currentById = new Map(currentReport.findings.map((finding) => [finding.id, finding]));
  const regressionFindings = [];
  let severityEscalations = 0;

  for (const finding of currentReport.findings) {
    const previous = baselineById.get(finding.id);
    if (!previous) {
      regressionFindings.push(finding);
      continue;
    }
    if (SEVERITY_RANK.get(finding.severity) > SEVERITY_RANK.get(previous.severity)) {
      regressionFindings.push(finding);
      severityEscalations += 1;
    }
  }

  const resolvedFindings = baselineReport.findings.filter((finding) => !currentById.has(finding.id));

  return {
    mode: 'regression',
    gate: determineRegressionGate(regressionFindings, currentReport.coverage?.complete === true),
    regressions: regressionFindings.length,
    resolvedFindings: resolvedFindings.length,
    acceptedExistingFindings: currentReport.findings.length - regressionFindings.length,
    severityEscalations,
    regressionFindings,
  };
}
