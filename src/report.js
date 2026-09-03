import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

function assertReportShape(report) {
  if (!report || typeof report !== 'object' || report.schemaVersion !== 1 || !Array.isArray(report.findings)) {
    throw new TypeError('invalid Guardian report');
  }
  return report;
}

export async function writeReport(report, outputPath) {
  assertReportShape(report);
  if (typeof outputPath !== 'string' || outputPath.trim() === '') throw new TypeError('output path is required');

  const target = path.resolve(outputPath);
  await mkdir(path.dirname(target), { recursive: true });

  try {
    const stats = await lstat(target);
    if (stats.isSymbolicLink()) throw new Error(`Refusing to write report through symbolic link: ${target}`);
    if (!stats.isFile()) throw new Error(`Report output must be a file path: ${target}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const temp = `${target}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temp, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temp, target);
  } finally {
    await rm(temp, { force: true }).catch(() => {});
  }
  return target;
}

export async function readReport(inputPath) {
  if (typeof inputPath !== 'string' || inputPath.trim() === '') throw new TypeError('report path is required');
  const target = path.resolve(inputPath);
  const stats = await lstat(target);
  if (stats.isSymbolicLink()) throw new Error(`Refusing to read report through symbolic link: ${target}`);
  if (!stats.isFile()) throw new Error(`Report path must be a file: ${target}`);
  const parsed = JSON.parse(await readFile(target, 'utf8'));
  return assertReportShape(parsed);
}

export function renderReport(report) {
  assertReportShape(report);
  const lines = [
    'Guardian Production Readiness Report',
    `Target: ${report.target}`,
    `Scope: ${report.scope?.mode ?? 'unknown'}`,
    `Coverage complete: ${report.coverage?.complete === true ? 'yes' : 'no'}`,
    `Readiness score: ${report.readiness?.score ?? 'n/a'}/100`,
    `Release gate: ${report.releaseGate ?? 'unknown'}`,
    `Findings: ${report.findings.length}`,
  ];

  for (const finding of report.findings) {
    const location = finding.path ? `${finding.path}${finding.line ? `:${finding.line}` : ''}` : 'project';
    lines.push(`- [${String(finding.severity).toUpperCase()}] ${finding.title} (${location})`);
    if (finding.evidence) lines.push(`  Evidence: ${finding.evidence}`);
    lines.push(`  Fix: ${finding.remediation}`);
  }

  if (report.coverage?.complete !== true) {
    lines.push('Coverage warning: one or more requested engines were unavailable, failed, or not configured. This report is not a full PASS.');
  }

  return `${lines.join('\n')}\n`;
}
