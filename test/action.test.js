import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

function runNode(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: new URL('..', import.meta.url),
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

test('action.yml exposes native-default and opt-in full scan mode with pinned Node setup', async () => {
  const action = await readFile(new URL('../action.yml', import.meta.url), 'utf8');
  assert.match(action, /runs:\s*\n\s*using:\s*["']?composite["']?/);
  assert.match(action, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/);
  assert.match(action, /GITHUB_ACTION_PATH\/src\/action\/run\.js/);
  assert.match(action, /\n  scan-mode:\n/);
  assert.match(action, /scan-mode:[\s\S]*?default:\s*["']?native["']?/);
  assert.match(action, /RLSPROOF_SCAN_MODE:\s*\$\{\{\s*inputs\.scan-mode\s*\}\}/);
  assert.match(action, /release-gate:/);
  assert.match(action, /score:/);
  assert.match(action, /report-path:/);
  const outputs = action.split('\noutputs:')[1] ?? '';
  assert.match(outputs, /\n  scan-mode:\n/);
  assert.match(outputs, /\n  coverage-complete:\n/);
});

test('action runtime rejects an unsupported scan mode', async () => {
  const result = await runNode(['src/action/run.js', '--scan-mode', 'everything']);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /scan-mode.*native.*full/i);
});

test('action runtime writes outputs and blocks a vulnerable fixture', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-action-'));
  const output = path.join(dir, 'github-output.txt');
  const summary = path.join(dir, 'summary.md');
  const report = path.join(dir, 'report.json');
  try {
    const result = await runNode([
      'src/action/run.js',
      '--target', 'test/fixtures/vulnerable',
      '--report', report,
    ], {
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary,
    });

    assert.equal(result.code, 2, result.stderr || result.stdout);
    const outputText = await readFile(output, 'utf8');
    const summaryText = await readFile(summary, 'utf8');
    const reportJson = JSON.parse(await readFile(report, 'utf8'));

    assert.match(outputText, /release-gate=blocked/);
    assert.match(outputText, /score=/);
    assert.match(outputText, /findings=/);
    assert.match(outputText, /scan-mode=native/);
    assert.match(outputText, /coverage-complete=true/);
    assert.match(summaryText, /Release gate/i);
    assert.match(summaryText, /BLOCKED/);
    assert.equal(reportJson.releaseGate, 'blocked');
    assert.deepEqual(reportJson.scope.requestedEngines, ['native']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('action runtime succeeds for a clean native fixture without uploading source', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-action-'));
  const output = path.join(dir, 'github-output.txt');
  const summary = path.join(dir, 'summary.md');
  const report = path.join(dir, 'report.json');
  try {
    const result = await runNode([
      'src/action/run.js',
      '--target', 'test/fixtures/clean',
      '--report', report,
    ], {
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary,
    });

    assert.equal(result.code, 0, result.stderr || result.stdout);
    const outputText = await readFile(output, 'utf8');
    const reportJson = JSON.parse(await readFile(report, 'utf8'));
    assert.match(outputText, /release-gate=(clear|review|incomplete)/);
    assert.match(outputText, /scan-mode=native/);
    assert.match(outputText, /coverage-complete=true/);
    assert.deepEqual(reportJson.scope.requestedEngines, ['native']);
    assert.equal(Array.isArray(reportJson.findings), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('full action mode fails closed with exit 3 when requested external coverage is unavailable', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-action-full-'));
  const output = path.join(dir, 'github-output.txt');
  const report = path.join(dir, 'report.json');
  try {
    const result = await runNode([
      'src/action/run.js',
      '--target', 'test/fixtures/clean',
      '--report', report,
      '--scan-mode', 'full',
    ], {
      GITHUB_OUTPUT: output,
      PATH: '',
    });

    assert.equal(result.code, 3, result.stderr || result.stdout);
    const outputText = await readFile(output, 'utf8');
    const reportJson = JSON.parse(await readFile(report, 'utf8'));
    assert.equal(reportJson.releaseGate, 'incomplete');
    assert.equal(reportJson.coverage.complete, false);
    assert.deepEqual(reportJson.scope.requestedEngines, ['native', 'gitleaks', 'osv-scanner', 'opengrep']);
    assert.match(outputText, /scan-mode=full/);
    assert.match(outputText, /coverage-complete=false/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});