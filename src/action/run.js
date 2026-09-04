#!/usr/bin/env node

import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanProject } from '../scan.js';
import { writeReport } from '../report.js';
import { redactEvidence } from '../core/redact.js';
import { combineReleaseGate, evaluateDbProof } from './db-proof.js';

const SCAN_MODES = new Set(['native', 'full']);
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, '../..');

function parseArgs(argv) {
  const options = {
    target: process.env.RLSPROOF_TARGET || '.',
    reportPath: process.env.RLSPROOF_REPORT_PATH || 'rlsproof-report.json',
    dbProofMode: process.env.RLSPROOF_DB_PROOF || 'off',
    scanMode: process.env.RLSPROOF_SCAN_MODE || 'native',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target' || arg === '--report' || arg === '--db-proof' || arg === '--scan-mode') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      if (arg === '--target') options.target = value;
      else if (arg === '--report') options.reportPath = value;
      else if (arg === '--db-proof') options.dbProofMode = value;
      else options.scanMode = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown action option: ${arg}`);
  }

  if (!SCAN_MODES.has(options.scanMode)) {
    throw new TypeError(`scan-mode must be one of: ${[...SCAN_MODES].join(', ')}`);
  }

  return options;
}

async function appendGithubFile(filePath, text) {
  if (!filePath) return;
  await appendFile(filePath, text, { encoding: 'utf8' });
}

function summaryMarkdown(report, reportPath, scanMode) {
  const gate = String(report.releaseGate ?? 'unknown').toUpperCase();
  const score = report.readiness?.score ?? 'n/a';
  const findings = Array.isArray(report.findings) ? report.findings.length : 0;
  const high = Array.isArray(report.findings)
    ? report.findings.filter((finding) => finding.severity === 'high' || finding.severity === 'critical').length
    : 0;
  const dbProof = String(report.proof?.database?.status ?? 'off').toUpperCase();
  const staticCoverage = report.coverage?.complete === true ? 'COMPLETE' : 'INCOMPLETE';

  return [
    '## RLSProof release gate',
    '',
    `- **Release gate:** ${gate}`,
    `- **Scan mode:** ${scanMode}`,
    `- **Static coverage:** ${staticCoverage}`,
    `- **Readiness score:** ${score}/100`,
    `- **Findings:** ${findings}`,
    `- **High/Critical:** ${high}`,
    `- **Database proof:** ${dbProof}`,
    `- **Report:** \`${reportPath}\``,
    '',
    scanMode === 'full' && report.coverage?.complete !== true
      ? 'Full static coverage was requested but one or more external engines did not complete. This run fails closed and is never represented as PASS.'
      : report.proof?.database?.mode !== 'off' && report.proof?.database?.complete !== true
        ? 'Database proof coverage is incomplete. A skipped or unavailable DB proof is never represented as PASS.'
        : report.coverage?.complete === true
          ? 'Requested coverage completed.'
          : 'Coverage is intentionally bounded in the default GitHub Action. Treat this as a deterministic release signal, not a penetration test.',
    '',
  ].join('\n');
}

async function writeOutputs(report, reportPath, scanMode) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  const findings = Array.isArray(report.findings) ? report.findings.length : 0;
  await appendGithubFile(output, [
    `release-gate=${report.releaseGate ?? 'unknown'}`,
    `score=${report.readiness?.score ?? ''}`,
    `findings=${findings}`,
    `report-path=${reportPath}`,
    `db-proof=${report.proof?.database?.status ?? 'off'}`,
    `scan-mode=${scanMode}`,
    `coverage-complete=${report.coverage?.complete === true ? 'true' : 'false'}`,
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
  const { target, reportPath, dbProofMode, scanMode } = parseArgs(argv);
  const staticReport = await scanProject(target, scanMode === 'full'
    ? { nativeOnly: false, opengrepConfig: resolveOpengrepConfig() }
    : { nativeOnly: true });
  const databaseProof = await evaluateDbProof({ mode: dbProofMode, target });
  const report = {
    ...staticReport,
    releaseGate: combineReleaseGate(staticReport.releaseGate, databaseProof),
    proof: {
      ...(staticReport.proof ?? {}),
      database: databaseProof,
    },
  };

  await writeReport(report, reportPath);
  await writeOutputs(report, reportPath, scanMode);
  await appendGithubFile(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown(report, reportPath, scanMode));

  const gate = String(report.releaseGate ?? 'unknown');
  const score = report.readiness?.score ?? 'n/a';
  process.stdout.write(`RLSProof release gate: ${gate} (${score}/100), scan-mode=${scanMode}, db-proof=${databaseProof.status}\n`);

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
