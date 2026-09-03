import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runNativeScan } from '../src/native/scan.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(here, '../src');

test('native scanner does not flag its own detection implementation as a vulnerability', async () => {
  const findings = await runNativeScan(srcRoot);
  const selfFalsePositives = findings.filter((finding) =>
    ['supabase-service-role-client', 'dangerous-eval'].includes(finding.rule),
  );
  assert.deepEqual(selfFalsePositives, []);
});
