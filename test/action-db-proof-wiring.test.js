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

test('action manifest exposes DB proof input and output without enabling it by default', async () => {
  const action = await readFile(new URL('../action.yml', import.meta.url), 'utf8');
  assert.match(action, /\n  db-proof:\n/);
  assert.match(action, /default:\s*["']?off["']?/);
  assert.match(action, /RLSPROOF_DB_PROOF:\s*\$\{\{\s*inputs\.db-proof\s*\}\}/);
  const outputs = action.split('\noutputs:')[1] ?? '';
  assert.match(outputs, /\n  db-proof:\n/);
});

test('required DB proof blocks a clean static fixture when pgTAP tests are absent', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-action-db-'));
  const output = path.join(dir, 'github-output.txt');
  const summary = path.join(dir, 'summary.md');
  const report = path.join(dir, 'report.json');

  try {
    const result = await runNode([
      'src/action/run.js',
      '--target', 'test/fixtures/clean',
      '--report', report,
      '--db-proof', 'required',
    ], {
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary,
    });

    assert.equal(result.code, 2, result.stderr || result.stdout);
    const outputText = await readFile(output, 'utf8');
    const summaryText = await readFile(summary, 'utf8');
    const reportJson = JSON.parse(await readFile(report, 'utf8'));

    assert.equal(reportJson.releaseGate, 'blocked');
    assert.equal(reportJson.proof?.database?.status, 'missing-tests');
    assert.match(outputText, /db-proof=missing-tests/);
    assert.match(summaryText, /Database proof/i);
    assert.match(summaryText, /MISSING-TESTS/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
