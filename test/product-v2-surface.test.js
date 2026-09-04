import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8');
}

test('product surface explains recurring release-proof value instead of a one-off scanner', async () => {
  const page = await read('app/page.js');
  const css = await read('app/globals.css');

  assert.match(page, /Can User B access User A['’]s data\?/i);
  assert.match(page, /every pull request/i);
  assert.match(page, /every deploy/i);
  assert.match(page, /tenant isolation/i);
  assert.match(page, /re-?test/i);
  assert.match(page, /policy drift/i);
  assert.match(page, /sample proof/i);
  assert.match(page, /not a security certification/i);

  assert.match(css, /proofMatrix/);
  assert.match(css, /workflowGrid/);
  assert.match(css, /proofTimeline/);
});
