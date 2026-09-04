const SARIF_SCHEMA = 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/cs01/schemas/sarif-schema-2.1.0.json';

function levelForSeverity(severity) {
  if (severity === 'critical' || severity === 'high') return 'error';
  if (severity === 'medium') return 'warning';
  return 'note';
}

function normalizeArtifactPath(value) {
  if (value == null || value === '') return null;
  const normalized = String(value).replaceAll('\\', '/').replace(/^\.\/+/, '');
  if (
    normalized.startsWith('/')
    || /^[A-Za-z]:\//.test(normalized)
    || normalized.split('/').some((segment) => segment === '..')
    || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(normalized)
  ) {
    throw new TypeError('SARIF artifact path must be relative to the repository and must not traverse outside it');
  }
  return normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function ruleIdFor(finding) {
  return `${finding.engine}/${finding.rule}`;
}

function validateReport(report) {
  if (!report || typeof report !== 'object' || report.schemaVersion !== 1 || !Array.isArray(report.findings)) {
    throw new TypeError('SARIF export requires an RLSProof schemaVersion 1 report');
  }
}

function makeRule(finding) {
  return {
    id: ruleIdFor(finding),
    name: String(finding.rule),
    shortDescription: { text: String(finding.title) },
    help: { text: String(finding.remediation) },
    properties: {
      tags: [String(finding.engine), 'security'],
      precision: 'medium',
    },
  };
}

function makeLocation(finding) {
  const uri = normalizeArtifactPath(finding.path);
  if (!uri) return null;

  const physicalLocation = {
    artifactLocation: {
      uri,
      uriBaseId: '%SRCROOT%',
    },
  };
  if (Number.isInteger(finding.line) && finding.line > 0) {
    physicalLocation.region = { startLine: finding.line };
  }
  return { physicalLocation };
}

export function buildSarif(report) {
  validateReport(report);

  const rules = [];
  const ruleIndexes = new Map();
  for (const finding of report.findings) {
    const ruleId = ruleIdFor(finding);
    if (ruleIndexes.has(ruleId)) continue;
    ruleIndexes.set(ruleId, rules.length);
    rules.push(makeRule(finding));
  }

  const results = report.findings.map((finding) => {
    const result = {
      ruleId: ruleIdFor(finding),
      ruleIndex: ruleIndexes.get(ruleIdFor(finding)),
      level: levelForSeverity(finding.severity),
      message: { text: String(finding.title) },
      partialFingerprints: {
        primaryLocationLineHash: String(finding.fingerprint ?? finding.id),
      },
      properties: {
        rlsproofFindingId: String(finding.id),
        rlsproofSeverity: String(finding.severity),
        rlsproofEngine: String(finding.engine),
      },
    };

    const location = makeLocation(finding);
    if (location) result.locations = [location];
    return result;
  });

  return {
    version: '2.1.0',
    $schema: SARIF_SCHEMA,
    runs: [
      {
        tool: {
          driver: {
            name: 'RLSProof',
            semanticVersion: '0.2.0',
            informationUri: 'https://github.com/psycholog1sts/personal-app',
            rules,
          },
        },
        results,
      },
    ],
  };
}
