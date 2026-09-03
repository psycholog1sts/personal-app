import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { scanProject } from '../src/scan.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const cleanFixture = path.join(repoRoot, 'test/fixtures/clean');
const srcRoot = path.join(repoRoot, 'src');
const opengrepConfig = path.join(repoRoot, 'config/opengrep.yml');
const enabled = process.env.GUARDIAN_EXTERNAL_INTEGRATION === '1';

function assertExternalCoverage(report) {
  const diagnostics = JSON.stringify(report.coverage.capabilities, null, 2);
  assert.equal(report.coverage.complete, true, `external coverage incomplete:\n${diagnostics}`);
  const byEngine = new Map(report.coverage.capabilities.map((capability) => [capability.engine, capability]));
  for (const engine of ['gitleaks', 'osv-scanner', 'opengrep']) {
    const capability = byEngine.get(engine);
    assert.ok(capability, `missing capability for ${engine}\n${diagnostics}`);
    assert.equal(capability.available, true, `${engine} must be installed\n${diagnostics}`);
    assert.equal(capability.ok, true, `${engine} must complete successfully\n${diagnostics}`);
  }
}

test('pinned external scanners complete a clean full scan', { skip: !enabled }, async () => {
  const report = await scanProject(cleanFixture, { nativeOnly: false, opengrepConfig });
  assertExternalCoverage(report);
  assert.deepEqual(report.findings, []);
  assert.equal(report.releaseGate, 'clear');
});

test('Guardian source self-scan has complete external coverage and no high/critical findings', { skip: !enabled }, async () => {
  const report = await scanProject(srcRoot, { nativeOnly: false, opengrepConfig });
  assertExternalCoverage(report);
  const blocking = report.findings.filter((finding) => ['critical', 'high'].includes(finding.severity));
  assert.deepEqual(blocking, []);
  assert.notEqual(report.releaseGate, 'blocked');
});
