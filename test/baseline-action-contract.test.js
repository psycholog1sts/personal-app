import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url);

function runAction(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['src/action/run.js', ...args], {
      cwd: root,
      env: { ...process.env, ...env },
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

test('baseline mode never weakens required DB proof', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-baseline-db-'));
  const baseline = path.join(dir, 'baseline.json');
  try {
    const seed = await runAction(['--target', 'test/fixtures/vulnerable', '--report', baseline]);
    assert.equal(seed.code, 2, seed.stderr || seed.stdout);

    const result = await runAction([
      '--target', 'test/fixtures/vulnerable',
      '--baseline-report', baseline,
      '--db-proof', 'required',
    ]);

    assert.equal(result.code, 2, result.stderr || result.stdout);
    assert.match(result.stdout, /db-proof=missing-tests/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('baseline report cannot also be the action output path', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-baseline-overwrite-'));
  const baseline = path.join(dir, 'baseline.json');
  try {
    const seed = await runAction(['--target', 'test/fixtures/clean', '--report', baseline]);
    assert.equal(seed.code, 0, seed.stderr || seed.stdout);

    const before = await readFile(baseline, 'utf8');
    const result = await runAction([
      '--target', 'test/fixtures/clean',
      '--baseline-report', baseline,
      '--report', baseline,
    ]);
    const after = await readFile(baseline, 'utf8');

    assert.equal(result.code, 1);
    assert.match(result.stderr, /baseline.*report path.*different/i);
    assert.equal(after, before, 'baseline must not be overwritten by a configured output path');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('baseline consistency check rejects a claimed-complete report with a failed capability', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-baseline-capability-'));
  const baseline = path.join(dir, 'baseline.json');
  try {
    const seed = await runAction(['--target', 'test/fixtures/clean', '--report', baseline]);
    assert.equal(seed.code, 0, seed.stderr || seed.stdout);
    const json = JSON.parse(await readFile(baseline, 'utf8'));
    json.coverage.complete = true;
    json.coverage.capabilities[0].ok = false;
    await writeJson(baseline, json);

    const result = await runAction([
      '--target', 'test/fixtures/clean',
      '--baseline-report', baseline,
    ]);

    assert.equal(result.code, 1);
    assert.match(result.stderr, /baseline.*capabilit.*complete/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('baseline rejects duplicate finding ids instead of allowing ambiguous comparison', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-baseline-duplicate-'));
  const baseline = path.join(dir, 'baseline.json');
  try {
    const seed = await runAction(['--target', 'test/fixtures/vulnerable', '--report', baseline]);
    assert.equal(seed.code, 2, seed.stderr || seed.stdout);
    const json = JSON.parse(await readFile(baseline, 'utf8'));
    assert.ok(json.findings.length > 0);
    json.findings.push({ ...json.findings[0] });
    await writeJson(baseline, json);

    const result = await runAction([
      '--target', 'test/fixtures/vulnerable',
      '--baseline-report', baseline,
    ]);

    assert.equal(result.code, 1);
    assert.match(result.stderr, /baseline.*duplicate finding id/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('action report keeps inspectable regression reasons and resolved ids', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-baseline-evidence-'));
  const baseline = path.join(dir, 'baseline.json');
  const current = path.join(dir, 'current.json');
  try {
    const seed = await runAction(['--target', 'test/fixtures/clean', '--report', baseline]);
    assert.equal(seed.code, 0, seed.stderr || seed.stdout);

    const result = await runAction([
      '--target', 'test/fixtures/vulnerable',
      '--baseline-report', baseline,
      '--report', current,
    ]);
    assert.equal(result.code, 2, result.stderr || result.stdout);

    const report = JSON.parse(await readFile(current, 'utf8'));
    assert.equal(report.baseline?.mode, 'regression');
    assert.equal(report.baseline?.regressions > 0, true);
    assert.equal(Array.isArray(report.baseline?.regressionDetails), true);
    assert.equal(report.baseline.regressionDetails.every((item) => item.reason === 'new' || item.reason === 'severity-escalated'), true);
    assert.equal(Array.isArray(report.baseline?.resolvedFindingIds), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
