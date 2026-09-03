import test from 'node:test';
import assert from 'node:assert/strict';

import { GET as healthGet } from '../app/api/health/route.js';
import { POST as scanPost } from '../app/api/scan/route.js';

test('health route is no-store and exposes no environment data', async () => {
  const response = await healthGet();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  const body = await response.json();
  assert.deepEqual(body, { ok: true, service: 'guardian', version: '0.2.0' });
});

test('scan API rejects malformed JSON without contacting GitHub', async () => {
  const request = new Request('http://localhost/api/scan', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '198.51.100.10',
    },
    body: '{bad json',
  });

  const response = await scanPost(request);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Request body must be valid JSON.' });
});

test('scan API returns normalized findings and never returns raw source', async () => {
  const originalFetch = globalThis.fetch;
  const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

  globalThis.fetch = async (url) => {
    if (url === 'https://api.github.com/repos/demo/repo') {
      return json({ private: false, default_branch: 'main', size: 5, html_url: 'https://github.com/demo/repo' });
    }
    if (url === 'https://api.github.com/repos/demo/repo/git/trees/main?recursive=1') {
      return json({
        truncated: false,
        tree: [
          { path: 'app.js', type: 'blob', mode: '100644', size: 17, sha: 'appsha', url: 'https://api.github.com/repos/demo/repo/git/blobs/appsha' },
        ],
      });
    }
    if (url === 'https://api.github.com/repos/demo/repo/git/blobs/appsha') {
      return json({ encoding: 'base64', content: Buffer.from('eval(userInput);\n').toString('base64') });
    }
    return json({ message: 'not found' }, 404);
  };

  try {
    const request = new Request('http://localhost/api/scan', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '198.51.100.11',
      },
      body: JSON.stringify({ repository: 'demo/repo' }),
    });

    const response = await scanPost(request);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.target, 'https://github.com/demo/repo');
    assert.equal(body.releaseGate, 'blocked');
    assert.equal(body.findings.length, 1);
    assert.equal(body.findings[0].rule, 'dangerous-eval');
    assert.equal(JSON.stringify(body).includes('eval(userInput)'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
