import assert from 'node:assert/strict';
import test from 'node:test';

import { parseGitleaksJson } from '../src/adapters/gitleaks.js';
import { parseOpengrepJson } from '../src/adapters/opengrep.js';
import { parseOsvJson } from '../src/adapters/osv.js';
import { scanVirtualFiles } from '../src/native/content-scan.js';

function gitleaksFinding({ line = 4, source = 'const token = "FAKE_SECRET";', secret = 'FAKE_SECRET' } = {}) {
  return parseGitleaksJson(JSON.stringify([{
    RuleID: 'generic-api-key',
    Description: 'Generic API Key',
    File: 'src/config.js',
    StartLine: line,
    Secret: secret,
    Match: source,
    Line: source,
  }]))[0];
}

test('Gitleaks fingerprint follows sanitized code context across line movement without storing the secret', () => {
  const first = gitleaksFinding({ line: 4 });
  const moved = gitleaksFinding({ line: 40 });
  const changedContext = gitleaksFinding({ line: 40, source: 'const backupToken = "FAKE_SECRET";' });

  assert.equal(first.fingerprint, moved.fingerprint);
  assert.notEqual(first.fingerprint, changedContext.fingerprint);
  assert.equal(JSON.stringify(first).includes('FAKE_SECRET'), false);
});

test('Opengrep upstream fingerprint participates in RLSProof fingerprint identity', () => {
  const make = (fingerprint, line) => parseOpengrepJson(JSON.stringify({
    results: [{
      check_id: 'js.security.example',
      path: 'src/app.js',
      start: { line },
      extra: {
        severity: 'ERROR',
        message: 'Example static finding',
        fingerprint,
      },
    }],
  }))[0];

  const first = make('upstream-context-a', 10);
  const moved = make('upstream-context-a', 90);
  const differentMatch = make('upstream-context-b', 90);

  assert.equal(first.fingerprint, moved.fingerprint);
  assert.notEqual(first.fingerprint, differentMatch.fingerprint);
});

test('OSV fingerprint is based on package advisory identity rather than mutable summary wording', () => {
  const make = (summary, version = '1.0.0') => parseOsvJson(JSON.stringify({
    results: [{
      source: { path: 'package-lock.json' },
      packages: [{
        package: { name: 'example-package', version },
        vulnerabilities: [{ id: 'OSV-2026-TEST', summary, database_specific: { severity: 'HIGH' } }],
      }],
    }],
  }))[0];

  assert.equal(make('First wording').fingerprint, make('Editorially changed wording').fingerprint);
  assert.notEqual(make('Same advisory', '1.0.0').fingerprint, make('Same advisory', '2.0.0').fingerprint);
});

test('native SQL policy fingerprints distinguish separate policy definitions while ignoring line movement', () => {
  const firstText = `create policy tenant_read on public.items\nfor select using (auth.role() = 'authenticated');`;
  const movedText = `\n\n\n${firstText}`;
  const twoPolicies = `${firstText}\n\ncreate policy tenant_write on public.items\nfor update using (auth.role() = 'authenticated');`;

  const first = scanVirtualFiles([{ path: 'supabase/migrations/001.sql', text: firstText }])
    .filter((finding) => finding.rule === 'supabase-policy-deprecated-auth-role');
  const moved = scanVirtualFiles([{ path: 'supabase/migrations/001.sql', text: movedText }])
    .filter((finding) => finding.rule === 'supabase-policy-deprecated-auth-role');
  const distinct = scanVirtualFiles([{ path: 'supabase/migrations/001.sql', text: twoPolicies }])
    .filter((finding) => finding.rule === 'supabase-policy-deprecated-auth-role');

  assert.equal(first.length, 1);
  assert.equal(moved.length, 1);
  assert.equal(first[0].fingerprint, moved[0].fingerprint);
  assert.equal(distinct.length, 2);
  assert.notEqual(distinct[0].fingerprint, distinct[1].fingerprint);
});
