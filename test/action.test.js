import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url);

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

test('action.yml exposes a composite PR release gate with pinned Node setup', async () => {
  const action = await readFile(new URL('../action.yml', import.meta.url), 'utf8');
  assert.match(action, /runs:\s*\n\s*using:\s*["']?composite["']?/);
  assert.match(action, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/);
  assert.match(action, /GITHUB_ACTION_PATH\/src\/action\/run\.js/);
  assert.match(action, /release-gate:/);
  assert.match(action, /score:/);
  assert.match(action, /report-path:/);
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
    assert.match(summaryText, /Release gate/i);
    assert.match(summaryText, /BLOCKED/);
    assert.equal(reportJson.releaseGate, 'blocked');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('action runtime succeeds for a clean fixture without uploading source', async () => {
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
    assert.equal(Array.isArray(reportJson.findings), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
