#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { scanProject } from './scan.js';
import { readReport, renderReport, writeReport } from './report.js';
import { buildSarif } from './sarif.js';
import { verifyReport } from './verify.js';
import { redactEvidence } from './core/redact.js';

function usage() {
  return [
    'RLSProof - deterministic Supabase-focused production-readiness scanner',
    '',
    'Usage:',
    '  rlsproof scan <path> [--native-only|--full] [--opengrep-config <file>] [--json] [--out <file>]',
    '  rlsproof report <report-file> [--json]',
    '  rlsproof verify <report-file> <path> [--native-only|--full] [--opengrep-config <file>] [--json]',
    '  rlsproof sarif <report-file> [--out <file>]',
  ].join('\n');
}

function parseArgs(args) {
  const options = {
    json: false,
    nativeOnly: undefined,
    full: false,
    out: null,
    opengrepConfig: null,
  };
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--native-only') {
      if (options.full) throw new Error('Choose only one of --native-only or --full');
      options.nativeOnly = true;
      continue;
    }
    if (arg === '--full') {
      if (options.nativeOnly === true) throw new Error('Choose only one of --native-only or --full');
      options.full = true;
      options.nativeOnly = false;
      continue;
    }
    if (arg === '--out' || arg === '--opengrep-config') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      if (arg === '--out') options.out = value;
      else options.opengrepConfig = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    positionals.push(arg);
  }

  return { options, positionals };
}

function scanOptions(options) {
  return {
    nativeOnly: options.nativeOnly === false ? false : true,
    opengrepConfig: options.opengrepConfig ?? undefined,
  };
}

function renderVerification(result) {
  const lines = [
    'RLSProof Verification Report',
    `Resolved: ${result.resolvedCount}`,
    `Still present: ${result.presentCount}`,
    `New: ${result.newCount}`,
    `Current readiness score: ${result.readiness?.score ?? 'n/a'}/100`,
    `Current release gate: ${result.releaseGate ?? 'unknown'}`,
    `Coverage complete: ${result.coverage?.complete === true ? 'yes' : 'no'}`,
  ];
  if (result.coverage?.complete !== true) {
    lines.push('Coverage warning: verification is incomplete because one or more requested engines were unavailable, failed, or not configured.');
  }
  return `${lines.join('\n')}\n`;
}

async function runScan(args) {
  const { options, positionals } = parseArgs(args);
  if (positionals.length !== 1) throw new Error('scan requires exactly one project directory');

  const report = await scanProject(positionals[0], scanOptions(options));
  if (options.out) await writeReport(report, options.out);
  process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : renderReport(report));
}

async function runReport(args) {
  const { options, positionals } = parseArgs(args);
  if (options.out || options.opengrepConfig || options.full || options.nativeOnly !== undefined) {
    throw new Error('report only accepts --json');
  }
  if (positionals.length !== 1) throw new Error('report requires exactly one report file');

  const report = await readReport(positionals[0]);
  process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : renderReport(report));
}

async function runVerify(args) {
  const { options, positionals } = parseArgs(args);
  if (options.out) throw new Error('verify does not accept --out');
  if (positionals.length !== 2) throw new Error('verify requires a previous report file and a project directory');

  const previous = await readReport(positionals[0]);
  const current = await scanProject(positionals[1], scanOptions(options));
  const verification = verifyReport(previous, current);
  process.stdout.write(options.json ? `${JSON.stringify(verification, null, 2)}\n` : renderVerification(verification));
}

async function runSarif(args) {
  const { options, positionals } = parseArgs(args);
  if (options.json || options.opengrepConfig || options.full || options.nativeOnly !== undefined) {
    throw new Error('sarif accepts only an optional --out file');
  }
  if (positionals.length !== 1) throw new Error('sarif requires exactly one RLSProof report file');

  const report = await readReport(positionals[0]);
  const sarif = buildSarif(report);
  const serialized = `${JSON.stringify(sarif, null, 2)}\n`;
  if (options.out) await writeFile(options.out, serialized, 'utf8');
  process.stdout.write(serialized);
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (command === 'scan') return runScan(args);
  if (command === 'report') return runReport(args);
  if (command === 'verify') return runVerify(args);
  if (command === 'sarif') return runSarif(args);
  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    const message = redactEvidence(String(error?.message ?? error));
    process.stderr.write(`RLSProof error: ${message}\n`);
    process.exitCode = 1;
  });
}
