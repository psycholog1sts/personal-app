import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { makeFinding } from '../src/core/finding.js';
import { sha256Hex } from '../src/core/sha256.js';

async function importOrEmpty(specifier) {
  try {
    return await import(specifier);
  } catch {
    return {};
  }
}

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

test('browser-safe SHA-256 matches standard vectors', () => {
  assert.equal(
    sha256Hex(''),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );
  assert.equal(
    sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});

test('finding ids stay stable while browser dependency path contains no node imports', async () => {
  const finding = makeFinding({
    engine: 'native',
    rule: 'dangerous-eval',
    severity: 'high',
    title: 'Dynamic code execution detected',
    path: 'src/app.js',
    line: 12,
    evidence: 'eval(userInput)',
    remediation: 'Remove eval and use a typed parser.',
  });

  assert.equal(finding.id, 'gdn_a8f375f9a11a30d2');

  const findingSource = await readFile(new URL('../src/core/finding.js', import.meta.url), 'utf8');
  assert.equal(findingSource.includes('node:'), false);
});

test('virtual-file scanner preserves native findings without exposing secret material', async () => {
  const module = await importOrEmpty('../src/native/content-scan.js');
  assert.equal(typeof module.scanVirtualFiles, 'function');

  const fakeSecret = 'FAKE_SERVICE_ROLE_VALUE_SHOULD_NEVER_LEAK';
  const findings = module.scanVirtualFiles([
    { path: '.env', text: `SUPABASE_SERVICE_ROLE_KEY=${fakeSecret}\n` },
    { path: 'app.js', text: `const SERVICE_ROLE_KEY = '${fakeSecret}';\neval(userInput);\n` },
    { path: 'supabase/migrations/001.sql', text: 'create table public.profiles (id bigint);\n' },
  ]);

  assert.deepEqual(new Set(findings.map((finding) => finding.rule)), new Set([
    'sensitive-env-file',
    'supabase-service-role-client',
    'dangerous-eval',
    'supabase-public-table-without-rls',
  ]));
  assert.equal(JSON.stringify(findings).includes(fakeSecret), false);
});

test('browser quick scan uses public GitHub REST without a token and returns the existing report contract', async () => {
  const module = await importOrEmpty('../src/remote/browser-quick-scan.js');
  assert.equal(typeof module.browserQuickScanGithubRepo, 'function');

  const blobs = {
    appsha: Buffer.from('eval(userInput);\n').toString('base64'),
    sqlsha: Buffer.from('create table public.profiles (id bigint);\n').toString('base64'),
  };

  const fetchImpl = async (url, options = {}) => {
    assert.equal(options.headers?.authorization, undefined);

    if (url === 'https://api.github.com/repos/demo/repo') {
      return json({
        private: false,
        default_branch: 'main',
        size: 12,
        html_url: 'https://github.com/demo/repo',
      });
    }

    if (url === 'https://api.github.com/repos/demo/repo/git/trees/main?recursive=1') {
      return json({
        truncated: false,
        tree: [
          { path: 'app.js', type: 'blob', mode: '100644', size: 17, sha: 'appsha', url: 'https://api.github.com/repos/demo/repo/git/blobs/appsha' },
          { path: 'supabase/migrations/001.sql', type: 'blob', mode: '100644', size: 42, sha: 'sqlsha', url: 'https://api.github.com/repos/demo/repo/git/blobs/sqlsha' },
        ],
      });
    }

    const sha = String(url).split('/').at(-1);
    if (blobs[sha]) return json({ encoding: 'base64', content: blobs[sha] });
    return json({ message: 'not found' }, 404);
  };

  const report = await module.browserQuickScanGithubRepo('demo/repo', {
    fetchImpl,
    limits: {
      maxFiles: 10,
      maxFileBytes: 10000,
      maxTotalBytes: 10000,
      maxTreeEntries: 100,
      maxRepositoryKb: 1000,
    },
  });

  assert.equal(report.target, 'https://github.com/demo/repo');
  assert.equal(report.repository.defaultBranch, 'main');
  assert.equal(report.scope.mode, 'remote-quick');
  assert.equal(report.scope.filesScanned, 2);
  assert.equal(report.coverage.complete, false);
  assert.equal(report.releaseGate, 'blocked');
  assert.equal(report.readiness.score, 76);
  assert.deepEqual(new Set(report.findings.map((finding) => finding.rule)), new Set([
    'dangerous-eval',
    'supabase-public-table-without-rls',
  ]));
});
