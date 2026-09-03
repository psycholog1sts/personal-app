import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveScanTarget } from '../src/core/target.js';
import { runNativeScan } from '../src/native/scan.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const vulnerable = path.join(here, 'fixtures', 'vulnerable');
const clean = path.join(here, 'fixtures', 'clean');

test('resolveScanTarget rejects a nonexistent target', async () => {
  await assert.rejects(
    () => resolveScanTarget(path.join(here, 'fixtures', 'does-not-exist')),
    /does not exist/i,
  );
});

test('resolveScanTarget rejects a file target', async () => {
  await assert.rejects(
    () => resolveScanTarget(path.join(clean, 'app.js')),
    /directory/i,
  );
});

test('native scan finds expected production risks in vulnerable fixture', async () => {
  const findings = await runNativeScan(vulnerable);
  const rules = new Set(findings.map((finding) => finding.rule));

  assert.equal(rules.has('sensitive-env-file'), true);
  assert.equal(rules.has('supabase-service-role-client'), true);
  assert.equal(rules.has('dangerous-eval'), true);
  assert.equal(rules.has('supabase-public-table-without-rls'), true);
});

test('native scan does not emit vulnerable fixture rules for clean fixture', async () => {
  const findings = await runNativeScan(clean);
  const rules = new Set(findings.map((finding) => finding.rule));

  assert.equal(rules.has('sensitive-env-file'), false);
  assert.equal(rules.has('supabase-service-role-client'), false);
  assert.equal(rules.has('dangerous-eval'), false);
  assert.equal(rules.has('supabase-public-table-without-rls'), false);
});

test('native scan never exposes fake service role material in evidence', async () => {
  const findings = await runNativeScan(vulnerable);
  const serialized = JSON.stringify(findings);

  assert.equal(serialized.includes('FAKE_SERVICE_ROLE_VALUE_SHOULD_NEVER_LEAK'), false);
});
