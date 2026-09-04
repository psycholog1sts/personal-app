#!/usr/bin/env node

import { appendFile } from 'node:fs/promises';
import { scanProject } from '../scan.js';
import { writeReport } from '../report.js';
import { redactEvidence } from '../core/redact.js';

function parseArgs(argv) {
  const options = {
    target: process.env.RLSPROOF_TARGET || '.',
    reportPath: process.env.RLSPROOF_REPORT_PATH || 'rlsproof-report.json',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target' || arg === '--report') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      if (arg === '--target') options.target = value;
      else options.reportPath = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown action option: ${arg}`);
  }

  return options;
}

async function appendGithubFile(filePath, text) {
  if (!filePath) return;
  await appendFile(filePath, text, { encoding: 'utf8' });
}

function summaryMarkdown(report, reportPath) {
  const gate = String(report.releaseGate ?? 'unknown').toUpperCase();
  const score = report.readiness?.score ?? 'n/a';
  const findings = Array.isArray(report.findings) ? report.findings.length : 0;
  const high = Array.isArray(report.findings)
    ? report.findings.filter((finding) => finding.severity === 'high' || finding.severity === 'critical').length
    : 0;

  return [
    '## RLSProof release gate',
    '',
    `- **Release gate:** ${gate}`,
    `- **Readiness score:** ${score}/100`,
    `- **Findings:** ${findings}`,
    `- **High/Critical:** ${high}`,
    `- **Report:** \`${reportPath}\``,
    '',
    report.coverage?.complete === true
      ? 'Requested coverage completed.'
      : 'Coverage is intentionally bounded in the default GitHub Action. Treat this as a deterministic release signal, not a penetration test.',
    '',
  ].join('\n');
}

async function writeOutputs(report, reportPath) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  const findings = Array.isArray(report.findings) ? report.findings.length : 0;
  await appendGithubFile(output, [
    `release-gate=${report.releaseGate ?? 'unknown'}`,
    `score=${report.readiness?.score ?? ''}`,
    `findings=${findings}`,
    `report-path=${reportPath}`,
    '',
  ].join('\n'));
}

export async function runAction(argv = process.argv.slice(2)) {
  const { target, reportPath } = parseArgs(argv);
  const report = await scanProject(target, { nativeOnly: true });
  await writeReport(report, reportPath);
  await writeOutputs(report, reportPath);
  await appendGithubFile(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown(report, reportPath));

  const gate = String(report.releaseGate ?? 'unknown');
  const score = report.readiness?.score ?? 'n/a';
  process.stdout.write(`RLSProof release gate: ${gate} (${score}/100)\n`);

  return {
    report,
    exitCode: gate === 'blocked' ? 2 : 0,
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
