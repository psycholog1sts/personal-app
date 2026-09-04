import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

import { scanProject } from '../src/scan.js';
import { readReport, renderReport, writeReport } from '../src/report.js';
import { verifyReport } from '../src/verify.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const vulnerable = path.join(here, 'fixtures', 'vulnerable');
const clean = path.join(here, 'fixtures', 'clean');
const cli = path.join(root, 'src', 'cli.js');

function runCli(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, ...args], {
      cwd: root,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('scanProject builds an explainable native-only report', async () => {
  const report = await scanProject(vulnerable, { nativeOnly: true });

  assert.equal(report.schemaVersion, 1);
  assert.equal(report.scope.mode, 'native-only');
  assert.equal(report.coverage.complete, true);
  assert.equal(report.findings.length, 4);
  assert.equal(report.readiness.score, 39);
  assert.equal(report.releaseGate, 'blocked');
});

test('human report exposes score and scope without secret material', async () => {
  const report = await scanProject(vulnerable, { nativeOnly: true });
  const rendered = renderReport(report);

  assert.match(rendered, /Readiness score: 39\/100/);
  assert.match(rendered, /Scope: native-only/);
  assert.equal(rendered.includes('FAKE_SERVICE_ROLE_VALUE_SHOULD_NEVER_LEAK'), false);
});

test('writeReport and readReport round-trip normalized JSON', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'guardian-report-'));
  const output = path.join(temp, 'report.json');
  const report = await scanProject(vulnerable, { nativeOnly: true });

  await writeReport(report, output);
  const loaded = await readReport(output);

  assert.equal(loaded.schemaVersion, 1);
  assert.deepEqual(loaded.findings.map((item) => item.id), report.findings.map((item) => item.id));
  assert.equal((await readFile(output, 'utf8')).includes('FAKE_SERVICE_ROLE_VALUE_SHOULD_NEVER_LEAK'), false);
});

test('verifyReport marks previous findings resolved when they disappear', async () => {
  const previous = await scanProject(vulnerable, { nativeOnly: true });
  const current = await scanProject(clean, { nativeOnly: true });
  const verification = verifyReport(previous, current);

  assert.equal(verification.resolvedCount, 4);
  assert.equal(verification.presentCount, 0);
  assert.equal(verification.newCount, 0);
  assert.equal(verification.findings.every((item) => item.verification === 'resolved'), true);
});

test('CLI scan/report/verify/sarif works end-to-end and does not leak fake secrets', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'guardian-cli-'));
  const output = path.join(temp, 'report.json');
  const sarifOutput = path.join(temp, 'report.sarif');

  const scan = await runCli(['scan', vulnerable, '--native-only', '--json', '--out', output]);
  assert.equal(scan.code, 0, scan.stderr);
  const scanJson = JSON.parse(scan.stdout);
  assert.equal(scanJson.readiness.score, 39);
  assert.equal(scan.stdout.includes('FAKE_SERVICE_ROLE_VALUE_SHOULD_NEVER_LEAK'), false);

  const report = await runCli(['report', output, '--json']);
  assert.equal(report.code, 0, report.stderr);
  assert.equal(JSON.parse(report.stdout).findings.length, 4);

  const verify = await runCli(['verify', output, clean, '--native-only', '--json']);
  assert.equal(verify.code, 0, verify.stderr);
  const verifyJson = JSON.parse(verify.stdout);
  assert.equal(verifyJson.resolvedCount, 4);
  assert.equal(verifyJson.presentCount, 0);

  const sarif = await runCli(['sarif', output, '--out', sarifOutput]);
  assert.equal(sarif.code, 0, sarif.stderr);
  const sarifJson = JSON.parse(sarif.stdout);
  assert.equal(sarifJson.version, '2.1.0');
  assert.equal(sarifJson.runs[0].results.length, 4);
  assert.deepEqual(JSON.parse(await readFile(sarifOutput, 'utf8')), sarifJson);
  assert.equal(sarif.stdout.includes('FAKE_SERVICE_ROLE_VALUE_SHOULD_NEVER_LEAK'), false);
});
