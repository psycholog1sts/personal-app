#!/usr/bin/env node

import { appendFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanProject } from '../scan.js';
import { readReport, writeReport } from '../report.js';
import { buildSarif } from '../sarif.js';
import { redactEvidence } from '../core/redact.js';
import { evaluateRegressionBaseline } from './baseline.js';
import { combineReleaseGate, evaluateDbProof } from './db-proof.js';

const SCAN_MODES = new Set(['native', 'full']);
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, '../..');

function samePath(left, right) {
  return Boolean(left && right && path.resolve(left) === path.resolve(right));
}

function parseArgs(argv) {
  const options = {
    target: process.env.RLSPROOF_TARGET || '.',
    reportPath: process.env.RLSPROOF_REPORT_PATH || 'rlsproof-report.json',
    sarifPath: process.env.RLSPROOF_SARIF_PATH || '',
    dbProofMode: process.env.RLSPROOF_DB_PROOF || 'off',
    scanMode: process.env.RLSPROOF_SCAN_MODE || 'native',
    baselineReport: process.env.RLSPROOF_BASELINE_REPORT || '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target' || arg === '--report' || arg === '--sarif' || arg === '--db-proof' || arg === '--scan-mode' || arg === '--baseline-report') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      if (arg === '--target') options.target = value;
      else if (arg === '--report') options.reportPath = value;
      else if (arg === '--sarif') options.sarifPath = value;
      else if (arg === '--db-proof') options.dbProofMode = value;
      else if (arg === '--scan-mode') options.scanMode = value;
      else options.baselineReport = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown action option: ${arg}`);
  }

  if (!SCAN_MODES.has(options.scanMode)) {
    throw new TypeError(`scan-mode must be one of: ${[...SCAN_MODES].join(', ')}`);
  }

  if (samePath(options.baselineReport, options.reportPath)) {
    throw new TypeError('baseline report path and report path must be different; RLSProof never overwrites the configured baseline');
  }
  if (samePath(options.sarifPath, options.reportPath)) {
    throw new TypeError('SARIF path and report path must be different so normalized and SARIF evidence cannot overwrite each other');
  }
  if (samePath(options.sarifPath, options.baselineReport)) {
    throw new TypeError('SARIF path and baseline report path must be different; RLSProof never overwrites the configured baseline');
  }

  return options;
}

async function appendGithubFile(filePath, text) {
  if (!filePath) return;
  await appendFile(filePath, text, { encoding: 'utf8' });
}

async function writeSarif(report, sarifPath) {
  if (!sarifPath) return;
  const sarif = buildSarif(report);
  await writeFile(sarifPath, `${JSON.stringify(sarif, null, 2)}\n`, 'utf8');
}

function summaryMarkdown(report, reportPath, sarifPath, scanMode, baselineResult) {
  const gate = String(report.releaseGate ?? 'unknown').toUpperCase();
  const score = report.readiness?.score ?? 'n/a';
  const findings = Array.isArray(report.findings) ? report.findings.length : 0;
  const high = Array.isArray(report.findings)
    ? report.findings.filter((finding) => finding.severity === 'high' || finding.severity === 'critical').length
    : 0;
  const dbProof = String(report.proof?.database?.status ?? 'off').toUpperCase();
  const staticCoverage = report.coverage?.complete === true ? 'COMPLETE' : 'INCOMPLETE';
  const baselineMode = baselineResult ? 'regression' : 'off';

  const lines = [
    '## RLSProof release gate',
    '',
    `- **Release gate:** ${gate}`,
    `- **Scan mode:** ${scanMode}`,
    `- **Static coverage:** ${staticCoverage}`,
    `- **Baseline mode:** ${baselineMode}`,
    `- **Readiness score:** ${score}/100`,
    `- **Findings:** ${findings}`,
    `- **High/Critical:** ${high}`,
  ];

  if (baselineResult) {
    lines.push(
      `- **Static regressions:** ${baselineResult.regressions}`,
      `- **Severity escalations:** ${baselineResult.severityEscalations}`,
      `- **Resolved baseline findings:** ${baselineResult.resolvedFindings}`,
      `- **Accepted existing findings:** ${baselineResult.acceptedExistingFindings}`,
    );
  }

  lines.push(`- **Database proof:** ${dbProof}`, `- **Report:** \`${reportPath}\``);
  if (sarifPath) lines.push(`- **SARIF:** \`${sarifPath}\``);
  lines.push('');

  if (scanMode === 'full' && report.coverage?.complete !== true) {
    lines.push('Full static coverage was requested but one or more external engines did not complete. This run fails closed and is never represented as PASS.');
  } else if (report.proof?.database?.mode !== 'off' && report.proof?.database?.complete !== true) {
    lines.push('Database proof coverage is incomplete. A skipped or unavailable DB proof is never represented as PASS.');
  } else if (baselineResult) {
    lines.push('Regression baseline mode gates only newly introduced or severity-escalated static findings. Accepted legacy findings remain visible in the report and readiness score; the baseline does not suppress DB proof or missing coverage.');
  } else if (report.coverage?.complete === true) {
    lines.push('Requested coverage completed.');
  } else {
    lines.push('Coverage is intentionally bounded in the default GitHub Action. Treat this as a deterministic release signal, not a penetration test.');
  }

  lines.push('');
  return lines.join('\n');
}

async function writeOutputs(report, reportPath, sarifPath, scanMode, baselineResult) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  const findings = Array.isArray(report.findings) ? report.findings.length : 0;
  await appendGithubFile(output, [
    `release-gate=${report.releaseGate ?? 'unknown'}`,
    `score=${report.readiness?.score ?? ''}`,
    `findings=${findings}`,
    `report-path=${reportPath}`,
    `sarif-path=${sarifPath}`,
    `db-proof=${report.proof?.database?.status ?? 'off'}`,
    `scan-mode=${scanMode}`,
    `coverage-complete=${report.coverage?.complete === true ? 'true' : 'false'}`,
    `baseline-mode=${baselineResult ? 'regression' : 'off'}`,
    `regressions=${baselineResult?.regressions ?? 0}`,
    `resolved-findings=${baselineResult?.resolvedFindings ?? 0}`,
    '',
  ].join('\n'));
}

function resolveOpengrepConfig() {
  const actionRoot = process.env.GITHUB_ACTION_PATH
    ? path.resolve(process.env.GITHUB_ACTION_PATH)
    : repositoryRoot;
  return path.join(actionRoot, 'config', 'opengrep.yml');
}

export async function runAction(argv = process.argv.slice(2)) {
  const { target, reportPath, sarifPath, dbProofMode, scanMode, baselineReport } = parseArgs(argv);
  const staticReport = await scanProject(target, scanMode === 'full'
    ? { nativeOnly: false, opengrepConfig: resolveOpengrepConfig() }
    : { nativeOnly: true });

  let baselineResult = null;
  if (baselineReport) {
    const baseline = await readReport(baselineReport);
    baselineResult = evaluateRegressionBaseline(baseline, staticReport);
  }

  const databaseProof = await evaluateDbProof({ mode: dbProofMode, target });
  const effectiveStaticGate = baselineResult?.gate ?? staticReport.releaseGate;
  const report = {
    ...staticReport,
    releaseGate: combineReleaseGate(effectiveStaticGate, databaseProof),
    ...(baselineResult ? {
      baseline: {
        mode: 'regression',
        absoluteStaticGate: staticReport.releaseGate,
        regressions: baselineResult.regressions,
        resolvedFindings: baselineResult.resolvedFindings,
        acceptedExistingFindings: baselineResult.acceptedExistingFindings,
        severityEscalations: baselineResult.severityEscalations,
        regressionDetails: baselineResult.regressionDetails,
        resolvedFindingIds: baselineResult.resolvedFindingIds,
      },
    } : {}),
    proof: {
      ...(staticReport.proof ?? {}),
      database: databaseProof,
    },
  };

  // Persist both evidence formats before applying the process exit semantics so
  // blocked/incomplete runs still leave inspectable artifacts for reviewers.
  await writeReport(report, reportPath);
  await writeSarif(report, sarifPath);
  await writeOutputs(report, reportPath, sarifPath, scanMode, baselineResult);
  await appendGithubFile(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown(report, reportPath, sarifPath, scanMode, baselineResult));

  const gate = String(report.releaseGate ?? 'unknown');
  const score = report.readiness?.score ?? 'n/a';
  const baselineMode = baselineResult ? 'regression' : 'off';
  process.stdout.write(`RLSProof release gate: ${gate} (${score}/100), scan-mode=${scanMode}, baseline-mode=${baselineMode}, db-proof=${databaseProof.status}\n`);

  return {
    report,
    exitCode: gate === 'blocked'
      ? 2
      : scanMode === 'full' && staticReport.coverage?.complete !== true
        ? 3
        : 0,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAction()
    .then(({ exitCode }) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      const message = redactEvidence(String(error?.message ?? error));
      process.stderr.write(`RLSProof action error: ${message}\n`);
      process.exitCode = 1;
    });
}
