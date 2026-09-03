import test from 'node:test';
import assert from 'node:assert/strict';

import { parseGitHubRepository, selectCandidateFiles } from '../src/remote/github.js';
import { quickScanGithubRepo } from '../src/remote/quick-scan.js';

test('parseGitHubRepository accepts only canonical GitHub repository inputs', () => {
  assert.deepEqual(parseGitHubRepository('https://github.com/vercel/next.js'), {
    owner: 'vercel',
    repo: 'next.js',
  });
  assert.deepEqual(parseGitHubRepository('supabase/supabase'), {
    owner: 'supabase',
    repo: 'supabase',
  });

  assert.throws(() => parseGitHubRepository('http://github.com/a/b'), /valid GitHub repository/i);
  assert.throws(() => parseGitHubRepository('https://evil.example/a/b'), /valid GitHub repository/i);
  assert.throws(() => parseGitHubRepository('https://github.com/a/b/issues/1'), /valid GitHub repository/i);
});

test('selectCandidateFiles is deterministic and excludes unsafe or irrelevant files', () => {
  const tree = [
    { path: 'README.md', type: 'blob', mode: '100644', size: 40, sha: 'readme' },
    { path: 'app.js', type: 'blob', mode: '100644', size: 20, sha: 'app' },
    { path: '.env', type: 'blob', mode: '100644', size: 10, sha: 'env' },
    { path: 'supabase/migrations/001.sql', type: 'blob', mode: '100644', size: 30, sha: 'sql' },
    { path: 'node_modules/pkg/index.js', type: 'blob', mode: '100644', size: 20, sha: 'node-modules' },
    { path: '.next/server.js', type: 'blob', mode: '100644', size: 20, sha: 'next' },
    { path: 'link.js', type: 'blob', mode: '120000', size: 12, sha: 'link' },
    { path: 'huge.ts', type: 'blob', mode: '100644', size: 5000, sha: 'huge' },
  ];

  const result = selectCandidateFiles(tree, {
    maxFiles: 10,
    maxFileBytes: 1000,
    maxTotalBytes: 2000,
  });

  assert.deepEqual(result.files.map((entry) => entry.path), [
    '.env',
    'app.js',
    'supabase/migrations/001.sql',
  ]);
  assert.equal(result.totalBytes, 60);
  assert.equal(result.truncated, false);
});

test('quickScanGithubRepo scans bounded public GitHub content without retaining full source', async () => {
  const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

  const blobs = {
    appsha: Buffer.from('eval(userInput);\n').toString('base64'),
    sqlsha: Buffer.from('create table public.profiles (id bigint);\n').toString('base64'),
  };

  const fetchImpl = async (url, options = {}) => {
    assert.equal(options.headers?.authorization, 'Bearer test-token');
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

  const report = await quickScanGithubRepo('demo/repo', {
    fetchImpl,
    token: 'test-token',
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
