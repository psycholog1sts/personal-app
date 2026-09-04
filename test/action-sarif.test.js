import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url);

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

test('composite Action exposes SARIF output without silently requesting code-scanning permissions', async () => {
  const action = await readFile(new URL('../action.yml', import.meta.url), 'utf8');

  assert.match(action, /\n  sarif-path:\n/);
  assert.match(action, /sarif-path:[\s\S]*?default:\s*["']?rlsproof-results\.sarif["']?/);
  assert.match(action, /RLSPROOF_SARIF_PATH:\s*\$\{\{\s*inputs\.sarif-path\s*\}\}/);
  const outputs = action.split('\noutputs:')[1] ?? '';
  assert.match(outputs, /\n  sarif-path:\n/);
  assert.doesNotMatch(action, /security-events\s*:/i);
  assert.doesNotMatch(action, /upload-sarif/i);
});

test('blocked Action run still writes a safe SARIF artifact and output path', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-action-sarif-'));
  const report = path.join(dir, 'report.json');
  const sarif = path.join(dir, 'results.sarif');
  const output = path.join(dir, 'github-output.txt');
  try {
    const result = await runAction([
      '--target', 'test/fixtures/vulnerable',
      '--report', report,
      '--sarif', sarif,
    ], { GITHUB_OUTPUT: output });

    assert.equal(result.code, 2, result.stderr || result.stdout);
    const sarifText = await readFile(sarif, 'utf8');
    const sarifJson = JSON.parse(sarifText);
    assert.equal(sarifJson.version, '2.1.0');
    assert.ok(sarifJson.runs[0].results.length > 0);
    assert.equal(sarifText.includes('FAKE_SERVICE_ROLE_VALUE_SHOULD_NEVER_LEAK'), false);
    assert.match(await readFile(output, 'utf8'), new RegExp(`sarif-path=${sarif.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('Action rejects report, baseline and SARIF path collisions before overwriting evidence', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'rlsproof-action-sarif-collision-'));
  const same = path.join(dir, 'same.json');
  try {
    const reportCollision = await runAction([
      '--target', 'test/fixtures/clean',
      '--report', same,
      '--sarif', same,
    ]);
    assert.equal(reportCollision.code, 1);
    assert.match(reportCollision.stderr, /sarif.*report.*different|report.*sarif.*different/i);

    const baselineCollision = await runAction([
      '--target', 'test/fixtures/clean',
      '--baseline-report', same,
      '--sarif', same,
    ]);
    assert.equal(baselineCollision.code, 1);
    assert.match(baselineCollision.stderr, /sarif.*baseline.*different|baseline.*sarif.*different/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
