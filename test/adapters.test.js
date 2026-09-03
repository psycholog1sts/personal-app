import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runTool } from '../src/adapters/process.js';
import { parseGitleaksJson } from '../src/adapters/gitleaks.js';
import { parseOsvJson } from '../src/adapters/osv.js';
import { parseOpengrepJson } from '../src/adapters/opengrep.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const adapterFixtures = path.join(here, 'fixtures', 'adapters');

async function fixture(name) {
  return readFile(path.join(adapterFixtures, name), 'utf8');
}

test('runTool passes hostile-looking arguments without invoking a shell', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'guardian-process-'));
  const marker = path.join(temp, 'should-not-exist');
  const hostile = `; touch ${marker}`;
  const result = await runTool(process.execPath, ['-e', 'console.log(process.argv[1])', hostile], { cwd: temp });

  assert.equal(result.ok, true);
  assert.equal(result.stdout.trim(), hostile);
  await assert.rejects(() => access(marker));
});

test('runTool reports a missing executable as a capability gap', async () => {
  const result = await runTool('guardian-tool-that-does-not-exist-4f519e', []);

  assert.equal(result.ok, false);
  assert.equal(result.missing, true);
  assert.equal(result.code, null);
});

test('gitleaks parser normalizes findings and never exposes Secret or Match values', async () => {
  const raw = await fixture('gitleaks.json');
  const findings = parseGitleaksJson(raw);
  const serialized = JSON.stringify(findings);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].engine, 'gitleaks');
  assert.equal(findings[0].rule, 'generic-api-key');
  assert.equal(findings[0].path, 'src/config.js');
  assert.equal(findings[0].line, 4);
  assert.equal(serialized.includes('FAKE_GITLEAKS_SECRET_NEVER_OUTPUT'), false);
});

test('OSV parser emits one normalized finding per vulnerability', async () => {
  const findings = parseOsvJson(await fixture('osv.json'));

  assert.equal(findings.length, 1);
  assert.equal(findings[0].engine, 'osv-scanner');
  assert.equal(findings[0].rule, 'GHSA-test-0000-0000');
  assert.match(findings[0].evidence, /example-package@1\.0\.0/);
});

test('Opengrep parser maps machine severity and source location', async () => {
  const findings = parseOpengrepJson(await fixture('opengrep.json'));

  assert.equal(findings.length, 1);
  assert.equal(findings[0].engine, 'opengrep');
  assert.equal(findings[0].rule, 'guardian.insecure-innerhtml');
  assert.equal(findings[0].severity, 'high');
  assert.equal(findings[0].path, 'src/view.js');
  assert.equal(findings[0].line, 8);
});
